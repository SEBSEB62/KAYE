import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { generateAndStoreLicenseKey } from './licenseService';
import * as firebaseService from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { SubscriptionPlan } from '../types';

// Mock the dependencies
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn().mockResolvedValue(undefined),
    serverTimestamp: vi.fn(),
}));

vi.mock('@google/genai');

describe('generateAndStoreLicenseKey in licenseService', () => {
    const plan = SubscriptionPlan.PRO;
    const duration = 90;
    const userId = 'user-123';
    const userEmail = 'test@example.com';
    const mockGenAI = {
        models: {
            generateContent: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock implementation for GoogleGenAI
        (GoogleGenAI as Mock).mockReturnValue(mockGenAI);
        // Mock process.env
        // FIX: The application uses VITE_GEMINI_API_KEY, so the test stub should match.
        vi.stubGlobal('process', { env: { VITE_GEMINI_API_KEY: 'test-api-key' } });
    });
    
    it('should generate a key using Gemini API and store it when API is available and format is correct', async () => {
        const validKey = 'BUVPLUS-ABCD-1234-EFGH';
        mockGenAI.models.generateContent.mockResolvedValue({ text: ` ${validKey} ` }); // Test trimming

        const key = await generateAndStoreLicenseKey(plan, duration, userId, userEmail);

        expect(key).toBe(validKey);
        expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
        expect(mockGenAI.models.generateContent).toHaveBeenCalled();
        expect(firebaseService.setDoc).toHaveBeenCalled();
    });

    it('should generate a fallback key if Gemini returns an invalid format', async () => {
        mockGenAI.models.generateContent.mockResolvedValue({ text: 'invalid-key-format' });

        const key = await generateAndStoreLicenseKey(plan, duration, userId, userEmail);

        expect(key).toMatch(/^BUVPLUS-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
        expect(key).not.toBe('invalid-key-format');
        expect(firebaseService.setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ plan, duration }));
    });

    it('should generate a fallback key if Gemini API call fails', async () => {
        mockGenAI.models.generateContent.mockRejectedValue(new Error('API Error'));

        const key = await generateAndStoreLicenseKey(plan, duration, userId, userEmail);

        expect(key).toMatch(/^BUVPLUS-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
        expect(firebaseService.setDoc).toHaveBeenCalled();
    });

    it('should generate a fallback key if API_KEY is not configured', async () => {
        vi.stubGlobal('process', { env: {} }); // No API_KEY

        const key = await generateAndStoreLicenseKey(plan, duration, userId, userEmail);
        
        expect(key).toMatch(/^BUVPLUS-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
        expect(GoogleGenAI).not.toHaveBeenCalled();
        expect(firebaseService.setDoc).toHaveBeenCalled();
    });
});

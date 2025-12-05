import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock localStorage and clear it after each test
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

afterEach(() => {
  localStorageMock.clear();
  cleanup(); // Unmounts React trees that were mounted with render.
});

// Mock Firebase. We can override these mocks in specific tests if needed.
vi.mock('./services/firebaseService', () => ({
  isFirebaseEnabled: true,
  verifyAndActivateLicense: vi.fn().mockResolvedValue({ success: true, plan: 'Pro', duration: 30 }),
}));


// Mock Gemini API client (@google/genai) directly for any other potential use
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: 'BUVPLUS-GEMINI-MOCK-KEY' }),
    },
  })),
  Type: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING',
  },
}));


// Mock crypto for deterministic results in tests
let uuidCounter = 0;
vi.stubGlobal('crypto', {
    ...window.crypto,
    randomUUID: () => `mock-uuid-${uuidCounter++}`,
    getRandomValues: (buffer: Uint8Array) => {
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = (i * 10 + 5) % 256; // Fill with deterministic values
        }
        return buffer;
    },
});

// Mock window.matchMedia for recharts library used in StatsPage
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
});

// Mock jsPDF and autoTable for receipt generation tests
vi.mock('jspdf', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            text: vi.fn(),
            addImage: vi.fn(),
            save: vi.fn(),
            setFont: vi.fn(),
            setFontSize: vi.fn(),
            setDrawColor: vi.fn(),
            line: vi.fn(),
            setTextColor: vi.fn(),
            internal: {
                pageSize: {
                    getHeight: () => 297,
                    getWidth: () => 210,
                },
            },
        })),
    };
});

vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}));
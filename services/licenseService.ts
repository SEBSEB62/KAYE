import { GoogleGenAI } from "@google/genai";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db as firebaseDb } from './firebaseService';
import { SubscriptionPlan } from '../types';


/**
 * Stores a new license key in Firestore with the status "available".
 * @param key The license key to store.
 * @param plan The subscription plan for the key.
 * @param duration The validity duration in days.
 * @param userId The ID of the user for whom the key is generated.
 * @param userEmail The email of the user for whom the key is generated.
 * @returns A promise that resolves when the key is stored, or throws on failure.
 */
const storeLicenseKey = async (key: string, plan: SubscriptionPlan, duration: number, userId: string, userEmail: string): Promise<void> => {
  if (!firebaseDb) {
    console.error('[LICENSE_SERVICE] Firebase is not initialized. Cannot store license key.');
    throw new Error("Le service de base de données n'est pas disponible.");
  }
  
  if (!navigator.onLine) {
      console.warn('[LICENSE_SERVICE] Offline. Cannot store license key.');
      throw new Error("Vous êtes hors ligne. Impossible de contacter la base de données pour stocker la clé.");
  }

  try {
      console.log(`[LICENSE_SERVICE] Storing license key: Key=${key}, Plan=${plan}, Duration=${duration}d, Client=${userEmail}`);
      const licenseRef = doc(firebaseDb, 'licenses', key);
      await setDoc(licenseRef, {
        status: 'available',
        createdAt: serverTimestamp(),
        plan,
        duration,
        generatedFor: {
            userId,
            userEmail,
        },
      });
  } catch (error: any) {
      console.error("[LICENSE_SERVICE] Firebase error while storing key:", error);
      if (error?.code === 'unavailable') {
          throw new Error("Connexion au serveur impossible. Vérifiez votre connexion Internet.");
      }
      throw new Error("Une erreur inattendue est survenue lors de la sauvegarde de la clé.");
  }
};

/**
 * Generates a fallback license key locally and stores it.
 * @param plan The subscription plan for the key.
 * @param duration The validity duration in days.
 * @param userId The ID of the user for whom the key is generated.
 * @param userEmail The email of the user for whom the key is generated.
 * @param reason The reason why the fallback is being used.
 * @returns A promise that resolves with the generated fallback key.
 */
const generateFallbackKey = async (plan: SubscriptionPlan, duration: number, userId: string, userEmail: string, reason: string): Promise<string> => {
    console.warn(`[LICENSE_SERVICE] Generating fallback key. Reason: ${reason}`);
    const generateRandomPart = () => {
        return Array.from(crypto.getRandomValues(new Uint8Array(2)))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    };
    const fallbackKey = `BUVPLUS-${generateRandomPart()}-${generateRandomPart()}-${generateRandomPart()}`;
    
    try {
        await storeLicenseKey(fallbackKey, plan, duration, userId, userEmail);
        console.log(`[LICENSE_SERVICE] Fallback key generated and stored: ${fallbackKey}`);
        return fallbackKey;
    } catch (dbError) {
         console.error("[LICENSE_SERVICE] Error storing fallback key:", dbError);
         throw new Error("Failed to save fallback key.");
    }
};

/**
 * Generates a unique license key. It first attempts to use the Gemini API if an API key is provided.
 * If the API key is missing, or if the API call fails or returns an invalid format, 
 * it seamlessly falls back to a local key generator.
 * @param plan The subscription plan for the key.
 * @param duration The validity duration in days.
 * @param userId The ID of the user for whom the key is generated.
 * @param userEmail The email of the user for whom the key is generated.
 * @returns {Promise<string>} A promise that resolves with the generated and stored license key.
 */
export const generateAndStoreLicenseKey = async (plan: SubscriptionPlan, duration: number, userId: string, userEmail: string): Promise<string> => {
    console.log(`[LICENSE_SERVICE] Starting key generation for ${userEmail} (Plan: ${plan}, Duration: ${duration}d)`);
    
    if (!process.env.VITE_GEMINI_API_KEY) {
        return generateFallbackKey(plan, duration, userId, userEmail, "VITE_GEMINI_API_KEY not configured.");
    }
    
    try {
        console.log("[LICENSE_SERVICE] Attempting generation via Gemini API.");
        const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
        
        const prompt = `Generate a unique, secure, and memorable license key for a software product named "Buvette+".
        The key must follow the format: BUVPLUS-XXXX-XXXX-XXXX where X is an alphanumeric character (A-Z, 0-9).
        The key must be completely random. Only return the key itself, with no extra text, explanation, or markdown.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const generatedKeyText = response.text;
        console.log(`[LICENSE_SERVICE] Key received from Gemini: "${generatedKeyText}"`);

        if (!generatedKeyText) {
            return generateFallbackKey(plan, duration, userId, userEmail, `Empty response from Gemini.`);
        }
        
        const generatedKey = generatedKeyText.trim();

        if (!/^BUVPLUS-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/.test(generatedKey)) {
            return generateFallbackKey(plan, duration, userId, userEmail, `Invalid key format from Gemini: "${generatedKey}"`);
        }

        await storeLicenseKey(generatedKey, plan, duration, userId, userEmail);
        console.log(`[LICENSE_SERVICE] Valid Gemini key generated and stored: ${generatedKey}`);
        return generatedKey;

    } catch (error) {
        console.error("Error generating license key with Gemini, using fallback:", error);
        return generateFallbackKey(plan, duration, userId, userEmail, `Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
    }
};
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    Auth,
    User as FirebaseUser,
} from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { SubscriptionPlan } from '../types';


// --- Configuration via les Variables d'Environnement ---
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID
};

// --- Initialisation sécurisée de Firebase ---
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Vérification basique de la présence de la clé API
const isFirebaseConfigured = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error("Échec de l'initialisation de Firebase. Passage en mode local.", e);
        auth = null;
        db = null;
    }
} else {
    console.warn("Configuration Firebase manquante. L'application fonctionnera en mode local (Mock).");
}

export { app, db };
export const isFirebaseEnabled = !!auth && !!db;

// --- MOCK SYSTEM (Mode Local) ---
// Ce système prend le relais si Firebase n'est pas configuré pour ne pas bloquer l'utilisateur.
const MOCK_STORAGE_KEY = 'kaye_mock_user_session';
let mockListeners: ((user: any) => void)[] = [];

const getMockUser = () => {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
};

const setMockUser = (email: string) => {
    const user = { uid: 'local-user-' + Date.now(), email: email };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
    mockListeners.forEach(l => l(user));
    return user;
};

const clearMockUser = () => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    mockListeners.forEach(l => l(null));
};

/**
 * Maps Firebase error codes to user-friendly French messages.
 */
const mapAuthErrorToMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email': return "L'adresse email n'est pas valide.";
        case 'auth/user-disabled': return "Ce compte utilisateur a été désactivé.";
        case 'auth/user-not-found': return "Aucun compte trouvé avec cet email.";
        case 'auth/wrong-password': return "Mot de passe incorrect.";
        case 'auth/email-already-in-use': return "Cette adresse email est déjà utilisée.";
        case 'auth/weak-password': return "Le mot de passe est trop faible.";
        default: return "Une erreur est survenue.";
    }
};


/**
 * Registers a new user. Falls back to local storage if Firebase is missing.
 */
export const signUp = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (auth) {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, message: 'Compte créé avec succès !' };
        } catch (error: any) {
            return { success: false, message: mapAuthErrorToMessage(error.code) };
        }
    } else {
        // Mock Implementation
        setMockUser(email);
        return { success: true, message: 'Compte local créé avec succès !' };
    }
};

/**
 * Signs in an existing user. Falls back to local storage if Firebase is missing.
 */
export const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (auth) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true, message: 'Connexion réussie !' };
        } catch (error: any) {
            return { success: false, message: mapAuthErrorToMessage(error.code) };
        }
    } else {
        // Mock Implementation
        setMockUser(email);
        return { success: true, message: 'Connexion locale réussie !' };
    }
};

/**
 * Signs out the current user.
 */
export const logOut = async (): Promise<void> => {
    if (auth) {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    } else {
        // Mock Implementation
        clearMockUser();
    }
};

/**
 * Sets up a listener for authentication state changes.
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
    if (auth) {
        return onAuthStateChanged(auth, callback);
    } else {
        // Mock Implementation
        // Register listener
        const listener = (user: any) => callback(user);
        mockListeners.push(listener);
        // Fire immediately with current status
        callback(getMockUser());
        
        // Return unsubscribe function
        return () => {
            mockListeners = mockListeners.filter(l => l !== listener);
        };
    }
};

/**
 * Verifies a license key. Uses a Mock check if Firebase is missing.
 */
export const verifyAndActivateLicense = async (key: string, userId: string): Promise<{
    success: boolean;
    message?: string;
    plan?: SubscriptionPlan;
    duration?: number;
}> => {
    if (!db) {
        // Mock Verification for Offline/Local Mode
        // Allows any key starting with "TEST" or "KAYE" to pass in local mode
        if (key.startsWith('TEST') || key.startsWith('KAYE') || key.startsWith('BUVPLUS')) {
             return {
                success: true,
                plan: SubscriptionPlan.PRO,
                duration: 365,
                message: "Licence locale activée (Mode hors-ligne)"
            };
        }
        return { success: false, message: "Mode hors-ligne : Utilisez une clé commençant par 'BUVPLUS' ou 'TEST'." };
    }

    try {
        const licenseRef = doc(db, 'licenses', key);
        const licenseSnap = await getDoc(licenseRef);

        if (!licenseSnap.exists()) {
            return { success: false, message: "Cette clé de licence n'existe pas." };
        }

        const licenseData = licenseSnap.data();

        if (licenseData.status !== 'available') {
            return { success: false, message: "Cette clé a déjà été utilisée ou est invalide." };
        }

        if (!licenseData.generatedFor || licenseData.generatedFor.userId !== userId) {
            return { success: false, message: "Cette clé n'est pas assignée à votre compte utilisateur." };
        }
        
        await updateDoc(licenseRef, {
            status: 'activated',
            activatedAt: serverTimestamp(),
            activatedBy: userId,
        });

        return {
            success: true,
            plan: licenseData.plan,
            duration: licenseData.duration,
        };

    } catch (error: any) {
        console.error("Error verifying license key:", error);
         if (error?.code === 'unavailable' || error?.code === 'network-request-failed') {
            return { success: false, message: "Impossible de vérifier la licence. Vérifiez votre connexion internet." };
        }
        return { success: false, message: "Une erreur est survenue lors de la vérification de la clé." };
    }
};

const DB_NAME = 'BuvettePlusDB';
const DB_VERSION = 1;
const STORE_NAME = 'userData';

interface UserData {
    [key: string]: any;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        // IndexedDB est natif au navigateur, pas besoin de serveur externe.
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event);
            reject("Impossible d'ouvrir la base de données locale.");
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const saveUserData = async (userId: string, data: UserData): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // IndexedDB permet de stocker des objets JS complexes (Blobs, Arrays) directement
        // sans avoir besoin de les convertir en chaînes de caractères (JSON/Base64).
        const request = store.put(data, userId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Erreur lors de la sauvegarde des données.");
    });
};

export const loadUserData = async (userId: string): Promise<UserData | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(userId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject("Erreur lors du chargement des données.");
    });
};

export const deleteUserData = async (userId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(userId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject("Erreur lors de la suppression des données.");
    });
};

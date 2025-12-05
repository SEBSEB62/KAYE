import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { SubscriptionPlan } from './types';
import { KeyIcon, SpinnerIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from './components/Icons';
import { generateAndStoreLicenseKey } from './services/licenseService';
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db as firebaseDb } from './services/firebaseService';


// --- Configuration de Sécurité ---
// ATTENTION : Changez ce mot de passe pour quelque chose de secret et de complexe !
// C'est la clé qui protège votre panneau de génération de licences.
const SUPER_ADMIN_SECRET = 'CHANGER_CE_MOT_DE_PASSE_SECRET_123!';


// --- Interfaces ---
interface License {
    id: string;
    status: 'available' | 'activated';
    plan: SubscriptionPlan;
    duration: number;
    generatedFor: { userId: string; userEmail: string };
    createdAt: Date;
    activatedAt?: Date;
}


// --- Fonctions de service ---
async function fetchAllLicenses(): Promise<License[]> {
    if (!firebaseDb) {
        throw new Error("Firebase non configuré. Impossible de charger les licences.");
    }
    if (!navigator.onLine) {
        throw new Error("Vous êtes hors ligne. Impossible de charger les licences.");
    }
    try {
        const licensesCol = collection(firebaseDb, "licenses");
        const snapshot = await getDocs(licensesCol);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                status: data.status,
                plan: data.plan,
                duration: data.duration,
                generatedFor: data.generatedFor,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                activatedAt: (data.activatedAt as Timestamp)?.toDate(),
            };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
        console.error("Erreur lors de la récupération des licences:", error);
        if (error?.code === 'unavailable') {
            throw new Error("Connexion au serveur impossible. Vérifiez votre connexion Internet.");
        }
        throw new Error("Une erreur inattendue est survenue lors du chargement des licences.");
    }
}

// --- Composants React ---

const AuthScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === SUPER_ADMIN_SECRET) {
            onSuccess();
        } else {
            setError('Mot de passe incorrect.');
            setPassword('');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-amber-500/50 w-full max-w-sm">
                <LockClosedIcon className="w-16 h-16 text-amber-400 mx-auto" />
                <h1 className="text-3xl font-display text-amber-400 mt-4 text-center">Accès Super Administrateur</h1>
                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                     <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border-2 bg-black/20 text-white border-white/10 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 text-center transition"
                            placeholder="Mot de passe"
                            autoFocus
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 font-display text-lg">
                        Connexion
                    </button>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.STANDARD);
    const [duration, setDuration] = useState<number>(30);
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [licenses, setLicenses] = useState<License[]>([]);
    const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
    const isApiAvailable = !!process.env.VITE_GEMINI_API_KEY;

    const handleGenerate = async () => {
        if (!userEmail || !userId) {
            setError("L'email et l'ID du client sont requis.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedKey(null);
        try {
            const key = await generateAndStoreLicenseKey(plan, duration, userId, userEmail);
            setGeneratedKey(key);
            handleFetchLicenses(); 
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.';
            setError(`Impossible de générer la clé : ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFetchLicenses = async () => {
        setIsLoadingLicenses(true);
        setError(null);
        try {
            const fetchedLicenses = await fetchAllLicenses();
            setLicenses(fetchedLicenses);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Impossible de charger la liste des licences.";
            setError(message);
        } finally {
            setIsLoadingLicenses(false);
        }
    };
    
    useEffect(() => {
        handleFetchLicenses();
    }, []);

    const inputStyles = "block w-full p-3 bg-[#1a1a1a] border-2 border-white/20 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition";

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="text-center">
                <KeyIcon className="w-16 h-16 text-amber-400 mx-auto" />
                <h1 className="text-4xl font-display text-amber-400 mt-4">Panneau Super Admin</h1>
                <p className="text-slate-400 mt-2">Générez et gérez les clés de licence pour vos clients.</p>
            </div>

            <section className="bg-[#2a2a2a] p-6 rounded-2xl shadow-lg border border-white/10 space-y-4">
                <h2 className="text-2xl font-display text-slate-200">Générer une Clé</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email du client</label>
                        <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="client@email.com" className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">ID du client (UID Firebase)</label>
                        <input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Trouvé dans la console Firebase" className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Plan</label>
                        <select value={plan} onChange={e => setPlan(e.target.value as SubscriptionPlan)} className={inputStyles}>
                            <option value={SubscriptionPlan.ESSENTIEL}>Essentiel</option>
                            <option value={SubscriptionPlan.STANDARD}>Standard</option>
                            <option value={SubscriptionPlan.PRO}>Pro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Durée (jours)</label>
                        <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10) || 0)} className={inputStyles} min="1"/>
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isLoading || !isApiAvailable} className="w-full flex items-center justify-center bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : 'Générer la Clé'}
                </button>
                 {!isApiAvailable && <p className="text-red-400 text-sm text-center">La génération est désactivée (VITE_GEMINI_API_KEY manquante).</p>}
            </section>

            {error && <p className="text-red-400 p-4 bg-red-900/30 rounded-lg text-center">{error}</p>}
            {generatedKey && (
                 <div className="p-4 bg-black/30 rounded-xl border-2 border-dashed border-amber-500 text-center">
                    <p className="text-sm text-slate-300">Clé générée pour {userEmail} :</p>
                    <div className="my-2 p-3 bg-[#1a1a1a] rounded-lg text-amber-300 font-mono text-lg break-all select-all">{generatedKey}</div>
                </div>
            )}
            
            <section className="bg-[#2a2a2a] p-6 rounded-2xl shadow-lg border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-display text-slate-200">Licences Existantes</h2>
                    <button onClick={handleFetchLicenses} disabled={isLoadingLicenses} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-full shadow-md text-sm hover:bg-slate-700 disabled:opacity-50">
                        {isLoadingLicenses ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : "Rafraîchir"}
                    </button>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black/30 text-xs text-slate-300 uppercase sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">Clé</th>
                                <th className="px-4 py-3">Client (Email)</th>
                                <th className="px-4 py-3">ID Client</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Créée le</th>
                                <th className="px-4 py-3">Activée le</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                        {licenses.map(lic => (
                            <tr key={lic.id} className="hover:bg-black/20">
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${lic.status === 'activated' ? 'bg-red-800 text-red-200' : 'bg-emerald-800 text-emerald-200'}`}>
                                        {lic.status === 'activated' ? 'Utilisée' : 'Dispo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-amber-300">{lic.id}</td>
                                <td className="px-4 py-3">{lic.generatedFor.userEmail}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-400 select-all">{lic.generatedFor.userId}</td>
                                <td className="px-4 py-3">{lic.plan} ({lic.duration}j)</td>
                                <td className="px-4 py-3">{lic.createdAt.toLocaleDateString('fr-FR')}</td>
                                <td className="px-4 py-3">{lic.activatedAt ? lic.activatedAt.toLocaleString('fr-FR') : '—'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                     {licenses.length === 0 && <p className="text-center p-4 text-slate-500">Aucune licence trouvée.</p>}
                </div>
            </section>
        </div>
    );
};


const AdminApp: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return <AuthScreen onSuccess={() => setIsAuthenticated(true)} />;
    }

    return <AdminDashboard />;
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
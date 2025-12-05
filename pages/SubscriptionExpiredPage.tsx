import React, { useState } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { LockClosedIcon } from '../components/Icons';

const SubscriptionExpiredPage: React.FC = () => {
    const { activateApp, showToast } = useBuvette();
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!key) {
             showToast("Veuillez entrer une clé d'activation.", "error");
             return;
        }
        setIsLoading(true);
        const result = await activateApp(key);
        if (!result.success) {
            setError(result.message || "Clé d'activation incorrecte ou invalide. Veuillez réessayer.");
            setTimeout(() => setError(''), 5000);
        }
        // En cas de succès, l'état de l'application changera et ce composant sera démonté.
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-[#1a1a1a]">
            <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-amber-500/50 max-w-md w-full">
                <div className="text-7xl mb-4">⏳</div>
                <h1 className="text-3xl font-display text-amber-400">Continuez l'aventure Buvette+</h1>
                <p className="text-slate-300 mt-4">
                    Votre abonnement a expiré, mais toutes vos données sont conservées en sécurité. Réactivez votre licence pour retrouver l'accès à vos outils de gestion.
                </p>
                <p className="text-sm text-slate-400 mt-4">
                    Besoin d'une nouvelle licence ? Contactez le support ou consultez les offres sur la page "Abonnement".
                </p>
                
                <form onSubmit={handleActivation} className="mt-8 space-y-4">
                    <div>
                        <label htmlFor="activation-key" className="sr-only">Clé d'activation</label>
                        <div className="relative">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <LockClosedIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                id="activation-key"
                                value={key}
                                onChange={(e) => setKey(e.target.value.toUpperCase())}
                                className="w-full p-3 pl-10 border-2 bg-black/20 text-white border-white/10 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 text-center transition"
                                placeholder="Entrez votre clé ici"
                                autoFocus
                                required
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !key}
                        className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:bg-slate-600 disabled:opacity-50"
                    >
                        {isLoading ? "Activation..." : "Activer ma nouvelle licence"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default React.memo(SubscriptionExpiredPage);
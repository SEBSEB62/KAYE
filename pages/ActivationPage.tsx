import React, { useState, memo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { KeyIcon, WalletIcon, LockClosedIcon, SpinnerIcon } from '../components/Icons';
import { Page } from '../types';

interface ActivationPageProps {
  isFirstRun: boolean;
  setPage: (page: Page) => void;
}

// A reusable component for the activation form, now part of this file
const ActivationForm: React.FC<{
    onSubmit: (key: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}> = ({ onSubmit, isLoading, error }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key && !isLoading) {
            onSubmit(key);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="activation-key" className="sr-only">Clé d'activation</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LockClosedIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        id="activation-key"
                        value={key}
                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                        className="w-full p-3 pl-10 border-2 bg-black/20 text-white border-white/10 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 text-center transition placeholder-slate-500"
                        placeholder="BUVPLUS-XXXX-XXXX-XXXX"
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
                className="w-full flex items-center justify-center bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-wait"
            >
                {isLoading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : 'Activer'}
            </button>
        </form>
    );
};

const ActivationPage: React.FC<ActivationPageProps> = ({ isFirstRun, setPage }) => {
    const { startTrial, activateApp, currentUser, settings } = useBuvette();
    const [isTrialLoading, setIsTrialLoading] = useState(false);
    const [isActivationLoading, setIsActivationLoading] = useState(false);
    const [activationError, setActivationError] = useState<string | null>(null);

    const handleStartTrial = () => {
        setIsTrialLoading(true);
        setTimeout(() => {
            startTrial();
            // App state will change, unmounting this component
        }, 300);
    };

    const handleActivation = async (key: string) => {
        setIsActivationLoading(true);
        setActivationError(null);
        
        const result = await activateApp(key);
        
        if (!result.success) {
            setActivationError(result.message || "Clé invalide ou déjà utilisée. Veuillez vérifier et réessayer.");
        }
        // On success, app state will change and unmount this component
        setIsActivationLoading(false);
    };
    
    const expiryDate = settings.subscriptionExpiry ? new Date(settings.subscriptionExpiry).toLocaleDateString('fr-FR') : 'inconnue';

    const expiredContent = (
        <>
            <h1 className="text-3xl font-display text-amber-400 mt-4">Abonnement Expiré</h1>
            <p className="text-slate-300 mt-4 max-w-sm mx-auto">
                Bonjour {currentUser?.email || 'cher utilisateur'}, votre abonnement a pris fin le {expiryDate}.
                Réactivez votre licence pour continuer.
            </p>
        </>
    );

    const firstRunContent = (
        <>
            <h1 className="text-3xl font-display text-amber-400 mt-4">Bienvenue sur Buvette + !</h1>
            <p className="text-slate-300 mt-4 max-w-sm mx-auto">
                Débloquez l'application en démarrant votre essai gratuit ou en activant une licence.
            </p>
        </>
    );

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-[#1a1a1a]">
            <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-amber-500/50 max-w-md w-full animate-in fade-in-0 zoom-in-90">
                <KeyIcon className="w-16 h-16 text-amber-400 mx-auto" />
                
                {isFirstRun ? firstRunContent : expiredContent}
                
                <div className="mt-8 space-y-6">
                    {isFirstRun && (
                        <div className="space-y-4">
                            <button
                                onClick={handleStartTrial}
                                disabled={isTrialLoading}
                                className="w-full flex items-center justify-center bg-emerald-600 text-white font-bold py-4 px-6 rounded-full shadow-lg hover:bg-emerald-700 transition-all transform hover:scale-105 font-display text-lg disabled:bg-slate-600 disabled:opacity-50"
                            >
                                {isTrialLoading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : "Démarrer l'essai Premium (7 jours)"}
                            </button>
                            <div className="flex items-center text-center">
                                <hr className="flex-grow border-slate-600" />
                                <span className="px-4 text-slate-400 text-sm font-semibold">OU</span>
                                <hr className="flex-grow border-slate-600" />
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-xl font-display text-slate-200 mb-4">{isFirstRun ? "J'ai déjà une clé" : "Entrez votre nouvelle clé"}</h2>
                        <ActivationForm 
                            onSubmit={handleActivation}
                            isLoading={isActivationLoading}
                            error={activationError}
                        />
                    </div>

                    {!isFirstRun && (
                         <button
                            onClick={() => setPage(Page.Upgrade)}
                            className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-slate-700 transition-all transform hover:scale-105 font-display text-lg"
                        >
                            <WalletIcon className="w-6 h-6" />
                            Acheter une nouvelle licence
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ActivationPage);

import React, { useState, memo, useMemo, useId } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { CheckIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, SpinnerIcon } from '../components/Icons';
import { Page } from '../types';

interface AuthPageProps {
    setPage: (page: Page) => void;
}

// Sub-component for password strength validation
const PasswordStrengthMeter: React.FC<{ password?: string }> = ({ password = '' }) => {
    const { hasUpper, hasLower, hasNumber, hasSpecial, hasLength, strengthText, strengthColor, score } = useMemo(() => {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
        const hasLength = password.length >= 8;

        const score = [hasUpper, hasLower, hasNumber, hasSpecial, hasLength].filter(Boolean).length;
        let strengthText = 'Très Faible';
        let strengthColor = 'text-red-400';

        if (score === 5) {
            strengthText = 'Très Fort';
            strengthColor = 'text-emerald-400';
        } else if (score >= 4) {
            strengthText = 'Fort';
            strengthColor = 'text-emerald-400';
        } else if (score >= 3) {
            strengthText = 'Moyen';
            strengthColor = 'text-orange-400';
        } else if (score >= 2) {
            strengthText = 'Faible';
            strengthColor = 'text-red-400';
        }

        return { hasUpper, hasLower, hasNumber, hasSpecial, hasLength, strengthText, strengthColor, score };
    }, [password]);

    const criteria = [
        { label: '8+ caractères', met: hasLength },
        { label: '1 majuscule', met: hasUpper },
        { label: '1 minuscule', met: hasLower },
        { label: '1 chiffre', met: hasNumber },
        { label: '1 spécial', met: hasSpecial },
    ];
    
    const strengthBarWidth = (score / 5) * 100;
    const strengthBarColor = score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <div className="space-y-2 text-left animate-in fade-in-0">
            <div className="flex justify-between items-center">
                 <p className="text-sm font-semibold text-slate-300">Force du mot de passe :</p>
                 <p className={`text-sm font-bold ${strengthColor}`}>{strengthText}</p>
            </div>
            <div className="w-full bg-black/30 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${strengthBarColor}`} style={{ width: `${strengthBarWidth}%` }}></div>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                {criteria.map(c => (
                    <li key={c.label} className={`flex items-center gap-1.5 transition-colors ${c.met ? 'text-emerald-400' : ''}`}>
                        <CheckIcon className={`w-3.5 h-3.5 ${c.met ? 'opacity-100' : 'opacity-30'}`} />
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};


const AuthPage: React.FC<AuthPageProps> = ({ setPage }) => {
    const { registerUser, loginUser } = useBuvette();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tosAccepted, setTosAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const errorId = useId();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!isLoginMode && password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setIsLoading(true);
        setTimeout(async () => {
            const result = await (isLoginMode 
                ? loginUser(email, password) 
                : registerUser(email, password));

            if (!result.success) {
                setError(result.message);
            }
            // On success, the App component will re-render and show the main app
            setIsLoading(false);
        }, 300);
    };

    const isButtonDisabled = useMemo(() => {
        if (isLoading || !email || !password) return true;
        if (!isLoginMode && (!confirmPassword || password !== confirmPassword || !tosAccepted)) return true;
        return false;
    }, [isLoading, email, password, isLoginMode, confirmPassword, tosAccepted]);
    
    const inputStyles = "w-full p-3 border-2 bg-black/20 text-white border-white/10 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center transition";

    return (
         <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-[#1a1a1a]">
            <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-blue-500/50 max-w-md w-full animate-in fade-in-0 zoom-in-90">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto object-contain" />
                <h1 className="text-3xl font-display text-blue-400 mt-4">
                    {isLoginMode ? 'Connexion' : 'Créer un Compte'}
                </h1>
                <p className="text-slate-300 mt-2">
                    {isLoginMode ? 'Accédez à votre espace KAYÉ.' : 'Rejoignez-nous pour gérer votre activité.'}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputStyles}
                            placeholder="votre.email@exemple.com"
                            required
                            autoFocus
                            aria-invalid={!!error && (error.includes("email") || error.includes("Email") || error.includes("incorrect"))}
                            aria-describedby={error ? errorId : undefined}
                        />
                    </div>
                     <div className="relative">
                        <label htmlFor="password" className="sr-only">Mot de passe</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputStyles}
                            placeholder="Mot de passe"
                            required
                            aria-invalid={!!error && (error.includes("passe") || error.includes("incorrect"))}
                            aria-describedby={error ? errorId : undefined}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors" aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}>
                            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    {!isLoginMode && (
                        <div className="space-y-4 animate-in fade-in-0 duration-500">
                            <div className="relative">
                                <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirm-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputStyles}
                                    placeholder="Confirmer le mot de passe"
                                    required
                                    aria-invalid={!!error && error.includes("correspondent")}
                                    aria-describedby={error ? errorId : undefined}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors" aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}>
                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {password && <PasswordStrengthMeter password={password} />}
                             <div className="text-left text-xs text-slate-400 pt-2 flex items-center">
                                <input type="checkbox" id="tos" checked={tosAccepted} onChange={(e) => setTosAccepted(e.target.checked)} className="mr-2 h-4 w-4 rounded accent-orange-500 bg-black/30 border-slate-600" required/>
                                <label htmlFor="tos">J'accepte les <button type="button" onClick={() => setPage(Page.TermsOfUse)} className="underline hover:text-orange-300">Conditions d'Utilisation</button>.</label>
                             </div>
                        </div>
                    )}


                     {error && (
                        <div id={errorId} role="alert" className="flex items-center text-left gap-2 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm font-semibold">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="w-full flex items-center justify-center bg-orange-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition-all transform hover:scale-105 font-display text-lg disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {isLoading ? (
                            <>
                                <SpinnerIcon className="w-6 h-6 animate-spin mr-2" />
                                <span>Chargement...</span>
                            </>
                        ) : (isLoginMode ? 'Se Connecter' : 'S\'inscrire')}
                    </button>
                </form>

                 <div className="mt-6">
                    <button
                        onClick={() => { setIsLoginMode(!isLoginMode); setError(null); setPassword(''); setConfirmPassword(''); }}
                        className="text-sm text-blue-300 hover:text-blue-200"
                    >
                        {isLoginMode ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default memo(AuthPage);
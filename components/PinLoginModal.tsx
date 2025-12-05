import React, { useState, memo, useEffect, useCallback } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import Modal from './Modal';
import { SelectedUser } from '../types';
import { EyeIcon, EyeSlashIcon, SpinnerIcon } from './Icons';

interface PinLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: SelectedUser | null;
}

const KeypadButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-[#2a2a2a] text-white font-bold text-2xl rounded-lg h-14 flex items-center justify-center
                hover:bg-[#3a3a3a] active:bg-[#4a4a4a] transition-all duration-150 shadow-sm border border-white/10 ${className}`}
  >
    {children}
  </button>
);


const PinLoginModal: React.FC<PinLoginModalProps> = ({ isOpen, onClose, user }) => {
    const { loginAdmin, loginTeamMember, showToast } = useBuvette();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isAdmin = user?.type === 'admin';
    const pinLength = 4;

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => { // Delay to allow animation
                setInput('');
                setError('');
                setIsLoading(false);
                setShowPassword(false);
            }, 300);
        } else {
            if (isAdmin) {
                setTimeout(() => {
                    document.getElementById('pin-login-input')?.focus();
                }, 100);
            }
        }
    }, [isOpen, isAdmin]);
    
    const handleLogin = useCallback(() => {
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            let result;
            if (isAdmin) {
                result = loginAdmin(input);
            } else if (user?.type === 'team') {
                result = loginTeamMember(user.user.id, input);
            } else {
                 result = { success: false, message: 'Utilisateur invalide sélectionné.' };
            }

            if (result.success) {
                showToast(result.message, 'success');
                onClose();
            } else {
                setError(result.message);
                setInput('');
            }
            setIsLoading(false);
        }, 250);
    }, [isAdmin, user, input, loginAdmin, loginTeamMember, onClose, showToast]);
    
    useEffect(() => {
        if (!isAdmin && input.length === pinLength) {
            handleLogin();
        }
    }, [input, isAdmin, pinLength, handleLogin]);


    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input) {
            handleLogin();
        }
    };

    const handleKeyPress = (key: string) => {
        if (isLoading || (!isAdmin && input.length >= pinLength)) return;
        setError('');
        setInput(prev => prev + key);
    };
    
    const handleDelete = () => {
        if (isLoading) return;
        setInput(prev => prev.slice(0, -1));
    };

    const title = isAdmin ? "Connexion Administrateur" : `Connexion de ${user?.type === 'team' ? user.user.name : ''}`;
    const placeholder = isAdmin ? 'Mot de passe' : '● ● ● ●';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="text-center">
                    <p className="text-slate-400 mb-4">{isAdmin ? "Veuillez entrer votre mot de passe." : "Veuillez entrer votre code PIN à 4 chiffres."}</p>
                    <div className="relative">
                        <input 
                            id="pin-login-input"
                            type={isAdmin && !showPassword ? 'password' : 'text'}
                            readOnly={!isAdmin}
                            value={isAdmin ? input : '●'.repeat(input.length) + '○'.repeat(Math.max(0, pinLength - input.length))}
                            onChange={isAdmin ? (e) => setInput(e.target.value) : undefined}
                            placeholder={placeholder}
                            className={`w-full text-center text-3xl p-3 border-2 bg-[#1a1a1a] text-white border-white/10 rounded-xl shadow-sm font-mono tracking-widest transition-all ${!isAdmin ? 'cursor-default' : 'focus:ring-amber-500 focus:border-amber-500'}`}
                            aria-label="Champ de saisie du code"
                        />
                         {isAdmin && (
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors" aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}>
                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                     {error && <p className="text-red-400 mt-2 text-sm animate-in fade-in-0">{error}</p>}
                </div>
                
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <SpinnerIcon className="w-10 h-10 animate-spin text-amber-400"/>
                    </div>
                ) : (
                    <>
                    {!isAdmin && (
                         <div className="bg-black/20 p-4 rounded-xl shadow-inner">
                            <div className="grid grid-cols-3 gap-2">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                                    <KeypadButton key={key} onClick={() => handleKeyPress(key)}>{key}</KeypadButton>
                                ))}
                                <div className="col-start-2">
                                   <KeypadButton onClick={() => handleKeyPress('0')}>0</KeypadButton>
                                </div>
                                <KeypadButton onClick={handleDelete}>⌫</KeypadButton>
                            </div>
                        </div>
                    )}
                    {isAdmin && (
                        <button
                            type="submit"
                            disabled={!input || isLoading}
                            className="w-full mt-3 bg-amber-500 text-black font-bold py-3 rounded-lg shadow-lg hover:bg-amber-600 transition-all font-display text-lg disabled:bg-slate-600 disabled:opacity-50"
                        >
                            Se Connecter
                        </button>
                    )}
                    </>
                )}
            </form>
        </Modal>
    );
};

export default memo(PinLoginModal);
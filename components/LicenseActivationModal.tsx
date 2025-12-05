import React, { useState, useEffect, memo } from 'react';
import Modal from './Modal';
import { useBuvette } from '../hooks/useBuvette';
import { LockClosedIcon } from './Icons';

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({ isOpen, onClose }) => {
    const { activateApp } = useBuvette();
    const [key, setKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => { // delay to allow animation
                setKey('');
                setError(null);
                setIsLoading(false);
            }, 300);
        }
    }, [isOpen]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key) return;
        
        setIsLoading(true);
        setError(null);
        
        const result = await activateApp(key);
        
        if (!result.success) {
            setError(result.message || "Clé invalide ou déjà utilisée. Veuillez vérifier et réessayer.");
        }
        // On success, the app state will change, unmounting the parent, so we don't need to handle it here.
        // The modal will disappear with its parent.
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Activer votre licence">
             <form onSubmit={handleActivate} className="space-y-6">
                <p className="text-center text-slate-400">
                    Veuillez saisir votre code d'activation pour déverrouiller Buvette+.
                </p>
                
                <div>
                    <label htmlFor="modal-activation-key" className="sr-only">Code d'activation</label>
                    <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <LockClosedIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            id="modal-activation-key"
                            value={key}
                            onChange={(e) => setKey(e.target.value.toUpperCase())}
                            className="w-full p-3 pl-10 border-2 bg-black/20 text-white border-white/10 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 text-center transition"
                            placeholder="BUVPLUS-XXXX-XXXX-XXXX"
                            required
                            autoFocus
                        />
                    </div>
                </div>
                
                {error && (
                    <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-center text-sm font-semibold">
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isLoading || !key}
                    className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-wait">
                    {isLoading ? 'Activation...' : 'Activer'}
                </button>

                 <div className="text-center">
                    <p className="text-xs text-slate-400">
                       Un problème ? <a href="mailto:buvetteplus@gmail.com" className="underline hover:text-amber-300">Contacter le support</a>.
                    </p>
                </div>
             </form>
        </Modal>
    );
};

export default memo(LicenseActivationModal);
import React from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { CheckIcon } from '../components/Icons';
import { Page } from '../types';

interface ActivationSuccessPageProps {
  setPage: (page: Page) => void;
}

const ActivationSuccessPage: React.FC<ActivationSuccessPageProps> = ({ setPage }) => {
    const { clearJustActivatedFlag } = useBuvette();

    const handleGoToDashboard = () => {
        clearJustActivatedFlag();
    };

    const handleGoToTutorial = (e: React.MouseEvent) => {
        e.preventDefault();
        setPage(Page.Tutorial);
        clearJustActivatedFlag();
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-[#1a1a1a] animate-in fade-in-0">
            <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-emerald-500/50 max-w-lg w-full">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100/10">
                    <CheckIcon className="h-10 w-10 text-emerald-400" aria-hidden="true" />
                </div>
                <h1 className="text-3xl font-display text-amber-400 mt-4">Félicitations ! Votre abonnement est actif !</h1>
                <p className="text-slate-300 mt-4 max-w-xl">
                    Préparez-vous à transformer la gestion de votre buvette. Nous sommes ravis de vous compter parmi les membres de la communauté Buvette+. Votre aventure vers une gestion sans effort commence maintenant !
                </p>
                <div className="mt-8">
                    <button
                        onClick={handleGoToDashboard}
                        className="w-full max-w-sm bg-amber-500 text-black font-bold py-3 px-8 rounded-full shadow-lg text-lg font-display hover:bg-amber-600 transform hover:scale-105 transition-all duration-300"
                    >
                        Accéder à mon tableau de bord
                    </button>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                    <a href="#" onClick={handleGoToTutorial} className="text-sm text-slate-400 hover:text-amber-300">Voir le tutoriel</a>
                    <span className="text-slate-600">|</span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-slate-400 hover:text-amber-300">Centre d'aide</a>
                </div>
            </div>
        </div>
    );
};

export default ActivationSuccessPage;
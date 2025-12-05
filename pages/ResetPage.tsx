
import React, { useState } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Page } from '../types';

interface ResetPageProps {
  setPage: (page: Page) => void;
}

const ResetPage: React.FC<ResetPageProps> = ({ setPage }) => {
  const { startNewEvent, labels } = useBuvette();
  const [confirmed, setConfirmed] = useState(false);

  const handleReset = () => {
    startNewEvent();
    setConfirmed(true);
    setTimeout(() => {
      setPage(Page.Home);
    }, 2500);
  };

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="text-8xl animate-bounce">✨</div>
        <h1 className="text-4xl font-display text-amber-400 mt-4">Nouvel{labels.event === 'Session' ? 'le' : ''} {labels.event} Lancé{labels.event === 'Session' ? 'e' : ''}!</h1>
        <p className="text-slate-400 mt-2">Les données précédent(e)s ont été effacées.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="bg-[#2a2a2a] p-8 rounded-2xl shadow-2xl border-2 border-red-500">
        <div className="text-7xl mb-4">🚨</div>
        <h1 className="text-3xl font-display text-red-400">Attention !</h1>
        <p className="text-slate-300 mt-4 max-w-2xl mx-auto">
          Vous êtes sur le point de démarrer un(e) nouvel(le) <strong>{labels.event}</strong>.
          Cette action est <strong>irréversible</strong> et effacera toutes les données suivantes :
        </p>
        <ul className="text-left list-disc list-inside my-4 text-red-200 bg-red-900/40 p-4 rounded-lg">
          <li>Historique des ventes</li>
          <li>Historique des {labels.donation.toLowerCase()}s</li>
          <li>Historique des remboursements</li>
          <li>Historique des mises au coffre</li>
        </ul>
        <p className="text-slate-300 font-semibold">
          Vos produits, stocks et paramètres seront conservés.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setPage(Page.Home)}
            className="bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-slate-700 transition-colors font-display text-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleReset}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-red-700 transition-colors font-display text-lg"
          >
            Confirmer & Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ResetPage);

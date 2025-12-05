import React, { memo } from 'react';
import Modal from './Modal';
import { LockClosedIcon, SparklesIcon } from './Icons';

interface PremiumLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName: string;
}

// Map pour stocker les avantages spécifiques de chaque fonctionnalité Premium
const featureBenefits: { [key: string]: string } = {
    "Statistiques Avancées": "Accédez à des graphiques détaillés sur vos bénéfices, vos coûts et les tendances de vente pour prendre des décisions éclairées.",
    "Idées (IA)": "Laissez notre IA vous suggérer des produits originaux et adaptés à votre événement pour surprendre vos clients et augmenter vos ventes.",
    "Logo personnalisé": "Renforcez votre image de marque en ajoutant votre propre logo sur tous vos tickets de caisse.",
    "Média de démarrage": "Personnalisez l'écran de lancement de l'application avec votre propre GIF ou vidéo pour une expérience unique.",
    "Pied de page du ticket": "Ajoutez des messages personnalisés, vos réseaux sociaux ou des promotions sur chaque ticket de caisse.",
    "default": "Passez au Premium pour simplifier votre gestion, accéder à des analyses plus poussées et optimiser votre activité."
};

const PremiumLockModal: React.FC<PremiumLockModalProps> = ({ isOpen, onClose, onUpgrade, featureName }) => {
  const handleUpgradeClick = () => {
    onUpgrade();
    onClose();
  };
  
  const description = featureBenefits[featureName] || featureBenefits.default;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Débloquez : ${featureName}`}>
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <LockClosedIcon className="w-20 h-20 text-slate-600" />
            <SparklesIcon className="absolute -bottom-1 -right-1 w-12 h-12 text-amber-400 transform rotate-12" />
        </div>
        <h3 className="text-2xl font-display text-amber-300">Fonctionnalité Premium exclusive</h3>
        <p className="text-slate-300 text-lg leading-relaxed">
          {description}
        </p>
        <button
            onClick={handleUpgradeClick}
            className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg"
        >
            Voir les offres Premium
        </button>
      </div>
    </Modal>
  );
};

export default memo(PremiumLockModal);

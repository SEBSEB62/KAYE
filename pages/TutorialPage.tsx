import React, { memo } from 'react';
import { Page } from '../types';
import { ArchiveBoxIcon, ShoppingCartIcon, HomeIcon, ArrowUturnLeftIcon } from '../components/Icons';

interface TutorialPageProps {
  setPage: (page: Page) => void;
}

const TutorialStep: React.FC<{
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
    <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border border-white/10 transition-all duration-300 hover:shadow-amber-500/10 hover:border-amber-500/30">
        <h2 className="text-2xl font-display text-amber-400 flex items-center gap-3">
            <Icon className="w-8 h-8 flex-shrink-0" />
            <span>{title}</span>
        </h2>
        <div className="mt-4 space-y-3 text-slate-300 prose prose-invert prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-200">
            {children}
        </div>
    </div>
);

const TutorialPage: React.FC<TutorialPageProps> = ({ setPage }) => {
    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-display text-amber-400">Tutoriel Rapide</h1>
                <button 
                    onClick={() => setPage(Page.More)} 
                    className="text-slate-300 hover:text-amber-400 p-2 rounded-full transition-colors"
                    aria-label="Retour au menu Plus"
                >
                    <ArrowUturnLeftIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-center text-slate-400">
                Félicitations ! Suivez ces 3 étapes simples pour être opérationnel en moins de 5 minutes.
            </p>

            <TutorialStep icon={ArchiveBoxIcon} title="Étape 1 : Créez votre premier produit">
                <p>Votre buvette a besoin de produits à vendre. Commençons par ajouter un article simple.</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Allez sur la page <strong>Stock</strong> (icône de boîte en bas).</li>
                    <li>Appuyez sur le bouton <strong>"+ Ajouter Produit"</strong>.</li>
                    <li>Remplissez au minimum le <strong>Nom</strong> (ex: "Canette de Soda"), le <strong>Prix de Vente</strong> (ex: 2.50) et le <strong>Stock</strong> initial (ex: 24).</li>
                    <li>Cliquez sur <strong>"Enregistrer"</strong>. Voilà, votre premier produit est prêt !</li>
                </ol>
            </TutorialStep>

            <TutorialStep icon={ShoppingCartIcon} title="Étape 2 : Réalisez une vente test">
                <p>Maintenant que vous avez un produit, essayons de le vendre. C'est simple et rapide.</p>
                 <ol className="list-decimal list-inside space-y-2">
                    <li>Allez sur la page <strong>Vente</strong> (icône de caddie).</li>
                    <li>Votre "Canette de Soda" apparaît. Appuyez dessus pour l'ajouter au panier. Le compteur sur l'icône du panier en bas s'incrémente.</li>
                    <li>Cliquez sur l'icône du <strong>Panier</strong> en bas à droite pour finaliser.</li>
                    <li>Choisissez un moyen de paiement, par exemple <strong>"Espèces"</strong>.</li>
                    <li>Confirmez, et c'est tout ! La vente est enregistrée et le stock est automatiquement décompté.</li>
                </ol>
            </TutorialStep>
            
            <TutorialStep icon={HomeIcon} title="Étape 3 : Admirez votre tableau de bord">
                <p>Toutes vos actions sont centralisées sur la page d'accueil pour une vue d'ensemble instantanée.</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Retournez sur la page <strong>Accueil</strong>.</li>
                    <li>Observez les cartes : votre <strong>C.A. du jour</strong> a été mis à jour avec le montant de votre vente test.</li>
                    <li>Le <strong>Produit Phare</strong> affiche maintenant votre "Canette de Soda".</li>
                </ol>
                <p><strong>Vous êtes prêt !</strong> Vous maîtrisez les bases de Buvette+. N'hésitez pas à explorer les autres sections comme les <strong>Stats</strong> pour des analyses plus poussées.</p>
            </TutorialStep>

            <div className="text-center pt-4">
                 <button 
                    onClick={() => setPage(Page.Home)} 
                    className="bg-amber-500 text-black font-bold py-3 px-8 rounded-full shadow-lg text-lg font-display hover:bg-amber-600 transform hover:scale-105 transition-all duration-300"
                >
                    Commencer à Gérer ma Buvette
                </button>
            </div>
        </div>
    );
};

export default memo(TutorialPage);

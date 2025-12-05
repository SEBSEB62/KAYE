import React, { memo } from 'react';
import { Page } from '../types';
import { ArrowUturnLeftIcon } from '../components/Icons';

interface TermsOfUsePageProps {
  setPage: (page: Page) => void;
}

const TermsOfUsePage: React.FC<TermsOfUsePageProps> = ({ setPage }) => {

    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="space-y-2">
            <h2 className="text-2xl font-display text-amber-400">{title}</h2>
            <div className="prose prose-invert prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-200">
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-display text-amber-400">Conditions d'Utilisation</h1>
                <button 
                    onClick={() => setPage(Page.Home)} // Fallback to home if context is lost
                    className="text-slate-300 hover:text-amber-400 p-2 rounded-full transition-colors"
                    aria-label="Retour"
                >
                    <ArrowUturnLeftIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-slate-400 italic">Dernière mise à jour : 25 Juillet 2024</p>
            
            <Section title="Préambule">
                <p>
                    Bienvenue sur Buvette+ ! Ces Conditions Générales d'Utilisation (CGU) régissent votre accès et votre utilisation de l'application Buvette+ (ci-après "l'Application"). En créant un compte ou en utilisant l'Application, vous acceptez d'être lié par ces CGU.
                </p>
            </Section>

            <Section title="Article 1 : Objet">
                <p>
                    L'Application a pour objet de fournir un outil de gestion de point de vente (caisse enregistreuse, gestion de stock, statistiques) pour des événements, clubs ou associations. Elle est conçue pour fonctionner de manière autonome sur votre appareil.
                </p>
            </Section>

            <Section title="Article 2 : Accès et Compte Utilisateur">
                <ul>
                    <li>La création d'un compte est nécessaire pour utiliser l'Application. Vous êtes responsable de la confidentialité de vos identifiants.</li>
                    <li>Le premier utilisateur à s'inscrire sur une instance de l'application devient "Super Administrateur" et peut gérer les autres comptes clients.</li>
                    <li>L'utilisation de l'Application est conditionnée par un abonnement actif, activé via une clé de licence.</li>
                </ul>
            </Section>

            <Section title="Article 3 : Données et Confidentialité">
                <p>
                    <strong>La confidentialité de vos données est notre priorité.</strong>
                </p>
                <ul>
                    <li>
                        <strong>Stockage Local :</strong> Toutes vos données de gestion (produits, ventes, stocks, paramètres) sont stockées <strong>exclusivement sur votre appareil</strong> (via le Local Storage de votre navigateur). Nous n'avons aucun accès à ces informations.
                    </li>
                    <li>
                        <strong>Votre Responsabilité :</strong> Vous êtes l'unique responsable de la sécurité et de la sauvegarde de vos données. L'Application propose une fonction d'export pour vous permettre de créer des sauvegardes manuelles. Nous ne pourrons être tenus responsables en cas de perte de données suite à une suppression, une panne de l'appareil ou toute autre cause.
                    </li>
                    <li>
                        <strong>Aucune Collecte :</strong> Nous ne collectons, ne vendons et ne partageons aucune de vos données de gestion.
                    </li>
                </ul>
            </Section>

            <Section title="Article 4 : Services Tiers">
                <p>
                    L'Application utilise des services tiers pour certaines fonctionnalités optionnelles :
                </p>
                 <ul>
                    <li>
                        <strong>Firebase (par Google) :</strong> Utilisé pour la validation et l'activation des clés de licence. Seules les informations de la clé sont échangées, aucune de vos données de gestion n'est envoyée.
                    </li>
                    <li>
                        <strong>Gemini API (par Google) :</strong> Utilisé pour la fonctionnalité "Générateur d'Idées". Lorsque vous utilisez cette fonction, le thème que vous saisissez et la liste de vos produits (uniquement leurs noms) sont envoyés à l'API pour générer des suggestions.
                    </li>
                </ul>
                <p>
                    L'utilisation de ces services est soumise aux conditions d'utilisation et politiques de confidentialité de Google.
                </p>
            </Section>
            
            <Section title="Article 5 : Abonnements et Paiements">
                <ul>
                    <li>L'accès complet à l'Application nécessite une clé de licence valide qui active un abonnement pour une durée déterminée.</li>
                    <li>Les clés de licence sont obtenues en contactant le support. L'Application ne gère pas directement les paiements.</li>
                    <li>Différents plans d'abonnement (Essentiel, Standard, Pro) offrent des niveaux de fonctionnalités variables, décrits sur la page "Abonnement".</li>
                </ul>
            </Section>
            
            <Section title="Article 6 : Responsabilité">
                <ul>
                    <li>L'Application est fournie "en l'état". Nous nous efforçons d'assurer son bon fonctionnement mais ne pouvons garantir une absence totale d'erreurs ou de bugs.</li>
                    <li>Notre responsabilité ne saurait être engagée pour tout dommage direct ou indirect (perte de revenus, perte de données) résultant de l'utilisation de l'Application.</li>
                     <li>Vous êtes responsable de la conformité légale et fiscale de votre activité. Buvette+ est un outil d'aide à la gestion et non un logiciel de comptabilité certifié.</li>
                </ul>
            </Section>

            <Section title="Article 7 : Modifications">
                <p>
                    Nous nous réservons le droit de modifier ces CGU à tout moment. En cas de modification substantielle, vous en serez informé au sein de l'Application. La poursuite de l'utilisation de l'Application après modification vaut acceptation des nouvelles conditions.
                </p>
            </Section>
            
            <Section title="Article 8 : Contact">
                <p>
                    Pour toute question relative à ces CGU, vous pouvez nous contacter à l'adresse suivante : <a href="mailto:buvetteplus@gmail.com" className="text-amber-300 underline">buvetteplus@gmail.com</a>.
                </p>
            </Section>

            <div className="text-center pt-4">
                <button 
                    onClick={() => setPage(Page.Home)}
                    className="bg-slate-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-700 transition"
                >
                    Retour
                </button>
            </div>
        </div>
    );
};

export default memo(TermsOfUsePage);
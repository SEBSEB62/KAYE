import React, { memo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { CheckIcon } from '../components/Icons';

const tiers = [
    {
        name: 'Essentiel',
        id: 'tier-essentiel',
        price: '4.99€',
        priceSuffix: '/ mois',
        description: 'Pour les besoins simples, données uniquement sur l’appareil.',
        features: [
            'Gestion mono-utilisateur',
            'Catalogue jusqu\'à 50 produits',
            'Statistiques de base (CA, ventes)',
            'Génération de tickets PDF simples',
            'Données 100% locales et privées',
        ],
        featured: false,
    },
    {
        name: 'Standard',
        id: 'tier-standard',
        price: '9.99€',
        priceSuffix: '/ mois',
        description: 'Pour les petites équipes, avec plus de flexibilité et des fonctions avancées.',
        features: [
            'Toutes les fonctions Essentiel, plus :',
            'Multi-utilisateurs local (jusqu\'à 2 vendeurs)',
            'Tickets PDF personnalisés (logo)',
            'Exports de rapports (PDF)',
            'Suggestions par IA (limité)',
            'Support prioritaire par e-mail',
        ],
        featured: true,
    },
    {
        name: 'Pro',
        id: 'tier-pro',
        price: '19.99€',
        priceSuffix: '/ mois',
        description: 'Pour les clubs exigeants, avec une gestion étendue et des analyses poussées.',
        features: [
            'Toutes les fonctions Standard, plus :',
            'Multi-utilisateurs local illimité',
            'Catalogue produit illimité',
            'Analyses avancées (marges, etc.)',
            'Rapports PDF enrichis (graphiques)',
            'Support premium (chat + e-mail)',
        ],
        featured: false,
    },
];

const UpgradePage: React.FC = () => {
    const { settings } = useBuvette();

    const handleChoosePlan = (tierName: string) => {
        const businessName = settings.businessName || 'Non spécifié';
        const subject = encodeURIComponent(`Demande de mise à niveau vers le plan ${tierName}`);
        const body = encodeURIComponent(
`Bonjour,

Je souhaiterais mettre à niveau mon application Buvette+ vers le plan "${tierName}".

Pourriez-vous s'il vous plaît me fournir une nouvelle clé d'activation ?

Informations sur mon établissement :
Nom : ${businessName}

Merci d'avance.
Cordialement,`
        );

        window.location.href = `mailto:buvetteplus@gmail.com?subject=${subject}&body=${body}`;
    };

    return (
        <div className="isolate overflow-hidden">
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
                <div className="mx-auto max-w-2xl sm:text-center">
                    <h1 className="text-4xl font-display text-center text-amber-400">Abonnement</h1>
                    <p className="mt-2 text-lg leading-8 text-slate-300">
                        Passez au niveau supérieur. Buvette+ est conçu pour évoluer avec vous. Choisissez le plan qui correspond à vos ambitions.
                    </p>
                </div>
                <div className="mt-12 flow-root">
                    <div className="isolate -mt-16 grid max-w-sm grid-cols-1 gap-y-16 sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 xl:-mx-4">
                        {tiers.map((tier) => {
                            const isCurrentPlan = tier.name === settings.subscriptionPlan;

                            return (
                                <div key={tier.id} className={`pt-16 lg:px-8 lg:pt-0 xl:px-14 flex flex-col ${tier.featured ? 'bg-slate-900/50 lg:bg-transparent rounded-3xl lg:rounded-none ring-2 ring-amber-500 lg:ring-0 z-10 py-8 lg:py-0' : ''}`}>
                                    <div className="flex-grow">
                                        <h3 id={tier.id} className="text-2xl font-semibold leading-7 text-amber-400">
                                            {tier.name}
                                        </h3>
                                        <p className="mt-4 flex items-baseline gap-x-2">
                                            <span className="text-5xl font-bold tracking-tight text-white">{tier.price}</span>
                                            <span className="text-base text-slate-400">{tier.priceSuffix}</span>
                                        </p>
                                        <p className="mt-6 text-base leading-7 text-slate-300 h-28">{tier.description}</p>
                                        <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex gap-x-3">
                                                    <CheckIcon className="h-6 w-5 flex-none text-emerald-400" aria-hidden="true" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => !isCurrentPlan && handleChoosePlan(tier.name)}
                                        disabled={isCurrentPlan}
                                        aria-describedby={tier.id}
                                        className={`mt-10 block rounded-full py-3 px-6 text-center text-lg font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full transition-colors
                                        ${ isCurrentPlan
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : tier.featured 
                                                ? 'bg-amber-500 text-black hover:bg-amber-400 focus-visible:outline-amber-500' 
                                                : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'}`}
                                    >
                                        {isCurrentPlan ? 'Plan Actuel' : 'Choisir ce plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="text-center mt-4">
                <p className="text-slate-400">Bienvenue, {settings.businessName}.</p>
                <p className="text-sm text-slate-500">Pour toute question, contactez le support.</p>
            </div>
        </div>
    );
};

export default memo(UpgradePage);

import React, { useState, memo } from 'react';
import { Page, SubscriptionPlan } from '../types';
import { useBuvette } from '../hooks/useBuvette';
import { ArrowUturnLeftIcon, BookOpenIcon, Cog6ToothIcon, HeartIcon, SparklesIcon, UserCircleIcon, UsersIcon, WalletIcon, CircleStackIcon, MinusCircleIcon } from '../components/Icons';
import PremiumLockModal from '../components/PremiumLockModal';

interface MorePageProps {
  setPage: (page: Page) => void;
}

const MorePage: React.FC<MorePageProps> = ({ setPage }) => {
    const { isAdmin, showToast, subscriptionPlan, currentUser, logoutSession, activeSessionUser, labels } = useBuvette();
    const [premiumModal, setPremiumModal] = useState({ isOpen: false, featureName: '' });

    const isStandardOrPro = subscriptionPlan === SubscriptionPlan.STANDARD || subscriptionPlan === SubscriptionPlan.PRO;
    
    const handleUpgrade = () => {
        setPremiumModal({ isOpen: false, featureName: '' });
        setPage(Page.Upgrade);
    };

    const handleNavigation = (page: Page, label: string, needsAdmin = false, isPremiumFeature = false) => {
        if (isPremiumFeature && !isStandardOrPro) {
            setPremiumModal({ isOpen: true, featureName: label });
            return;
        }
        if (needsAdmin && !isAdmin) {
            showToast("Accès non autorisé. Seul un administrateur peut accéder à cette section.", "error");
        } else {
            setPage(page);
        }
    };

    const menuItems = [
        { page: Page.Settings, label: "Paramètres", icon: Cog6ToothIcon, needsAdmin: true, visible: true },
        { page: Page.Team, label: labels.team, icon: UsersIcon, needsAdmin: true, visible: true },
        { page: Page.Donations, label: `${labels.donation}s & Soutien`, icon: HeartIcon, needsAdmin: true, visible: true },
        { page: Page.CashOut, label: "Sortie d'espèces", icon: MinusCircleIcon, needsAdmin: true, visible: true },
        { page: Page.Reset, label: `Nouvel${labels.event === 'Session' ? 'le' : ''} ${labels.event}`, icon: ArrowUturnLeftIcon, needsAdmin: true, visible: true },
        { page: Page.Backup, label: "Sauvegarde", icon: CircleStackIcon, needsAdmin: true, visible: true },
        { page: Page.Upgrade, label: "Abonnement", icon: WalletIcon, needsAdmin: false, visible: true },
        { page: Page.Tutorial, label: "Tutoriel", icon: BookOpenIcon, needsAdmin: false, visible: true },
        { page: Page.Ideas, label: "Idées (IA)", icon: SparklesIcon, needsAdmin: false, visible: true, premium: true },
    ];
    
    const sessionName = activeSessionUser?.type === 'admin' 
        ? 'Administrateur' 
        : activeSessionUser?.type === 'team' 
        ? activeSessionUser.user.name
        : 'Inconnu';

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-display text-center text-amber-400">Plus d'Options</h1>
            
            <div className="bg-amber-900/50 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <UserCircleIcon className="w-10 h-10 text-amber-300 flex-shrink-0" />
                    <div className="overflow-hidden">
                        <p className="font-bold text-amber-300">Session : {sessionName}</p>
                        <p className="text-sm text-slate-300 truncate">Client : {currentUser?.email}</p>
                    </div>
                </div>
                 <button onClick={logoutSession} className="text-sm font-bold text-amber-200 bg-black/30 px-3 py-1.5 rounded-full hover:bg-black/50 transition-colors flex-shrink-0">
                    Changer
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {menuItems.filter(item => item.visible).map(({ page, label, icon: Icon, needsAdmin, premium }) => (
                    <button
                        key={page}
                        onClick={() => handleNavigation(page, label, needsAdmin, premium)}
                        className={`bg-[#2a2a2a] p-4 rounded-2xl shadow-md border border-white/10 flex flex-col items-center justify-center text-center space-y-2 aspect-square transition-transform duration-200 hover:scale-105 hover:border-amber-500/50
                        ${premium ? 'relative overflow-hidden' : ''}`}
                    >
                        {premium && (
                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-bl-lg z-10">STANDARD+</div>
                        )}
                        <Icon className="w-10 h-10 text-amber-400" />
                        <span className="font-semibold text-slate-200 text-sm">{label}</span>
                         {premium && !isStandardOrPro && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-0" />
                        )}
                    </button>
                ))}
            </div>
            
            <PremiumLockModal 
                isOpen={premiumModal.isOpen}
                onClose={() => setPremiumModal({ isOpen: false, featureName: '' })}
                onUpgrade={handleUpgrade}
                featureName={premiumModal.featureName}
            />
        </div>
    );
};

export default memo(MorePage);

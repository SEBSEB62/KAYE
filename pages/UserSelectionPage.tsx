import React, { useState, memo, useCallback } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { SubUser, SelectedUser } from '../types';
import { LockOpenIcon, UserCircleIcon, UsersIcon } from '../components/Icons';
import PinLoginModal from '../components/PinLoginModal';

const UserSelectionPage: React.FC = () => {
    const { settings, currentUser, logoutUser, activeSessionUser } = useBuvette();
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUserSelect = useCallback((user: SelectedUser) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedUser(null);
    }, []);
    
    const getGreeting = () => {
        if (activeSessionUser) {
            if (activeSessionUser.type === 'admin') return "Session Administrateur Active";
            return `Session Vendeur : ${activeSessionUser.user.name}`;
        }
        return "Qui est-ce qui se connecte ?";
    };

    const UserButton: React.FC<{ user: SubUser | 'admin', onClick: () => void }> = memo(({ user, onClick }) => {
        const isAdmin = user === 'admin';
        const name = isAdmin ? 'Administrateur' : user.name;
        const Icon = isAdmin ? LockOpenIcon : UserCircleIcon;
        
        return (
            <button
                onClick={onClick}
                className="w-full flex flex-col items-center justify-center p-6 bg-[#2a2a2a] rounded-2xl shadow-md border-2 border-white/10 transition-all duration-300 hover:border-amber-500/80 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
                <Icon className="w-16 h-16 text-slate-300 mb-3" />
                <span className="text-xl font-display text-white">{name}</span>
                {isAdmin && <span className="text-sm text-amber-400 font-semibold">(Accès complet)</span>}
            </button>
        );
    });

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-[#1a1a1a] animate-in fade-in-0">
            <div className="w-full max-w-lg">
                <UsersIcon className="w-20 h-20 text-amber-400 mx-auto" />
                <h1 className="text-4xl font-display text-amber-400 mt-4">
                    {getGreeting()}
                </h1>
                 <p className="text-slate-300 mt-2 mb-8">
                    Sélectionnez un profil pour commencer la session de vente.
                </p>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <UserButton user="admin" onClick={() => handleUserSelect({ type: 'admin' })} />
                    {settings.team.map(member => (
                        <UserButton key={member.id} user={member} onClick={() => handleUserSelect({ type: 'team', user: member })} />
                    ))}
                </div>

                <div className="mt-8">
                    <button onClick={logoutUser} className="text-sm text-slate-400 hover:text-red-400 transition-colors">
                        Se déconnecter de {currentUser?.email}
                    </button>
                </div>
            </div>

            <PinLoginModal 
                isOpen={isModalOpen}
                onClose={closeModal}
                user={selectedUser}
            />
        </div>
    );
};

export default memo(UserSelectionPage);
import React, { useState, memo, useCallback } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Page, SubUser } from '../types';
import { ArrowUturnLeftIcon, UserCircleIcon, EyeIcon, EyeSlashIcon } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

interface TeamPageProps {
  setPage: (page: Page) => void;
}

const MemberFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    member?: SubUser | null;
}> = ({ isOpen, onClose, member }) => {
    const { addTeamMember, updateTeamMember } = useBuvette();
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    
    const isEditing = !!member;

    React.useEffect(() => {
        if (isOpen) {
            setName(member?.name || '');
            setPin('');
        }
    }, [isOpen, member]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && member) {
            updateTeamMember(member.id, name, pin || undefined);
        } else {
            addTeamMember(name, pin);
        }
        onClose();
    };
    
    const inputStyles = "block w-full p-3 bg-[#1a1a1a] border-2 border-white/20 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Modifier le Membre" : "Ajouter un Membre"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="memberName" className="block text-sm font-medium text-slate-300 mb-1">Nom du vendeur</label>
                    <input id="memberName" type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyles} required autoFocus />
                </div>
                <div className="relative">
                    <label htmlFor="memberPin" className="block text-sm font-medium text-slate-300 mb-1">Code PIN (4 chiffres)</label>
                    <input 
                        id="memberPin"
                        type={showPin ? 'text' : 'password'} 
                        value={pin} 
                        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                        className={inputStyles} 
                        required={!isEditing}
                        maxLength={4}
                        minLength={isEditing && !pin ? 0 : 4}
                        pattern="\d{4}"
                        placeholder={isEditing ? "Laisser vide pour ne pas changer" : ""}
                        inputMode="numeric"
                    />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-10 text-slate-400 hover:text-white transition-colors" aria-label={showPin ? 'Cacher le PIN' : 'Afficher le PIN'}>
                        {showPin ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-slate-700 transition">Annuler</button>
                    <button type="submit" className="bg-amber-500 text-black font-bold py-2 px-4 rounded-full shadow-lg hover:bg-amber-600 transition">Enregistrer</button>
                </div>
            </form>
        </Modal>
    );
};

const TeamPage: React.FC<TeamPageProps> = ({ setPage }) => {
    const { settings, deleteTeamMember } = useBuvette();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<SubUser | null>(null);
    const [deletingMember, setDeletingMember] = useState<SubUser | null>(null);
    
    const handleEdit = useCallback((member: SubUser) => {
        setEditingMember(member);
        setFormOpen(true);
    }, []);
    
    const handleAddNew = () => {
        setEditingMember(null);
        setFormOpen(true);
    };

    const closeForm = useCallback(() => {
        setEditingMember(null);
        setFormOpen(false);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (deletingMember) {
            deleteTeamMember(deletingMember.id);
            setDeletingMember(null);
        }
    }, [deletingMember, deleteTeamMember]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-display text-amber-400">Équipe</h1>
                 <button 
                    onClick={() => setPage(Page.More)} 
                    className="text-slate-300 hover:text-amber-400 p-2 rounded-full transition-colors"
                    aria-label="Retour"
                >
                    <ArrowUturnLeftIcon className="w-6 h-6" />
                </button>
            </div>
             <p className="text-slate-400 text-center">
                Gérez les membres de votre équipe qui peuvent effectuer des ventes. Chaque membre aura son propre code PIN à 4 chiffres.
            </p>
            
             <button onClick={handleAddNew} className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-transform font-display text-lg">
                + Ajouter un Membre
            </button>
            
            <div className="space-y-3">
                {settings.team.map(member => (
                    <div key={member.id} className="bg-[#2a2a2a] p-4 rounded-xl shadow-sm border border-white/10 flex items-center gap-4">
                        <UserCircleIcon className="w-10 h-10 text-slate-400 flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="font-semibold text-white">{member.name}</p>
                            <p className="text-sm text-slate-400">{member.role === 'seller' ? 'Vendeur' : 'Membre'}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleEdit(member)} className="text-sm font-bold text-amber-400 px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors">Modifier</button>
                             <button onClick={() => setDeletingMember(member)} className="text-sm font-bold text-red-400 px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors">Supprimer</button>
                        </div>
                    </div>
                ))}
                {settings.team.length === 0 && (
                    <div className="text-center text-slate-500 p-8 bg-black/20 rounded-lg">
                        <p>Aucun membre dans votre équipe pour le moment.</p>
                    </div>
                )}
            </div>

            <MemberFormModal isOpen={isFormOpen} onClose={closeForm} member={editingMember} />
            <ConfirmModal 
                isOpen={!!deletingMember}
                onClose={() => setDeletingMember(null)}
                onConfirm={handleConfirmDelete}
                title="Supprimer le Membre"
                message={<>Êtes-vous sûr de vouloir supprimer <strong>{deletingMember?.name}</strong> de votre équipe ?</>}
                confirmText="Supprimer"
            />
        </div>
    );
};

export default memo(TeamPage);
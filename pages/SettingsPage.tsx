
import React, { useState, memo, useRef, useEffect } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Page, Settings, SubscriptionPlan, AppFont } from '../types';
import { compressImage } from '../utils/image';
import { BuildingLibraryIcon, LockClosedIcon, PhotoIcon, WalletIcon, UserCircleIcon, Cog6ToothIcon, SparklesIcon, PaintBrushIcon, TagIcon, MinusCircleIcon, ArchiveBoxIcon, ReceiptPercentIcon } from '../components/Icons';
import PremiumLockModal from '../components/PremiumLockModal';

interface SettingsPageProps {
  setPage: (page: Page) => void;
}

const PremiumLockOverlay: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div onClick={onClick} className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl cursor-pointer group z-10">
        <span className="text-orange-400 font-bold flex items-center gap-2 transition-transform duration-200 group-hover:scale-110">
            <LockClosedIcon className="w-5 h-5" /> Débloquer avec un plan supérieur
        </span>
    </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ setPage }) => {
    const { settings, setSettings, showToast, subscriptionPlan, currentUser, logoutUser, changeAdminPassword } = useBuvette();
    const [currentSettings, setCurrentSettings] = useState<Settings>(settings);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [premiumModal, setPremiumModal] = useState({ isOpen: false, featureName: '' });
    const [newCategory, setNewCategory] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const gifInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const isStandardOrPro = subscriptionPlan === SubscriptionPlan.STANDARD || subscriptionPlan === SubscriptionPlan.PRO;

    // Sync local state if context settings change
    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleSave = () => {
        if (newPassword && newPassword !== confirmPassword) {
            showToast("Les nouveaux mots de passe admin ne correspondent pas.", "error");
            return;
        }
        
        setSettings(currentSettings);

        try {
            // Persist hourly rate separately to localStorage for quick access and backward compatibility
            if (currentSettings.hourlyRate !== undefined && currentSettings.hourlyRate !== null) {
                localStorage.setItem('buvette-hourlyRate', String(currentSettings.hourlyRate));
            }
        } catch (e) {
            // ignore localStorage errors
        }

        if (newPassword) {
            changeAdminPassword(newPassword);
            showToast("Mot de passe admin mis à jour.", "success");
        }
        
        setNewPassword('');
        setConfirmPassword('');
        showToast("Paramètres enregistrés avec succès !", "success");
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'businessLogo' | 'startupGif' | 'backgroundImage') => {
        if (!isStandardOrPro) {
            setPremiumModal({ isOpen: true, featureName: field === 'businessLogo' ? 'Logo personnalisé' : 'Média de démarrage' });
            return;
        }
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Backgrounds can be larger (up to 2MB compressed) as they are critical
                const options = field === 'backgroundImage' 
                    ? { maxWidth: 1920, maxHeight: 1080, quality: 0.8 } 
                    : field === 'businessLogo' 
                        ? { maxWidth: 300, maxHeight: 300 }
                        : { quality: 0.8 };

                const compressedBlob = await compressImage(file, options);
                setCurrentSettings(prev => ({ ...prev, [field]: compressedBlob }));
                 showToast(`${field === 'businessLogo' ? 'Logo' : field === 'backgroundImage' ? 'Fond d\'écran' : 'Média de démarrage'} mis à jour.`);
            } catch (err) {
                 const message = err instanceof Error ? err.message : "Erreur lors du traitement du fichier.";
                 showToast(message, 'error');
            }
        }
    };

    const handleRemoveMedia = (field: 'businessLogo' | 'startupGif' | 'backgroundImage') => {
        if (!isStandardOrPro) return;
        setCurrentSettings(prev => ({ ...prev, [field]: null }));
        showToast(`${field === 'businessLogo' ? 'Logo' : field === 'backgroundImage' ? 'Fond d\'écran' : 'Média de démarrage'} supprimé.`);
    };
    
    const handleUpgrade = () => {
        setPremiumModal({ isOpen: false, featureName: '' });
        setPage(Page.Upgrade);
    };

    const handleAddCategory = () => {
        if (newCategory.trim() && !currentSettings.categories.includes(newCategory.trim())) {
            setCurrentSettings(prev => ({
                ...prev,
                categories: [...prev.categories, newCategory.trim()]
            }));
            setNewCategory('');
        }
    };

    const handleDeleteCategory = (catToDelete: string) => {
        if (currentSettings.categories.length <= 1) {
            showToast("Il faut conserver au moins une catégorie.", "error");
            return;
        }
        setCurrentSettings(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c !== catToDelete)
        }));
    };

    const glassPanelClass = "glass-panel p-6 rounded-2xl shadow-xl space-y-4 animate-in fade-in-0 slide-in-from-bottom-3";
    const inputStyles = "mt-1 block w-full p-3 bg-white/20 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-slate-500";
    const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed";
    const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
    const sectionTitleStyles = "text-2xl font-display text-slate-800 dark:text-slate-200 flex items-center gap-2";

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-10">
            <h1 className="text-4xl font-display text-center text-blue-500 dark:text-blue-400 drop-shadow-md">Paramètres</h1>

             <div className={glassPanelClass}>
                <h2 className={sectionTitleStyles}><UserCircleIcon className="w-6 h-6"/>Compte</h2>
                <div className="bg-white/30 dark:bg-black/30 p-4 rounded-lg border border-slate-300 dark:border-white/10">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Connecté en tant que :</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white truncate">{currentUser?.email}</p>
                </div>
                <button 
                    onClick={logoutUser}
                    className="w-full bg-slate-200 dark:bg-slate-600/80 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-display text-lg"
                >
                    Déconnexion
                </button>
            </div>
            
            <div className={glassPanelClass}>
                <h2 className={sectionTitleStyles}><ReceiptPercentIcon className="w-6 h-6 text-amber-400"/> Rentabilité Créateur</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Définissez votre taux horaire cible pour inclure la main d'œuvre dans le coût de revient.</p>
                <div className="mt-2">
                    <label className={labelStyles}>Mon taux horaire cible (€ / heure)</label>
                    <input type="number" step="0.01" min="0" value={currentSettings.hourlyRate ?? 0} onChange={e => setCurrentSettings(s => ({...s, hourlyRate: parseFloat(e.target.value || '0')}))} className={inputStyles} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cette valeur sera utilisée pour estimer le coût main d'œuvre par produit. Sauvegardez pour persister.</p>
                </div>
            </div>
              <div className={glassPanelClass}>
                  <h2 className={sectionTitleStyles}><Cog6ToothIcon className="w-6 h-6"/> Mode d'Application</h2>
                 <p className="text-slate-600 dark:text-slate-300 text-sm">Adaptez le vocabulaire à votre activité.</p>
                 <div>
                    <label className={labelStyles}>Type d'activité</label>
                    <select 
                        value={currentSettings.appMode} 
                        onChange={e => setCurrentSettings(s => ({...s, appMode: e.target.value as 'association' | 'business'}))} 
                        className={inputStyles}
                    >
                        <option value="business">Commerce / VDI (Vente à domicile, Boutique)</option>
                        <option value="association">Association / Buvette (Dons, Bénévoles)</option>
                    </select>
                </div>
            </div>

            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><ArchiveBoxIcon className="w-6 h-6"/> Préférences de Stock</h2>
                 <div>
                    <label className={labelStyles}>Seuil d'alerte "Stock Bas"</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Les produits ayant une quantité inférieure ou égale à ce nombre seront marqués en orange (alerte).</p>
                    <div className="flex items-center gap-3">
                        <input 
                            type="number" 
                            min="0" 
                            max="1000"
                            value={currentSettings.lowStockThreshold} 
                            onChange={e => setCurrentSettings(s => ({...s, lowStockThreshold: parseInt(e.target.value) || 0}))} 
                            className={`${inputStyles} max-w-[120px] text-center !mt-0 font-bold text-xl`}
                        />
                        <span className="text-slate-600 dark:text-slate-300 font-bold">unités</span>
                    </div>
                </div>
            </div>

            <div className={glassPanelClass}>
                <h2 className={sectionTitleStyles}><TagIcon className="w-6 h-6"/> Gérer mes Rayons/Catégories</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Ajoutez ou supprimez des catégories pour vos produits.</p>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newCategory} 
                        onChange={e => setNewCategory(e.target.value)} 
                        placeholder="Nouvelle catégorie (ex: Bijoux)" 
                        className="flex-grow p-3 bg-white/20 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        onClick={handleAddCategory}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl font-bold"
                    >
                        Ajouter
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {currentSettings.categories.map(cat => (
                        <div key={cat} className="flex items-center gap-2 bg-white/40 dark:bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10">
                            <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                            <button 
                                onClick={() => handleDeleteCategory(cat)} 
                                className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                                title="Supprimer"
                            >
                                <MinusCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><SparklesIcon className="w-6 h-6 text-orange-400"/> Mon Image de Marque</h2>
                 <p className="text-slate-600 dark:text-slate-300 text-sm">Personnalisez l'application pour qu'elle reflète votre identité.</p>
                 
                 <div>
                    <label className={labelStyles}>Nom de la boutique / Buvette</label>
                    <input type="text" value={currentSettings.businessName} onChange={e => setCurrentSettings(s => ({...s, businessName: e.target.value}))} placeholder="ex: Gaïa Création" className={inputStyles}/>
                </div>

                <div>
                    <label className={labelStyles}>Couleur principale (Thème)</label>
                    <div className="flex gap-4 mt-2 items-center">
                        <div className="relative overflow-hidden w-full h-12 rounded-xl border border-slate-300 dark:border-white/20">
                            <input 
                                type="color" 
                                value={currentSettings.brandColor || '#2563eb'} 
                                onChange={e => setCurrentSettings(s => ({...s, brandColor: e.target.value}))}
                                className="absolute -top-2 -left-2 w-[120%] h-[150%] cursor-pointer p-0 border-0"
                            />
                        </div>
                        <span className="self-center text-slate-500 dark:text-slate-400 text-sm font-mono">{currentSettings.brandColor || '#2563eb'}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-300 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2"><PaintBrushIcon className="w-5 h-5" /> Apparence</h3>
                    
                    {/* Theme Mode Toggle */}
                    <div className="mb-6 flex items-center justify-between bg-white/20 dark:bg-black/20 p-3 rounded-xl border border-slate-300 dark:border-white/10">
                        <div>
                            <span className="block font-medium text-slate-800 dark:text-slate-200">Thème de l'interface</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {currentSettings.themeMode === 'dark' ? 'Mode Sombre (Actif)' : 'Mode Clair (Actif)'}
                            </span>
                        </div>
                        <button 
                            onClick={() => setCurrentSettings(s => ({...s, themeMode: s.themeMode === 'dark' ? 'light' : 'dark'}))}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${currentSettings.themeMode === 'dark' ? 'bg-slate-700' : 'bg-yellow-400'}`}
                        >
                            <span className={`${currentSettings.themeMode === 'dark' ? 'translate-x-7 bg-slate-300' : 'translate-x-1 bg-white'} inline-block h-6 w-6 transform rounded-full transition-transform duration-300 shadow-md flex items-center justify-center`}>
                                {currentSettings.themeMode === 'dark' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-800">
                                        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-600">
                                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>

                    {/* Background Image Upload */}
                    <div className="mb-4">
                        <label className={`${labelStyles} mb-1`}>Image de fond d'écran</label>
                        <div className="flex items-center gap-4 relative">
                            <button type="button" onClick={() => bgInputRef.current?.click()} className={`${inputStyles} !mt-0 text-left flex-grow ${disabledStyles}`} disabled={!isStandardOrPro}>
                                {currentSettings.backgroundImage ? 'Changer l\'image...' : 'Choisir une image...'}
                            </button>
                            {currentSettings.backgroundImage && isStandardOrPro && (
                                <button type="button" onClick={() => handleRemoveMedia('backgroundImage')} className="text-sm text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 p-2 flex-shrink-0">Supprimer</button>
                            )}
                             {!isStandardOrPro && <PremiumLockOverlay onClick={() => setPremiumModal({ isOpen: true, featureName: 'Fond d\'écran personnalisé' })} />}
                        </div>
                        <input type="file" ref={bgInputRef} onChange={e => handleFileChange(e, 'backgroundImage')} accept="image/*" className="hidden"/>
                    </div>

                    {/* Overlay Opacity */}
                    <div className="mb-4">
                        <div className="flex justify-between mb-1">
                            <label className={labelStyles}>Opacité du voile {currentSettings.themeMode === 'dark' ? 'noir' : 'blanc'}</label>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{Math.round((currentSettings.backgroundOverlayOpacity || 0.7) * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={currentSettings.backgroundOverlayOpacity ?? 0.7} 
                            onChange={e => setCurrentSettings(s => ({...s, backgroundOverlayOpacity: parseFloat(e.target.value)}))}
                            className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Font Selector */}
                    <div>
                        <label className={`${labelStyles} mb-2`}>Police d'écriture</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['modern', 'elegant', 'handwritten'] as AppFont[]).map((font) => (
                                <button
                                    key={font}
                                    onClick={() => setCurrentSettings(s => ({...s, appFont: font}))}
                                    className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                                        currentSettings.appFont === font 
                                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105' 
                                        : 'bg-white/20 dark:bg-black/40 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <span className={
                                        font === 'elegant' ? 'font-display' : 
                                        font === 'handwritten' ? 'font-handwritten text-lg' : 
                                        'font-sans'
                                    }>
                                        {font === 'modern' ? 'Moderne' : font === 'elegant' ? 'Élégant' : 'Manuscrit'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><WalletIcon className="w-6 h-6"/> Abonnement</h2>
                 <div className="bg-white/30 dark:bg-black/30 p-4 rounded-lg text-center border border-slate-300 dark:border-white/10">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Votre Plan Actuel</p>
                    <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">{settings.subscriptionPlan}</p>
                    {settings.subscriptionExpiry && (
                         <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            Expire le: {new Date(settings.subscriptionExpiry).toLocaleDateString('fr-FR')}
                         </p>
                    )}
                 </div>
            </div>

            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><BuildingLibraryIcon className="w-6 h-6"/> Infos de l'Établissement</h2>
                 <div>
                    <label className={labelStyles}>Adresse</label>
                    <input type="text" value={currentSettings.businessAddress} onChange={e => setCurrentSettings(s => ({...s, businessAddress: e.target.value}))} placeholder="ex: 123 Rue de l'Événement, 75000 Paris" className={inputStyles}/>
                </div>
                 <div>
                    <label className={labelStyles}>Contact</label>
                    <input type="text" value={currentSettings.businessContact} onChange={e => setCurrentSettings(s => ({...s, businessContact: e.target.value}))} placeholder="ex: contact@kaye.com / 01 23 45 67 89" className={inputStyles}/>
                </div>
                 <div className="relative">
                    <label className={labelStyles}>Pied de page du ticket</label>
                    <textarea 
                        value={currentSettings.receiptFooter} 
                        onChange={e => setCurrentSettings(s => ({...s, receiptFooter: e.target.value}))} 
                        className={`${inputStyles} ${disabledStyles}`} 
                        disabled={!isStandardOrPro}
                        rows={3}
                        placeholder="ex: Merci de votre visite ! Suivez-nous sur les réseaux sociaux !"
                    />
                    {!isStandardOrPro && <PremiumLockOverlay onClick={() => setPremiumModal({ isOpen: true, featureName: 'Pied de page du ticket' })} />}
                </div>
            </div>
            
            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><ReceiptPercentIcon className="w-6 h-6 text-orange-500"/> URSSAF (Estimation)</h2>
                 <p className="text-slate-600 dark:text-slate-300 text-sm">Estimez les cotisations sociales selon votre activité (micro-entrepreneur).</p>
                 <div className="mt-2">
                    <label className={labelStyles}>Type d'activité</label>
                    <div className="flex gap-3 mt-2">
                        <label className="inline-flex items-center gap-2">
                            <input type="radio" name="urssafActivity" value="vente" checked={currentSettings.urssafActivity === 'vente'} onChange={() => setCurrentSettings(s => ({...s, urssafActivity: 'vente', urssafRate: 12.3}))} />
                            <span className="text-sm">Vente de marchandises (VDI) — ~12.3%</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="radio" name="urssafActivity" value="prestation" checked={currentSettings.urssafActivity === 'prestation'} onChange={() => setCurrentSettings(s => ({...s, urssafActivity: 'prestation', urssafRate: 21.2}))} />
                            <span className="text-sm">Prestations de services — ~21.2%</span>
                        </label>
                    </div>

                    <div className="mt-3">
                        <label className={labelStyles}>Taux personnalisé (%)</label>
                        <input type="number" step="0.1" min="0" max="100" value={currentSettings.urssafRate ?? 0} onChange={e => setCurrentSettings(s => ({...s, urssafRate: parseFloat(e.target.value || '0')}))} className={inputStyles} />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Le calcul affichera une estimation: <strong>(CA total × taux) / 100</strong>. Ne modifie pas automatiquement le bénéfice affiché.</p>
                    </div>
                 </div>
            </div>
            
            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><PhotoIcon className="w-6 h-6"/> Média</h2>
                <div className="relative">
                    <label className={labelStyles}>Logo pour les tickets</label>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => logoInputRef.current?.click()} className={`${inputStyles} !mt-1 text-left flex-grow ${disabledStyles}`} disabled={!isStandardOrPro}>
                            {currentSettings.businessLogo ? 'Changer le logo...' : 'Choisir un logo...'}
                        </button>
                        {currentSettings.businessLogo && isStandardOrPro && (
                            <button type="button" onClick={() => handleRemoveMedia('businessLogo')} className="text-sm text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 p-2 flex-shrink-0">Supprimer</button>
                        )}
                    </div>
                    <input type="file" ref={logoInputRef} onChange={e => handleFileChange(e, 'businessLogo')} accept="image/jpeg,image/png" className="hidden"/>
                    {!isStandardOrPro && <PremiumLockOverlay onClick={() => setPremiumModal({ isOpen: true, featureName: 'Logo personnalisé' })} />}
                </div>
                <div className="relative">
                    <label className={labelStyles}>GIF/Vidéo de démarrage</label>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => gifInputRef.current?.click()} className={`${inputStyles} !mt-1 text-left flex-grow ${disabledStyles}`} disabled={!isStandardOrPro}>
                             {currentSettings.startupGif ? 'Changer le média...' : 'Choisir un média...'}
                        </button>
                        {currentSettings.startupGif && isStandardOrPro && (
                            <button type="button" onClick={() => handleRemoveMedia('startupGif')} className="text-sm text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 p-2 flex-shrink-0">Supprimer</button>
                        )}
                    </div>
                    <input type="file" ref={gifInputRef} onChange={e => handleFileChange(e, 'startupGif')} accept="image/gif,video/mp4,video/webm" className="hidden"/>
                    {!isStandardOrPro && <PremiumLockOverlay onClick={() => setPremiumModal({ isOpen: true, featureName: 'Média de démarrage' })} />}
                </div>
                 <div>
                    <label className={labelStyles}>Mode d'affichage des produits</label>
                     <select value={currentSettings.uiMode} onChange={e => setCurrentSettings(s => ({...s, uiMode: e.target.value as 'carousel' | 'grid'}))} className={inputStyles}>
                        <option value="carousel">Carrousel</option>
                        <option value="grid">Grille</option>
                    </select>
                </div>
            </div>

            <div className={glassPanelClass}>
                 <h2 className={sectionTitleStyles}><LockClosedIcon className="w-6 h-6"/> Sécurité</h2>
                <div>
                    <label className={labelStyles}>Nouveau mot de passe admin</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputStyles} placeholder="Laisser vide pour ne pas changer" />
                </div>
                <div>
                    <label className={labelStyles}>Confirmer le mot de passe</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputStyles} />
                </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 !mt-2">
                    Ceci modifie le mot de passe pour l'accès administrateur local. Pour changer les codes PIN de l'équipe, allez dans <strong>Plus &gt; Équipe</strong>.
                </p>
            </div>

            <div className="flex justify-end sticky bottom-20 z-20">
                <button onClick={handleSave} className="bg-orange-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition-all transform hover:scale-105 font-display text-lg">
                    Enregistrer les Modifications
                </button>
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

export default memo(SettingsPage);

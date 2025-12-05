import React, { useState, useRef, useCallback, memo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Page } from '../types';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowUturnLeftIcon } from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';

interface BackupPageProps {
  setPage: (page: Page) => void;
}

const BackupPage: React.FC<BackupPageProps> = ({ setPage }) => {
    const { currentUser, restoreUserData, showToast } = useBuvette();
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = useCallback(() => {
        if (!currentUser) {
            showToast("Aucun utilisateur n'est connecté.", "error");
            return;
        }

        try {
            const userData = localStorage.getItem(`buv-data-${currentUser.id}`);
            if (!userData) {
                showToast("Aucune donnée à exporter.", "error");
                return;
            }

            const blob = new Blob([userData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            
            a.href = url;
            a.download = `buvette-plus-sauvegarde-${currentUser.email}-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Exportation réussie !", "success");

        } catch (error) {
            console.error("Export failed:", error);
            showToast("L'exportation a échoué.", "error");
        }
    }, [currentUser, showToast]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'application/json') {
                showToast("Veuillez sélectionner un fichier de sauvegarde JSON valide.", "error");
                return;
            }
            setFileToImport(file);
            setConfirmOpen(true);
        }
        // Reset file input to allow re-selection of the same file
        event.target.value = '';
    };

    const handleImportConfirm = () => {
        if (!fileToImport) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Le fichier est vide ou illisible.");

                const data = JSON.parse(text);
                const success = restoreUserData(data);

                if (!success) {
                    showToast("Le fichier de sauvegarde est invalide ou corrompu.", "error");
                }
                // Success message and reload are handled by `restoreUserData`
            } catch (error) {
                console.error("Import failed:", error);
                showToast("Erreur lors de la lecture du fichier de sauvegarde.", "error");
            } finally {
                setFileToImport(null);
            }
        };
        reader.onerror = () => {
            showToast("Impossible de lire le fichier.", "error");
            setFileToImport(null);
        };
        reader.readAsText(fileToImport);
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-display text-amber-400">Sauvegarde</h1>
                 <button 
                    onClick={() => setPage(Page.More)} 
                    className="text-slate-300 hover:text-amber-400 p-2 rounded-full transition-colors"
                    aria-label="Retour"
                >
                    <ArrowUturnLeftIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-center text-slate-400">
                Exportez vos données pour les conserver en sécurité ou pour les transférer sur un autre appareil.
            </p>

            {/* Export Section */}
            <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border border-white/10 text-center">
                 <h2 className="text-2xl font-display text-slate-200 flex items-center justify-center gap-2">
                    <ArrowDownTrayIcon className="w-6 h-6"/>
                    Exporter les données
                </h2>
                <p className="text-slate-300 mt-2 mb-4">
                    Téléchargez un fichier JSON contenant toutes vos données actuelles (produits, ventes, paramètres, etc.).
                </p>
                <button 
                    onClick={handleExport}
                    className="bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg"
                >
                    Télécharger ma sauvegarde
                </button>
            </div>

            {/* Import Section */}
            <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border-2 border-red-500/50 text-center">
                <h2 className="text-2xl font-display text-red-400 flex items-center justify-center gap-2">
                    <ArrowUpTrayIcon className="w-6 h-6"/>
                    Restaurer une sauvegarde
                </h2>
                <div className="mt-2 mb-4 bg-red-900/40 p-3 rounded-lg">
                    <p className="font-bold text-red-300">ATTENTION : DANGER</p>
                    <p className="text-slate-300 text-sm">
                        Importer un fichier écrasera **toutes vos données actuelles** de façon irréversible.
                    </p>
                </div>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:scale-105 font-display text-lg"
                >
                    Importer un fichier
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="application/json,.json"
                    className="hidden"
                />
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => { setConfirmOpen(false); setFileToImport(null); }}
                onConfirm={handleImportConfirm}
                title="Confirmer la Restauration"
                message={<>Êtes-vous absolument certain(e) de vouloir restaurer les données depuis le fichier <strong>{fileToImport?.name}</strong> ?<br /><br />Cette action remplacera toutes vos données actuelles et ne peut pas être annulée.</>}
                confirmText="Oui, Écraser & Restaurer"
            />
        </div>
    );
};

export default memo(BackupPage);
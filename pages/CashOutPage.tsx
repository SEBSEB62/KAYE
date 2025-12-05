import React, { useState, useRef, memo, useEffect } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Page } from '../types';
import NumericKeypad from '../components/NumericKeypad';
import { PhotoIcon, ArrowUturnLeftIcon } from '../components/Icons';
import { compressImage } from '../utils/image';
import ProductImage from '../components/ProductImage';

interface CashOutPageProps {
  setPage: (page: Page) => void;
}

const CashOutPage: React.FC<CashOutPageProps> = ({ setPage }) => {
    const { cashOuts, addCashOut, showToast } = useBuvette();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [receiptImage, setReceiptImage] = useState<Blob | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalCashOuts = cashOuts.reduce((sum, co) => sum + co.amount, 0);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (receiptPreview) {
                URL.revokeObjectURL(receiptPreview);
            }
        };
    }, [receiptPreview]);

    const handleKeypadInput = (key: string) => {
        setAmount(prev => {
            if (key === '.') {
                if (prev.includes('.')) return prev;
                if (prev === '') return '0.';
                return prev + '.';
            }
            if (prev.includes('.')) {
                const decimalPart = prev.split('.')[1];
                if (decimalPart.length >= 2) return prev;
            }
            if (prev === '0' && key !== '.') return key;
            return prev + key;
        });
    };

    const handleKeypadDelete = () => {
        setAmount(prev => prev.slice(0, -1));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600 });
                setReceiptImage(compressed);
                
                // Clean up previous preview if it exists
                if (receiptPreview) {
                    URL.revokeObjectURL(receiptPreview);
                }
                
                const previewUrl = URL.createObjectURL(compressed);
                setReceiptPreview(previewUrl);
            } catch (err) {
                showToast(err instanceof Error ? err.message : 'Erreur lors du traitement de l\'image.', 'error');
            }
        }
    };
    
    const removeReceiptImage = () => {
        setReceiptImage(null);
        if (receiptPreview) {
            URL.revokeObjectURL(receiptPreview);
        }
        setReceiptPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearForm = () => {
        setAmount('');
        setReason('');
        removeReceiptImage();
    };

    const handleSubmit = () => {
        const cashOutAmount = parseFloat(amount);
        if (!cashOutAmount || cashOutAmount <= 0) {
            showToast('Veuillez entrer un montant valide.', 'error');
            return;
        }
        if (!reason) {
            showToast('Veuillez entrer une raison pour la sortie.', 'error');
            return;
        }
        addCashOut(cashOutAmount, reason, receiptImage);
        clearForm();
    };
    
    const inputStyles = "mt-1 block w-full p-3 bg-[#1a1a1a] border-2 border-white/20 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-display text-amber-400">Sorties d'Espèces</h1>
                <button onClick={() => setPage(Page.More)} className="text-slate-300 hover:text-amber-400 p-2 rounded-full transition-colors" aria-label="Retour">
                    <ArrowUturnLeftIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="bg-[#2a2a2a] border-2 border-amber-500/50 p-6 rounded-2xl shadow-lg text-center">
                <h3 className="font-bold text-xl text-slate-200">Total des Sorties d'Espèces</h3>
                <p className="text-4xl font-display text-amber-300 tracking-wider mt-1">{totalCashOuts.toFixed(2)}€</p>
            </div>

            <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border border-white/10">
                <h2 className="text-2xl font-display text-slate-200 mb-4 text-center">Nouvelle Sortie</h2>
                <div className="space-y-4">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Montant de la sortie</label>
                        <div className="text-5xl font-display text-amber-300 p-4 bg-black/30 rounded-lg tracking-wider min-h-[76px] flex items-center justify-center">
                            <span>{amount || '0.00'}<span className="text-4xl ml-1">€</span></span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Raison</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="ex: Achat de glaçons" className={inputStyles}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Justificatif (optionnel)</label>
                        {receiptPreview ? (
                             <div className="mt-2 flex items-center gap-4">
                                <img src={receiptPreview} alt="Aperçu du justificatif" className="w-20 h-20 rounded-lg object-cover border-2 border-white/20" />
                                <button onClick={removeReceiptImage} className="text-sm text-red-400 hover:text-red-300">Supprimer l'image</button>
                            </div>
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()} className={`w-full mt-1 flex items-center justify-center gap-2 ${inputStyles}`}>
                                <PhotoIcon className="w-5 h-5"/>
                                Ajouter une photo
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                    </div>
                    <NumericKeypad onKeyPress={handleKeypadInput} onDelete={handleKeypadDelete} />
                    <button onClick={handleSubmit} disabled={!amount || !reason} className="!mt-6 w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Enregistrer la Sortie
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-display text-slate-200 mb-2 text-center">Sorties Récentes</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto p-2 bg-black/20 rounded-lg">
                    {cashOuts.length > 0 ? cashOuts.map(co => (
                        <div key={co.id} className="bg-[#2a2a2a] p-3 rounded-lg shadow-sm border-l-4 border-amber-500 flex items-center gap-4">
                            {co.receiptImage && (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <ProductImage image={co.receiptImage} alt={`Justificatif pour ${co.reason}`} className="w-full h-full object-cover"/>
                                </div>
                            )}
                            <div className="flex-grow">
                                <p className="font-bold text-slate-200">{co.reason}</p>
                                <p className="text-xs text-slate-400">{new Date(co.date).toLocaleString('fr-FR')}</p>
                            </div>
                            <p className="font-bold text-lg text-red-400">-{co.amount.toFixed(2)}€</p>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 p-4">Aucune sortie d'espèces enregistrée.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(CashOutPage);

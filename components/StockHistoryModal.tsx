
import React from 'react';
import Modal from './Modal';
import { StockHistoryEntry } from '../types';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: StockHistoryEntry[];
  productName: string;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose, history, productName }) => {

    const getEntryStyle = (type: StockHistoryEntry['type']) => {
        switch (type) {
            case 'sale': return { icon: '🛒', color: 'text-red-400' };
            case 'add': return { icon: '📦', color: 'text-emerald-400' };
            case 'edit': return { icon: '✏️', color: 'text-sky-400' };
            case 'refund': return { icon: '↩️', color: 'text-amber-400' };
            case 'initial': return { icon: '✨', color: 'text-purple-400' };
            default: return { icon: '📝', color: 'text-slate-400' };
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Historique de ${productName}`}>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {history.length > 0 ? history.map(entry => {
                    const { icon, color } = getEntryStyle(entry.type);
                    const sign = entry.quantityChange > 0 ? '+' : '';
                    return (
                        <div key={entry.id} className="bg-black/20 p-3 rounded-lg flex items-center space-x-3">
                            <span className="text-2xl">{icon}</span>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-200 capitalize">{entry.type}</p>
                                <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleString('fr-FR')}</p>
                                {entry.note && <p className="text-xs text-slate-300 italic">"{entry.note}"</p>}
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-lg ${color}`}>{sign}{entry.quantityChange}</p>
                                <p className="text-xs text-slate-400">Stock: {entry.newStock}</p>
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-center text-slate-400 p-4">Aucun historique pour ce produit.</p>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(StockHistoryModal);

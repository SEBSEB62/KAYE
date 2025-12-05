
import React, { useState, memo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import NumericKeypad from '../components/NumericKeypad';
import { BanknotesIcon, CreditCardIcon } from '../components/Icons';

const DonationsPage: React.FC = () => {
    const { donations, addDonation, showToast, labels } = useBuvette();
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

    const handleDonation = (method: 'cash' | 'card') => {
        const donationAmount = parseFloat(amount);
        if (donationAmount > 0) {
            addDonation(donationAmount, name, note, method);
            setAmount('');
            setName('');
            setNote('');
        } else {
            showToast("Veuillez entrer un montant valide.", "error");
        }
    };

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

    const isFormValid = parseFloat(amount) > 0;

    const inputStyles = "mt-1 block w-full p-3 bg-[#1a1a1a] border-2 border-white/20 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition";

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-display text-center text-amber-400">{labels.donation}s & Soutien</h1>
            
            <div className="bg-[#2a2a2a] border-2 border-amber-500/50 p-6 rounded-2xl shadow-lg text-center">
                <h3 className="font-bold text-xl text-slate-200">Total Reçu</h3>
                <p className="text-4xl font-display text-amber-300 tracking-wider mt-1">{totalDonations.toFixed(2)}€</p>
                <p className="mt-2 text-amber-200/80">Merci pour votre générosité ! 💖</p>
            </div>

            <div className="bg-[#2a2a2a] p-6 rounded-2xl shadow-md border border-white/10">
                <h2 className="text-2xl font-display text-slate-200 mb-4 text-center">Ajouter un {labels.donation}</h2>
                <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Nom (optionnel)</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Généreux Donateur" className={inputStyles}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Message (optionnel)</label>
                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Pour les champions !" className={inputStyles}/>
                        </div>
                    </div>
                     <div className="text-center pt-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Montant</label>
                        <div className="text-5xl font-display text-amber-300 p-4 bg-black/30 rounded-lg tracking-wider min-h-[76px] flex items-center justify-center">
                            <span>{amount || '0.00'}<span className="text-4xl ml-1">€</span></span>
                        </div>
                    </div>

                    <NumericKeypad
                        onKeyPress={handleKeypadInput}
                        onDelete={handleKeypadDelete}
                    />

                    <div className="!mt-6 grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleDonation('cash')} 
                            disabled={!isFormValid} 
                            className="flex items-center justify-center gap-2 bg-transparent text-amber-400 border-2 border-amber-400 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-900/40 transition-all transform hover:scale-105 font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            <BanknotesIcon className="w-6 h-6"/> Espèces
                        </button>
                        <button 
                            onClick={() => handleDonation('card')} 
                            disabled={!isFormValid} 
                            className="flex items-center justify-center gap-2 bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            <CreditCardIcon className="w-6 h-6"/> Carte
                        </button>
                    </div>
                </div>
            </div>

             <div>
                <h2 className="text-2xl font-display text-slate-200 mb-2 text-center">Historique Récent</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto p-2 bg-black/20 rounded-lg">
                    {donations.length > 0 ? donations.map(donation => (
                        <div key={donation.id} className="bg-[#2a2a2a] p-3 rounded-lg shadow-sm border-l-4 border-amber-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-200">{donation.name}</p>
                                    {donation.note && <p className="text-sm text-slate-300 italic">"{donation.note}"</p>}
                                    <p className="text-xs text-slate-400">{new Date(donation.date).toLocaleString('fr-FR')}</p>
                                </div>
                                <div className="text-right flex flex-col items-end space-y-1">
                                     <p className="font-bold text-lg text-emerald-400">+{donation.amount.toFixed(2)}€</p>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        donation.paymentMethod === 'card' 
                                            ? 'bg-sky-900/50 text-sky-300' 
                                            : 'bg-emerald-900/50 text-emerald-300'
                                    }`}>
                                        {donation.paymentMethod === 'card' ? 'Carte' : 'Espèces'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 p-4">Aucun don pour le moment.</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default memo(DonationsPage);

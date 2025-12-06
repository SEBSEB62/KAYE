
import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Page, SaleRecord, CartItem } from '../types';
import Modal from '../components/Modal';
import NumericKeypad from '../components/NumericKeypad';
import ConfirmModal from '../components/ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BanknotesIcon, CreditCardIcon, UserCircleIcon, DocumentTextIcon, QrCodeIcon } from '../components/Icons';
import ProductImage from '../components/ProductImage';
import { blobToDataURL } from '../utils/image';
import { formatCurrency } from '../utils/formatting';

interface CartPageProps {
  setPage: (page: Page) => void;
}

interface SuccessScreenProps {
  transaction: { sale: SaleRecord; cashReceived?: number };
  onNewSale: () => void;
  onGenerateReceipt: (sale: SaleRecord) => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = memo(({ transaction, onNewSale, onGenerateReceipt }) => {
    const { settings } = useBuvette();
    const { sale, cashReceived } = transaction;
    const changeToRender = (cashReceived ?? 0) - sale.total;

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-8xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-4xl font-display text-amber-400 mt-4">Vente de {formatCurrency(sale.total)} Complète !</h1>
            {sale.customerName && <p className="text-slate-300 mt-2 text-lg">Client: {sale.customerName}</p>}
            {sale.paymentMethod === 'cash' && cashReceived !== undefined && (
                <div className="mt-4 text-center p-4 bg-emerald-900/50 rounded-lg border border-emerald-700 w-full max-w-xs space-y-2">
                    <p className="text-sm text-slate-400">Montant reçu : {formatCurrency(Number(cashReceived))}</p>
                    {changeToRender >= 0 && (
                        <div>
                            <p className="text-xl text-emerald-300">Monnaie à rendre :</p>
                            <p className="text-4xl font-display text-emerald-200">{formatCurrency(changeToRender)}</p>
                        </div>
                    )}
                </div>
            )}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                {settings.businessName && (
                  <button
                    onClick={() => onGenerateReceipt(sale)}
                    className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg"
                  >
                    Générer Ticket
                  </button>
                )}
                <button
                    onClick={onNewSale}
                    className="w-full bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-slate-700 transition-colors font-display text-lg"
                >
                    Nouvelle Vente
                </button>
            </div>
        </div>
    );
});

const QuantityEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: CartItem | null;
}> = memo(({ isOpen, onClose, item }) => {
  const { updateCartQuantity, products, showToast } = useBuvette();
  const [quantity, setQuantity] = useState('');

  const productInStock = useMemo(() => item ? products.find(p => p.id === item.id) : null, [products, item]);
  const maxStock = item?.isMisc ? Infinity : (productInStock?.stock ?? 0);

  useEffect(() => {
    if (item) {
      setQuantity(String(item.quantity));
    }
  }, [item]);

  const handleConfirm = () => {
    const newQuantity = parseInt(quantity, 10);
    if (item && !isNaN(newQuantity)) {
      if (newQuantity > maxStock) {
          showToast(`Stock insuffisant. ${maxStock} disponible(s).`, 'error');
          updateCartQuantity(item.id, maxStock);
      } else {
          updateCartQuantity(item.id, newQuantity);
      }
    }
    onClose();
  };
  
  const handleKeypadInput = (key: string) => {
    if (key === '.') return; // No decimals for quantity
    setQuantity(prev => (prev === '0' ? key : prev + key));
  };
  
  const handleKeypadDelete = () => {
    setQuantity(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modifier Quantité`}>
      <div className="space-y-4 text-center">
        <p className="text-xl text-slate-200 font-display">{item.name}</p>
        {!item.isMisc && <p className="text-sm text-slate-400">Stock disponible : {maxStock}</p>}
        <input 
          type="text" 
          readOnly
          value={quantity}
          className="block w-full text-center text-4xl p-2 border-white/20 rounded-md shadow-sm bg-[#1a1a1a] text-white font-sans"
        />
        <NumericKeypad
          onKeyPress={handleKeypadInput}
          onDelete={handleKeypadDelete}
          onDone={handleConfirm}
        />
      </div>
    </Modal>
  );
});

const CartPage: React.FC<CartPageProps> = ({ setPage }) => {
  const { cart, cartTotal, cartTokenTotal, settings, cartCount, removeFromCart, processSale, clearCart } = useBuvette();
  const [isCashModalOpen, setCashModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ sale: SaleRecord; cashReceived?: number } | null>(null);
  const [isKeypadVisible, setKeypadVisible] = useState(false);
  const [isConfirmClearOpen, setConfirmClearOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const processAndShowSuccess = useCallback((method: 'cash' | 'card' | 'token' | 'check' | 'paypal' | 'wero', cashReceivedAmount?: number) => {
      setIsEditMode(false);
      const sale = processSale(method, customerName);
      setLastTransaction({ sale, cashReceived: cashReceivedAmount });
      setShowSuccessScreen(true);

      if (method === 'cash') {
          setCashModalOpen(false);
          setKeypadVisible(false);
          setCashReceived('');
      }
  }, [processSale, customerName]);

  const handleCashPayment = () => {
    processAndShowSuccess('cash', Number(cashReceived));
  };
  
  const handleGenericPayment = (method: 'card' | 'token' | 'check' | 'paypal' | 'wero') => {
    processAndShowSuccess(method);
  };

  const generateReceipt = useCallback(async (sale: SaleRecord) => {
    const doc = new jsPDF();
    const { businessName, businessAddress, businessContact, receiptFooter, businessLogo } = settings;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let headerY = 20;

    // --- Header ---
    if (businessLogo) {
        try {
            let logoDataUrl = '';
            if (businessLogo instanceof Blob) {
                logoDataUrl = await blobToDataURL(businessLogo);
            } else if (typeof businessLogo === 'string' && businessLogo.startsWith('data:')) {
                logoDataUrl = businessLogo;
            }
            
            if (logoDataUrl) {
                const img = new Image();
                img.src = logoDataUrl;
                await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                const logoHeight = 15;
                const logoWidth = (img.width * logoHeight) / img.height;
                const logoX = (pageWidth / 2) - (logoWidth / 2); // Center logo
                doc.addImage(logoDataUrl, 'PNG', logoX, 15, logoWidth, logoHeight);
                headerY = 35; // Move text down to make space for the logo
            }
        } catch (e) {
            console.error("Could not add logo to receipt:", e);
        }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(businessName || 'Buvette', pageWidth / 2, headerY, { align: 'center' });
    headerY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (businessAddress) {
      doc.text(businessAddress, pageWidth / 2, headerY, { align: 'center' });
      headerY += 5;
    }
    if (businessContact) {
      doc.text(businessContact, pageWidth / 2, headerY, { align: 'center' });
      headerY += 5;
    }

    // --- Sale Info ---
    headerY += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Ticket de Caisse', margin, headerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Transaction : #${sale.id.slice(-6)}`, margin, headerY + 7);
    doc.text(`Date : ${new Date(sale.date).toLocaleString('fr-FR')}`, margin, headerY + 12);
    
    if (sale.customerName) {
        doc.text(`Client : ${sale.customerName}`, margin, headerY + 17);
        headerY += 5; // Adjust space if customer name exists
    }

    // --- Table ---
    const tableColumn = ["Produit", "Qté", "P.U.", "Total"];
    const tableRows: (string | number)[][] = [];
    sale.items.forEach(item => {
        const price = settings.tokenMode ? item.tokenPrice || 0 : item.price;
        const total = price * item.quantity;
        if (settings.tokenMode) {
          tableRows.push([
            item.name,
            item.quantity,
            `${price.toFixed(0)} J`,
            `${total.toFixed(0)} J`,
          ]);
        } else {
          tableRows.push([
            item.name,
            item.quantity,
            `${formatCurrency(price)}`,
            `${formatCurrency(total)}`,
          ]);
        }
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: headerY + 20,
        theme: 'plain',
        headStyles: { fontStyle: 'bold', fillColor: false, textColor: 20 },
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // --- Total ---
    doc.setDrawColor(180); // Light gray line
    doc.line(margin, finalY + 6, pageWidth - margin, finalY + 6);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const totalLabel = settings.tokenMode ? `${sale.total} Jeton${sale.total > 1 ? 's' : ''}` : `${formatCurrency(sale.total)}`;
    const totalText = `TOTAL : ${totalLabel}`;
    doc.text(totalText, pageWidth - margin, finalY + 15, { align: 'right' });

    // --- Payment Method ---
    let paymentMethodText = '';
    switch(sale.paymentMethod) {
        case 'card': paymentMethodText = 'Carte Bancaire'; break;
        case 'token': paymentMethodText = 'Jetons'; break;
        case 'cash': paymentMethodText = 'Espèces'; break;
        case 'check': paymentMethodText = 'Chèque'; break;
        case 'paypal': paymentMethodText = 'PayPal'; break;
        case 'wero': paymentMethodText = 'Wero'; break;
        default: paymentMethodText = 'Autre'; break;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payé par : ${paymentMethodText}`, margin, finalY + 15);

    // --- Footer ---
    if(receiptFooter) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(receiptFooter, pageWidth / 2, pageHeight - 15, { align: 'center', maxWidth: pageWidth - (margin * 2) });
    }

    doc.save(`ticket-${sale.id}.pdf`);
  }, [settings]);
  
  const handleNewSale = useCallback(() => {
    setShowSuccessScreen(false);
    setLastTransaction(null);
    setCustomerName('');
    setPage(Page.Sale);
  }, [setPage]);

  const handleKeypadInput = (key: string) => {
    if (key === '.' && cashReceived.includes('.')) return;
    setCashReceived(prev => prev + key);
  };

  const handleKeypadDelete = () => {
      setCashReceived(prev => prev.slice(0, -1));
  };
  
  const getSuggestedAmounts = (total: number) => {
    if (total <= 5) return [5, 10, 20];
    if (total <= 10) return [10, 20, 50];
    if (total <= 20) return [20, 50, 100];
    const nextFive = Math.ceil(total / 5) * 5;
    const nextTen = Math.ceil(total / 10) * 10;
    const nextTwenty = Math.ceil(total / 20) * 20;
    const suggestions = [nextFive, nextTen, nextTwenty].filter(v => v > total);
    return [...new Set(suggestions)].sort((a, b) => a - b).slice(0, 3);
  };
  
  const suggestedAmounts = useMemo(() => getSuggestedAmounts(cartTotal), [cartTotal]);
  const change = Number(cashReceived) - cartTotal;

  // --- Fee Calculation Logic (2025 Rates) ---
  // SumUp: 1.75%
  const sumUpFees = cartTotal * 0.0175;
  const sumUpNet = cartTotal - sumUpFees;

  // PayPal: 2.90% + 0.35€ (Fixed fee applies only if total > 0)
  const paypalFees = cartTotal > 0 ? (cartTotal * 0.029) + 0.35 : 0;
  const paypalNet = Math.max(0, cartTotal - paypalFees);

  if (showSuccessScreen && lastTransaction) {
    return (
        <SuccessScreen
          transaction={lastTransaction}
          onNewSale={handleNewSale}
          onGenerateReceipt={generateReceipt}
        />
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-7xl">🛒</div>
        <h1 className="text-3xl font-display text-slate-200 mt-4">Panier Vide</h1>
        <p className="text-slate-400 mt-2">Ajoutez des produits depuis la page de vente.</p>
        <button
          onClick={() => setPage(Page.Sale)}
          className="mt-6 bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-transform font-display text-lg"
        >
          Parcourir les produits
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-display text-amber-400">Panier ({cartCount})</h1>
        <button onClick={() => setIsEditMode(!isEditMode)} className="font-bold text-amber-400 px-4 py-2 rounded-lg transition-colors hover:bg-white/10">
          {isEditMode ? 'Terminé' : 'Modifier'}
        </button>
      </div>
      <div className="space-y-3">
        {cart.map(item => (
          <div key={item.id} className="glass-panel p-3 rounded-xl shadow-sm border border-white/10 flex items-center gap-3">
            {isEditMode && (
                <button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-200 animate-in fade-in-0 zoom-in-90" aria-label={`Supprimer ${item.name}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            )}
            <div className="flex items-center space-x-4 flex-grow">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/20 dark:bg-black/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <ProductImage
                    image={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain text-3xl"
                  />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{settings.tokenMode ? `${item.tokenPrice || 0} Jeton(s)` : `${formatCurrency(item.price)}`}</p>
              </div>
            </div>
            <button 
                onClick={() => setEditingItem(item)}
                className="px-5 py-3 text-slate-800 dark:text-slate-200 font-semibold text-lg border border-slate-300 dark:border-white/20 rounded-lg transition-colors hover:bg-white/20 min-w-[60px] text-center"
                aria-label={`Modifier la quantité pour ${item.name}, actuellement ${item.quantity}`}
            >
                {item.quantity}
            </button>
          </div>
        ))}
         <div className="flex justify-end items-center pt-4 border-t border-white/10 mt-4">
            <button onClick={() => setConfirmClearOpen(true)} className="text-sm text-slate-500 hover:text-red-500 transition-colors">Vider le panier</button>
         </div>
      </div>

      <div className="mt-6 p-5 glass-panel rounded-2xl shadow-lg border-2 border-amber-500/50">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-display text-slate-800 dark:text-slate-200">Total:</span>
          {settings.tokenMode ? (
              <span className="text-3xl font-display text-amber-600 dark:text-amber-300">{cartTokenTotal} Jeton{cartTokenTotal > 1 ? 's' : ''}</span>
           ) : (
             <span className="text-3xl font-display text-amber-600 dark:text-amber-300">{formatCurrency(cartTotal)}</span>
           )}
        </div>
        {!settings.tokenMode && (
            <div className="mt-3 pt-3 border-t border-slate-300/20 dark:border-white/10 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Net si paiement CB (SumUp) :</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(sumUpNet)}</span>
                </div>
                 <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Net si paiement PayPal :</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paypalNet)}</span>
                </div>
            </div>
        )}
      </div>
      
      <div className="mt-6 space-y-4">
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <UserCircleIcon className="w-5 h-5" />
            </div>
            <input 
                type="text" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                placeholder="Nom du client (optionnel)" 
                className="w-full p-3 pl-10 bg-white/20 dark:bg-[#1a1a1a] border border-white/20 text-slate-900 dark:text-white rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 transition placeholder-slate-500 dark:placeholder-slate-400"
            />
        </div>

        {settings.tokenMode ? (
            <button onClick={() => handleGenericPayment('token')} className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg">Valider l'échange</button>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCashModalOpen(true)} className="col-span-1 flex items-center justify-center bg-white/10 dark:bg-transparent text-amber-600 dark:text-amber-400 border-2 border-amber-500 dark:border-amber-400 font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-amber-500/10 transition-all transform hover:scale-105 font-display text-lg">
                    <BanknotesIcon className="w-6 h-6 mr-2" />Espèces
                </button>
                <button onClick={() => handleGenericPayment('card')} className="col-span-1 flex items-center justify-center bg-amber-500 text-black font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg">
                    <CreditCardIcon className="w-6 h-6 mr-2" />Carte
                </button>
                
                {/* Secondary Payments */}
                <button onClick={() => handleGenericPayment('check')} className="flex flex-col items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2 px-2 rounded-xl shadow hover:opacity-90 transition-all">
                    <DocumentTextIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Chèque</span>
                </button>
                <button onClick={() => handleGenericPayment('paypal')} className="flex flex-col items-center justify-center bg-[#003087] text-white font-bold py-2 px-2 rounded-xl shadow hover:opacity-90 transition-all">
                    <QrCodeIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">PayPal</span>
                </button>
                <button onClick={() => handleGenericPayment('wero')} className="col-span-2 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow hover:opacity-90 transition-all">
                    <QrCodeIcon className="w-5 h-5" />
                    <span className="text-sm">Wero (Virement Instantané)</span>
                </button>
            </div>
        )}
        
        {!settings.tokenMode && settings.appMode === 'association' && (
             <div className="pt-2 text-center">
                <button onClick={() => handleGenericPayment('token')} className="text-amber-500 hover:text-amber-400 text-sm font-bold underline decoration-dotted">
                    Payer en Jetons
                </button>
             </div>
        )}
      </div>

      <Modal isOpen={isCashModalOpen} onClose={() => { setCashModalOpen(false); setKeypadVisible(false); }} title="Paiement Espèces">
        <div className="space-y-4">
            <p className="text-center text-lg text-slate-200">Total à payer: <span className="font-bold text-2xl font-display text-amber-400">{formatCurrency(cartTotal)}</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => setCashReceived(cartTotal.toFixed(2))} className="py-2 px-3 text-sm font-bold bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Exact</button>
                {suggestedAmounts.map(amount => (
                    <button key={amount} onClick={() => setCashReceived(String(amount))} className="py-2 px-3 text-sm font-bold bg-white/10 rounded-lg hover:bg-white/20 transition-colors">{amount}€</button>
                ))}
            </div>
            <div>
                <label htmlFor="cash" className="block text-sm font-medium text-slate-300 mb-2 text-center">Montant reçu</label>
                <input 
                    type="text" 
                    id="cash" 
                    readOnly
                    value={cashReceived}
                    onFocus={() => setKeypadVisible(true)}
                    placeholder="0.00"
                    className="block w-full text-center text-3xl p-3 border-2 border-white/20 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 bg-[#1a1a1a] text-white cursor-pointer font-sans"
                />
            </div>
            {cashReceived && change >= 0 && (
                <div className="text-center p-3 bg-emerald-900/50 rounded-lg border border-emerald-700">
                    <p className="text-lg text-emerald-300">Monnaie à rendre:</p>
                    <p className="text-3xl font-display text-emerald-300">{formatCurrency(change)}</p>
                </div>
            )}
             {cashReceived && change < 0 && (
                <div className="text-center p-3 bg-red-900/50 rounded-lg border border-red-700">
                    <p className="text-lg text-red-300">Montant insuffisant</p>
                </div>
            )}
            {isKeypadVisible ? (
                <NumericKeypad
                    onKeyPress={handleKeypadInput}
                    onDelete={handleKeypadDelete}
                    onDone={() => setKeypadVisible(false)}
                />
            ) : (
                <button 
                    onClick={handleCashPayment}
                    disabled={!cashReceived || change < 0}
                    className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 font-display text-lg disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirmer Vente
                </button>
            )}
        </div>
      </Modal>
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={clearCart}
        title="Vider le panier"
        message="Êtes-vous sûr de vouloir supprimer tous les articles du panier ? Cette action est irréversible."
        confirmText="Vider"
      />
      <QuantityEditModal 
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
      />
    </div>
  );
};

export default memo(CartPage);

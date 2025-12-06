
import React, { useState, useMemo, memo, useCallback } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { Product } from '../types';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import NumericKeypad from '../components/NumericKeypad';
import { SearchIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '../components/Icons';
import ProductImage from '../components/ProductImage';
import { formatCurrency } from '../utils/formatting';
import StockHistoryModal from '../components/StockHistoryModal';
import ConfirmModal from '../components/ConfirmModal';
import { useDebounce } from '../hooks/useDebounce';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const AddStockModal: React.FC<{ product: Product | null, onClose: () => void }> = memo(({ product, onClose }) => {
    const { updateProduct, addStockHistoryEntry } = useBuvette();
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');

    const handleConfirm = () => {
        if (!product || !quantity) return;
        const amountToAdd = parseInt(quantity, 10);
        if (isNaN(amountToAdd) || amountToAdd <= 0) return;

        const newStock = product.stock + amountToAdd;
        updateProduct({ ...product, stock: newStock });
        addStockHistoryEntry({
            productId: product.id,
            productName: product.name,
            type: 'add',
            quantityChange: amountToAdd,
            newStock: newStock,
            note: note || 'Ajout manuel'
        });
        onClose();
    };

    if (!product) return null;

    return (
        <Modal isOpen={!!product} onClose={onClose} title={`Ajouter du Stock`}>
             <div className="space-y-4 text-center">
                <p className="text-xl text-slate-200 font-display">{product.name}</p>
                <p className="text-sm text-slate-400">Stock actuel : {product.stock}</p>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Note (optionnel)</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="ex: Nouvelle livraison" className="block w-full p-2 border-white/20 rounded-md shadow-sm bg-[#1a1a1a] text-white"/>
                </div>
                <input
                    type="text"
                    readOnly
                    value={quantity}
                    placeholder="Quantité à ajouter"
                    className="block w-full text-center text-4xl p-2 border-white/20 rounded-md shadow-sm bg-[#1a1a1a] text-white font-sans"
                />
                <NumericKeypad
                    onKeyPress={(key) => { if (key !== '.') setQuantity(prev => prev + key); }}
                    onDelete={() => setQuantity(prev => prev.slice(0, -1))}
                    onDone={handleConfirm}
                />
            </div>
        </Modal>
    );
});

const LowStockAlert: React.FC<{ products: Product[] }> = ({ products }) => (
    <div className="bg-amber-900/50 border-2 border-amber-500/50 p-4 rounded-2xl animate-in fade-in-0">
        <h2 className="text-lg font-display text-amber-300 flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-6 h-6" />
            Alerte Stock Bas
        </h2>
        <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {products.map(p => (
                <div key={p.id} className="bg-[#2a2a2a] p-3 rounded-xl shadow-sm w-36 flex-shrink-0 text-center border border-amber-500/50">
                     <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center mx-auto border border-white/10">
                        <ProductImage image={p.image} alt={p.name} className="w-full h-full object-contain text-3xl"/>
                    </div>
                    <p className="font-bold text-slate-200 truncate mt-2 text-sm">{p.name}</p>
                    <p className="text-amber-400 font-bold font-sans text-lg">{p.stock} restant{p.stock > 1 ? 's' : ''}</p>
                </div>
            ))}
        </div>
    </div>
);


const StockPage: React.FC = () => {
    const { products, settings, stockHistory, deleteProduct, showToast } = useBuvette();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [addingStockTo, setAddingStockTo] = useState<Product | null>(null);
    const [viewingHistoryOf, setViewingHistoryOf] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filter, setFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'stock'>('name');

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingProduct({});
        setFormOpen(true);
    };

    const closeForm = () => {
        setEditingProduct(null);
        setFormOpen(false);
    };

    const productHistory = useMemo(() => {
        if (!viewingHistoryOf) return [];
        return stockHistory.filter(entry => entry.productId === viewingHistoryOf.id);
    }, [viewingHistoryOf, stockHistory]);
    
    const lowStockProducts = useMemo(() =>
        products
            .filter(p => p.stock <= settings.lowStockThreshold && p.stock > 0)
            .sort((a, b) => a.stock - b.stock),
    [products, settings.lowStockThreshold]);

    const filteredAndSortedProducts = useMemo(() => {
        const filtered = products.filter(p => {
            const searchMatch = p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            let filterMatch = true;
            if (filter === 'low') {
                filterMatch = p.stock <= settings.lowStockThreshold && p.stock > 0;
            } else if (filter !== 'all') {
                filterMatch = p.category === filter;
            }
            return searchMatch && filterMatch;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return a.stock - b.stock;
        });
    }, [products, debouncedSearchTerm, filter, sortBy, settings.lowStockThreshold]);

    const handleConfirmDelete = useCallback(() => {
        if (deletingProduct) {
            deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
        }
    }, [deletingProduct, deleteProduct]);

    const generateStockPDF = useCallback(() => {
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString('fr-FR');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text(settings.businessName || "Buvette+", 14, 22);
            doc.setFontSize(16);
            doc.text(`État des Stocks - ${date}`, 14, 30);

            const productsByCategory = products.reduce((acc, p) => {
                const category = p.category || 'Divers';
                if (!acc[category]) acc[category] = [];
                acc[category].push(p);
                return acc;
            }, {} as Record<string, Product[]>);

            let finalY = 40;

            for (const category of Object.keys(productsByCategory)) {
                if (productsByCategory[category]) {
                    const tableRows = productsByCategory[category].map(p => [
                        p.name,
                        p.stock,
                        '', // Empty for manual count
                        '', // Empty for notes
                    ]);

                    autoTable(doc, {
                        head: [[{ content: category, styles: { fillColor: [41, 128, 185], textColor: 255 } }]],
                        body: [['Produit', 'Stock Actuel', 'Quantité Comptée', 'Notes'], ...tableRows],
                        startY: finalY,
                        didParseCell: (data) => {
                            if (data.row.index === 0 && data.section === 'body') {
                                data.cell.styles.fontStyle = 'bold';
                            }
                        },
                        theme: 'grid',
                    });
                    finalY = (doc as any).lastAutoTable.finalY + 15;
                }
            }
            
            doc.save(`inventaire-buvette-plus-${new Date().toISOString().slice(0,10)}.pdf`);
            showToast("PDF d'inventaire généré avec succès !");
        } catch(e) {
            console.error(e);
            showToast("Erreur lors de la génération du PDF.", "error");
        }
    }, [products, settings.businessName, showToast]);

    const categories: string[] = ['all', 'low', ...settings.categories];
    const lowStockCount = lowStockProducts.length;

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-display text-center text-amber-400">Gestion du Stock</h1>
            
            {lowStockCount > 0 && <LowStockAlert products={lowStockProducts} />}

            <div className="sticky top-0 z-10 bg-[#111] py-2 space-y-4">
                 <div className="relative">
                    <label htmlFor="stock-search" className="sr-only">Rechercher un produit</label>
                    <input id="stock-search" type="search" placeholder="Rechercher un produit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-black/20 text-white border-2 border-white/20 focus:border-amber-500 rounded-xl shadow-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-slate-400"/>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon className="w-6 h-6"/></div>
                </div>
                <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                     {categories.map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)} className={`relative px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap shadow-md border-2 ${filter === cat ? 'bg-amber-500 text-black border-amber-500 scale-105' : 'bg-[#2a2a2a] text-slate-300 hover:bg-[#3a3a3a] border-slate-700 hover:border-slate-600'}`}>
                            {cat === 'all' ? 'Tous' : (cat === 'low' ? 'Stock Bas' : cat)}
                            {cat === 'low' && lowStockCount > 0 && <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">{lowStockCount}</span>}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-400">Trier par:</span>
                        <button onClick={() => setSortBy('name')} className={`px-3 py-1 text-xs font-bold rounded-full ${sortBy === 'name' ? 'bg-amber-800/80 text-amber-200' : 'bg-white/10 text-slate-300'}`}>Nom</button>
                        <button onClick={() => setSortBy('stock')} className={`px-3 py-1 text-xs font-bold rounded-full ${sortBy === 'stock' ? 'bg-amber-800/80 text-amber-200' : 'bg-white/10 text-slate-300'}`}>Stock</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={generateStockPDF} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-slate-700 transition-transform font-display text-sm flex items-center gap-2">
                           <ArrowDownTrayIcon className="w-4 h-4" /> PDF
                        </button>
                        <button onClick={handleAddNew} className="bg-amber-500 text-black font-bold py-2 px-4 rounded-full shadow-lg hover:bg-amber-600 transition-transform font-display text-sm">
                            + Ajouter
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {filteredAndSortedProducts.map(p => {
                    const isLowStock = p.stock <= settings.lowStockThreshold && p.stock > 0;
                    const isOutOfStock = p.stock === 0;
                    const materialCost = p.purchasePrice || 0;
                    const laborCost = ((p.laborTimeMinutes || 0) / 60) * (settings.hourlyRate || 0);
                    const totalCost = materialCost + laborCost;
                    return (
                        <div key={p.id} className={`bg-[#2a2a2a] p-3 rounded-xl shadow-sm border-l-4 ${isOutOfStock ? 'border-red-600' : isLowStock ? 'border-amber-500' : 'border-slate-700'}`}>
                           <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <ProductImage image={p.image} alt={p.name} className="w-full h-full object-contain text-3xl"/>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-200">{p.name}</p>
                                    <p className={`text-xl font-sans font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-400' : 'text-slate-300'}`}>
                                        Stock: {p.stock}
                                    </p>
                                    <div className="mt-2 text-sm">
                                        <span className={`font-semibold ${p.price < totalCost ? 'text-red-400' : 'text-slate-300'}`}>Prix: {formatCurrency(p.price)}</span>
                                        <div className="text-slate-500 dark:text-slate-400 mt-1">Coût Matériel: {formatCurrency(materialCost)} | Coût Main d'œuvre: {formatCurrency(laborCost)}</div>
                                        {p.price < totalCost && <div className="mt-1 text-sm text-red-500 font-bold">Vente à perte !</div>}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <button onClick={() => setAddingStockTo(p)} aria-label={`Ajouter du stock pour ${p.name}`} className="px-3 py-1 text-xs font-bold bg-white/10 rounded-full hover:bg-white/20 transition-colors">Ajouter</button>
                                    <button onClick={() => handleEdit(p)} aria-label={`Modifier ${p.name}`} className="px-3 py-1 text-xs font-bold bg-white/10 rounded-full hover:bg-white/20 transition-colors">Modifier</button>
                                </div>
                           </div>
                           <div className="flex items-center justify-end space-x-4 mt-2">
                                <button onClick={() => setViewingHistoryOf(p)} aria-label={`Voir l'historique de ${p.name}`} className="text-xs text-slate-400 hover:text-amber-400 transition-colors">Historique</button>
                                <button onClick={() => setDeletingProduct(p)} aria-label={`Supprimer ${p.name}`} className="text-xs text-red-300 hover:text-red-200 transition-colors">Supprimer</button>
                           </div>
                        </div>
                    );
                })}
                 {filteredAndSortedProducts.length === 0 && (
                     <div className="text-center text-slate-500 p-8 bg-black/20 rounded-lg">
                        <p>Aucun produit ne correspond à vos filtres.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isFormOpen} onClose={closeForm} title={editingProduct?.id ? 'Modifier un Produit' : 'Ajouter un Produit'}>
                <ProductForm product={editingProduct ?? undefined} onDone={closeForm} />
            </Modal>
            <AddStockModal product={addingStockTo} onClose={() => setAddingStockTo(null)} />
            {viewingHistoryOf && (
                <StockHistoryModal 
                    isOpen={!!viewingHistoryOf}
                    onClose={() => setViewingHistoryOf(null)}
                    history={productHistory}
                    productName={viewingHistoryOf.name}
                />
            )}
            {deletingProduct && (
                 <ConfirmModal
                    isOpen={!!deletingProduct}
                    onClose={() => setDeletingProduct(null)}
                    onConfirm={handleConfirmDelete}
                    title="Supprimer le Produit"
                    message={<>Êtes-vous sûr de vouloir supprimer <strong>{deletingProduct.name}</strong> ? Cette action est irréversible.</>}
                    confirmText="Supprimer"
                />
            )}
        </div>
    );
};

export default memo(StockPage);

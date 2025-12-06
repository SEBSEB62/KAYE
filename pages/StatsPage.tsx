
import React, { memo, useState, useMemo, useCallback } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { useEventAnalytics, DateRange } from '../hooks/useEventAnalytics';
import { ProductMetrics, SubscriptionPlan, Page, SaleRecord } from '../types';
import ProductImage from '../components/ProductImage';
import { formatCurrency, formatPercentage } from '../utils/formatting';
import { ArrowTrendingUpIcon, ChartBarIcon, LockClosedIcon, WalletIcon, ArrowDownTrayIcon, TrashIcon } from '../components/Icons';
import jsPDF from 'jspdf';
import ConfirmModal from '../components/ConfirmModal';
import { generateAdvancedPDF } from '../utils/pdfGenerator';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from 'recharts';

interface StatsPageProps {
    setPage: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; subtext?: React.ReactNode }> = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="glass-panel p-4 rounded-2xl flex items-start space-x-4">
        <div className={`p-3 rounded-full bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/10 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{title}</p>
            <p className="text-xl font-bold font-sans text-slate-900 dark:text-white drop-shadow-sm">{value}</p>
            {subtext && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtext}</div>}
        </div>
    </div>
);

const ProductRank: React.FC<{ product: ProductMetrics, rank: number, metric: 'profit' | 'quantity' }> = ({ product, rank, metric }) => (
    <div className="flex items-center space-x-3 p-2 bg-white/40 dark:bg-black/30 rounded-lg border border-white/20 dark:border-white/5 shadow-sm">
        <div className="text-xl font-display text-blue-600 dark:text-blue-400 w-6 text-center flex-shrink-0 drop-shadow-sm">{rank}</div>
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-black/40 flex-shrink-0 border border-black/5 dark:border-white/10">
            <ProductImage image={product.image} alt={product.name} className="w-full h-full object-contain text-2xl"/>
        </div>
        <div className="flex-grow overflow-hidden">
            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{`CA: ${formatCurrency(product.revenue)}`}</p>
        </div>
        <div className="text-right flex-shrink-0 w-24">
            <p className={`font-bold text-lg ${metric === 'profit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-300'}`}>
                {metric === 'profit' ? `${formatCurrency(product.totalProfit)}` : `${product.unitsSold}`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
                {metric === 'profit' ? 'Profit' : 'Vendus'}
            </p>
        </div>
    </div>
);

const TopProductsList: React.FC<{ title: string; products: ProductMetrics[]; metric: 'profit' | 'quantity' }> = ({ title, products, metric }) => (
    <div className="glass-panel p-4 rounded-2xl">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 text-center">{title}</h3>
        <div className="space-y-2">
            {products.map((p, i) => (
                <ProductRank key={p.id} product={p} rank={i + 1} metric={metric} />
            ))}
            {products.length === 0 && (
                <div className="text-center text-slate-500 p-4 rounded-lg h-24 flex items-center justify-center">
                    <p>Aucun produit vendu.</p>
                </div>
            )}
        </div>
    </div>
);

const FeatureLock: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
    <div className="relative p-8 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-2xl mt-4 text-center overflow-hidden border border-blue-500/30 shadow-2xl">
        <div className="absolute inset-0 bg-grid-blue-500/10 [mask-image:linear-gradient(0deg,rgba(0,0,0,0),rgba(0,0,0,1))]"></div>
        <div className="relative z-10">
            <LockClosedIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto" />
            <h3 className="text-xl font-display text-blue-700 dark:text-blue-300 mt-2">Bienvenue dans l'espace exclusif Pro !</h3>
            <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-lg mx-auto">
                Cette section est réservée à nos membres Pro, vous offrant des outils et des données stratégiques pour propulser votre activité vers de nouveaux sommets.
            </p>
            <button
                onClick={onUpgrade}
                className="mt-6 bg-orange-500 text-black font-bold py-2 px-6 rounded-full shadow-lg hover:bg-orange-600 transition-colors font-display text-md"
            >
                Découvrir l'offre Pro
            </button>
        </div>
    </div>
);

type Period = '7d' | '30d' | 'all';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-lg border border-slate-200 dark:border-white/20 shadow-xl">
                <p className="font-bold text-blue-600 dark:text-blue-300">{`${label}`}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${formatCurrency(pld.value)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const NoDataView = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <ChartBarIcon className="w-12 h-12 mb-2 text-slate-400 dark:text-slate-600" />
        <p>Aucune donnée pour cette période.</p>
    </div>
);

const HistoryList: React.FC<{ sales: SaleRecord[]; onDelete: (sale: SaleRecord) => void }> = ({ sales, onDelete }) => {
    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
    
    if (sales.length === 0) return <p className="text-center text-slate-500 py-4">Aucune vente récente.</p>;

    return (
        <div className="space-y-2">
            {sales.map(sale => {
                const cogs = sale.items.reduce((sum, i) => sum + ((i.purchasePrice || 0) * i.quantity), 0);
                const paypalFeeForSale = sale.paymentMethod === 'paypal' ? (sale.total * 0.029) + 0.35 : 0;
                const sumupFeeForSale = sale.paymentMethod === 'card' ? sale.total * 0.0175 : 0;
                const totalFees = paypalFeeForSale + sumupFeeForSale;
                const grossProfit = sale.total - cogs;
                const netProfit = grossProfit - totalFees;
                const marginPercentage = sale.total > 0 ? ((grossProfit / sale.total) * 100) : 0;
                
                const isExpanded = expandedSaleId === sale.id;

                return (
                    <div key={sale.id}>
                        <div 
                            className="glass-panel p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/40 dark:hover:bg-black/40 transition-colors"
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                        >
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{formatCurrency(sale.total)}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize font-semibold">
                                        {sale.paymentMethod}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${netProfit >= 0 ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                                        Profit: {formatCurrency(netProfit)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {new Date(sale.date).toLocaleString('fr-FR')} {sale.customerName ? `• ${sale.customerName}` : ''}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[300px] mt-0.5">
                                    {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(sale);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                    title="Annuler cette vente"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                                <span className="text-xl text-slate-400">
                                    {isExpanded ? '▼' : '▶'}
                                </span>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="glass-panel p-4 rounded-xl mt-2 ml-2 mr-2 border border-slate-300 dark:border-slate-600 bg-blue-50/30 dark:bg-blue-950/20">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Marge Brute</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(grossProfit)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">({formatPercentage(marginPercentage)})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Frais</p>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">-{formatCurrency(totalFees)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {sale.paymentMethod === 'paypal' && `PayPal: ${formatCurrency(paypalFeeForSale)}`}
                                            {sale.paymentMethod === 'card' && `Sumup: ${formatCurrency(sumupFeeForSale)}`}
                                            {!['paypal', 'card'].includes(sale.paymentMethod) && 'Sans frais'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Profit Net</p>
                                        <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formatCurrency(netProfit)}
                                        </p>
                                    </div>
                                    {sale.items.length > 0 && (
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Coût Marchandises</p>
                                            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{formatCurrency(cogs)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Durée Transaction</p>
                                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">instant</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-2">Détail Articles</p>
                                    <div className="space-y-1">
                                        {sale.items.map((item, idx) => {
                                            const itemCogs = (item.purchasePrice || 0) * item.quantity;
                                            const itemGrossProfit = (item.price * item.quantity) - itemCogs;
                                            return (
                                                <div key={idx} className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded flex justify-between">
                                                    <span className="font-semibold">{item.quantity}x {item.name}</span>
                                                    <span>{formatCurrency(item.price * item.quantity)} (Profit: {formatCurrency(itemGrossProfit)})</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const StatsPage: React.FC<StatsPageProps> = ({ setPage }) => {
    const { sales, donations, manualRefunds, safeDeposits, products, settings, subscriptionPlan, cashOuts, showToast, deleteSale } = useBuvette();
    const [period, setPeriod] = useState<Period>('7d');
    const [topProductsCategory, setTopProductsCategory] = useState<string>('all');
    const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);

    const dateRange: DateRange | null = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        switch (period) {
            case '7d':
                start.setDate(end.getDate() - 6);
                return { start, end };
            case '30d':
                start.setDate(end.getDate() - 29);
                return { start, end };
            case 'all':
            default:
                return null;
        }
    }, [period]);
    
    const analytics = useEventAnalytics(sales, donations, manualRefunds, safeDeposits, cashOuts, products, settings, dateRange);
    const isPro = subscriptionPlan === SubscriptionPlan.PRO;
    const isStandardOrPro = subscriptionPlan === SubscriptionPlan.STANDARD || subscriptionPlan === SubscriptionPlan.PRO;

    const filteredTopProductsByProfit = useMemo(() => {
        const source = analytics.topProductsByProfit;
        if (topProductsCategory === 'all') {
            return source.slice(0, 5);
        }
        return source.filter(p => p.category === topProductsCategory).slice(0, 5);
    }, [analytics.topProductsByProfit, topProductsCategory]);

    const filteredTopProductsByQuantity = useMemo(() => {
        const source = analytics.topProductsByQuantity;
        if (topProductsCategory === 'all') {
            return source.slice(0, 5);
        }
        return source.filter(p => p.category === topProductsCategory).slice(0, 5);
    }, [analytics.topProductsByQuantity, topProductsCategory]);

    const categoriesForFilter: string[] = ['all', ...settings.categories];

    // Derived values (guarded with useMemo to avoid referencing analytics fields before ready)
    const { totalEncaissements, netRevenueAfterFees, estimatedFees, beneficeNet } = useMemo(() => {
        if (!analytics) {
            return {
                totalEncaissements: 0,
                netRevenueAfterFees: 0,
                estimatedFees: 0,
                beneficeNet: 0,
            };
        }

        return {
            totalEncaissements: analytics.totalEncaissements ?? 0,
            netRevenueAfterFees: analytics.netRevenueAfterFees ?? 0,
            estimatedFees: analytics.estimatedFees ?? 0,
            beneficeNet: analytics.beneficeNet ?? 0,
        };
    }, [analytics]);

    const handleUpgrade = () => setPage(Page.Upgrade);
    
    const confirmDeleteSale = () => {
        if (saleToDelete) {
            deleteSale(saleToDelete.id);
            setSaleToDelete(null);
        }
    };

    const generateFinancialReportPDF = useCallback(async () => {
        if (!isStandardOrPro) {
            showToast("Fonctionnalité réservée aux plans Standard et Pro.", "error");
            return;
        }
        try {
            const doc = new jsPDF();
            
            // Préparer les données pour le PDF
            const pdfAnalytics = {
                ...analytics,
                paymentStats: {
                    cash: analytics.cashSales,
                    card: analytics.cardSales,
                    token: 0,
                    check: analytics.checkSales,
                    paypal: analytics.paypalSales,
                    wero: analytics.weroSales,
                }
            };

            await generateAdvancedPDF(doc, pdfAnalytics, settings, period, isPro, isStandardOrPro);

            const dateStr = new Date().toISOString().slice(0, 10);
            doc.save(`rapport-kaye-${dateStr}.pdf`);
            showToast("Rapport généré avec succès ! 📊");
        } catch (error) {
            console.error("PDF generation failed:", error);
            showToast("Erreur lors de la génération du rapport.", "error");
        }
    }, [analytics, settings, subscriptionPlan, period, isPro, isStandardOrPro, showToast]);

    if (sales.length === 0 && donations.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-7xl">📊</div>
                <h1 className="text-3xl font-display text-slate-800 dark:text-slate-200 mt-4">Pas encore de données</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Effectuez votre première vente pour voir les statistiques apparaître ici.</p>
            </div>
        )
    }

    const dateTickFormatter = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const currencyTickFormatter = (value: number) => `${value}€`;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-display text-blue-500 dark:text-blue-400 drop-shadow-md">Statistiques</h1>
                {isStandardOrPro && (
                  <button
                      onClick={generateFinancialReportPDF}
                      className="flex items-center gap-2 bg-white/30 dark:bg-slate-600/80 backdrop-blur-sm text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-full shadow-lg hover:bg-white/50 dark:hover:bg-slate-700 transition-colors font-display text-sm border border-slate-300 dark:border-white/10"
                  >
                      <ArrowDownTrayIcon className="w-5 h-5"/>
                      PDF
                  </button>
                )}
            </div>


            <div className="flex justify-center items-center bg-white/30 dark:bg-black/40 backdrop-blur-md p-2 rounded-full space-x-2 border border-white/20 dark:border-white/10 max-w-sm mx-auto">
                {(['7d', '30d', 'all'] as Period[]).map(p => (
                    <button 
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 w-full
                        ${period === p ? 'bg-orange-500 text-black shadow-md' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/10'}`}
                    >
                        {p === '7d' ? '7 Jours' : p === '30d' ? '30 Jours' : 'Tout'}
                    </button>
                ))}
            </div>

            <section>
                 <h2 className="text-2xl font-display text-slate-800 dark:text-slate-200 mb-4 px-2">Trésorerie Réelle</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard 
                        title="Total Encaissé" 
                        value={formatCurrency(totalEncaissements)} 
                        icon={ArrowTrendingUpIcon} 
                        color="text-emerald-600 dark:text-emerald-400" 
                    />
                    <StatCard 
                        title="Net en Banque (Est.)" 
                        value={formatCurrency(netRevenueAfterFees)} 
                        icon={WalletIcon} 
                        color="text-blue-600 dark:text-blue-400" 
                        subtext={<span className="text-red-500 dark:text-red-300">Dont frais bancaires (1.75%): -{formatCurrency(estimatedFees)}</span>}
                    />
                    {isPro && (
                        <StatCard title="Bénéfice Net" value={formatCurrency(beneficeNet)} icon={WalletIcon} color="text-amber-500 dark:text-amber-400" />
                    )}
                 </div>
            </section>

             {isPro ? (
                 <>
                    <section>
                         <h2 className="text-2xl font-display text-slate-800 dark:text-slate-200 mb-4 px-2">Tendance des Ventes</h2>
                         <div className="glass-panel p-4 rounded-2xl h-80">
                            {analytics.chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                     <LineChart data={analytics.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.3} />
                                        <XAxis dataKey="date" tickFormatter={dateTickFormatter} stroke="#64748b" fontSize={12} />
                                        <YAxis tickFormatter={currencyTickFormatter} stroke="#64748b" fontSize={12} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" name="Ventes" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                             ) : (
                                <NoDataView />
                            )}
                         </div>
                    </section>

                    <section>
                         <h2 className="text-2xl font-display text-slate-800 dark:text-slate-200 mb-4 px-2">Ventes par Catégorie</h2>
                         <div className="glass-panel p-4 rounded-2xl h-80">
                            {analytics.salesByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.salesByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.3} />
                                        <XAxis type="number" tickFormatter={currencyTickFormatter} stroke="#64748b" fontSize={12} />
                                        <YAxis type="category" dataKey="name" width={80} stroke="#64748b" fontSize={12} tick={{ textAnchor: 'end' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }}/>
                                        <Legend />
                                        <Bar dataKey="revenue" name="Revenu" fill="#f97316" barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <NoDataView />
                            )}
                         </div>
                    </section>

                    <section>
                         <h2 className="text-2xl font-display text-slate-800 dark:text-slate-200 mb-4 px-2">Classement des Produits</h2>
                         <div className="flex space-x-3 overflow-x-auto pb-2 mb-4 no-scrollbar px-2">
                            {categoriesForFilter.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setTopProductsCategory(category)}
                                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap shadow-md border
                                        ${topProductsCategory === category
                                            ? 'bg-orange-500 text-black border-orange-500 scale-105'
                                            : 'bg-white/40 dark:bg-black/30 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 border-white/20'
                                        }`
                                    }
                                >
                                    {category === 'all' ? 'Toutes' : category}
                                </button>
                            ))}
                         </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TopProductsList title="Top 5 par Profit" products={filteredTopProductsByProfit} metric="profit" />
                            <TopProductsList title="Top 5 par Quantité" products={filteredTopProductsByQuantity} metric="quantity" />
                         </div>
                    </section>
                </>
             ) : (
                <FeatureLock onUpgrade={handleUpgrade} />
             )}
             
             <section className="pt-8">
                <h2 className="text-2xl font-display text-slate-800 dark:text-slate-200 mb-4 px-2">Historique des Transactions</h2>
                <div className="max-h-96 overflow-y-auto pr-2">
                    <HistoryList sales={analytics.validSales} onDelete={setSaleToDelete} />
                </div>
             </section>
             
             <ConfirmModal
                isOpen={!!saleToDelete}
                onClose={() => setSaleToDelete(null)}
                onConfirm={confirmDeleteSale}
                title="Annuler la Vente"
                message={<>Attention, vous allez supprimer définitivement cette vente de <strong>{saleToDelete ? formatCurrency(saleToDelete.total) : ''}</strong>.<br/><br/>Le stock des produits sera automatiquement remis à jour.</>}
                confirmText="Supprimer & Restaurer Stock"
             />
        </div>
    );
};

export default memo(StatsPage);

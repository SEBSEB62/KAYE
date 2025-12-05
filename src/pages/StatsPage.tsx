
import React, { memo, useState, useMemo, useCallback } from 'react';
import { useBuvette } from '../../hooks/useBuvette';
import { useEventAnalytics, DateRange } from '../../hooks/useEventAnalytics';
import { ProductMetrics, SubscriptionPlan, Page, SaleRecord } from '../../types';
import ProductImage from '../../components/ProductImage';
import { ArrowTrendingUpIcon, ChartBarIcon, LockClosedIcon, WalletIcon, ArrowDownTrayIcon, TrashIcon } from '../../components/Icons';
import jsPDF from 'jspdf';
import ConfirmModal from '../../components/ConfirmModal';
import autoTable from 'jspdf-autotable';
import { blobToDataURL } from '../../utils/image';
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
            <p className="text-sm text-slate-500 dark:text-slate-400">{`CA: ${product.revenue.toFixed(2)}€`}</p>
        </div>
        <div className="text-right flex-shrink-0 w-24">
            <p className={`font-bold text-lg ${metric === 'profit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-300'}`}>
                {metric === 'profit' ? `${product.totalProfit.toFixed(2)}€` : `${product.unitsSold}`}
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

const HistoryList: React.FC<{ sales: SaleRecord[]; onDelete: (sale: SaleRecord) => void }> = ({ sales, onDelete }) => {
    if (sales.length === 0) return <p className="text-center text-slate-500 py-4">Aucune vente récente.</p>;

    return (
        <div className="space-y-3">
            {sales.map(sale => (
                <div key={sale.id} className="glass-panel p-3 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{sale.total.toFixed(2)}€</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                                {sale.paymentMethod}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(sale.date).toLocaleString('fr-FR')} {sale.customerName ? `• ${sale.customerName}` : ''}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                    </div>
                    <button 
                        onClick={() => onDelete(sale)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                        title="Annuler cette vente"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};

type Period = '7d' | '30d' | 'all';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-lg border border-slate-200 dark:border-white/20 shadow-xl">
                <p className="font-bold text-blue-600 dark:text-blue-300">{`${label}`}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value.toFixed(2)}€`}
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

    const handleUpgrade = () => setPage(Page.Upgrade);
    
    const confirmDeleteSale = () => {
        if (saleToDelete) {
            deleteSale(saleToDelete.id);
            setSaleToDelete(null);
        }
    };

    const generateFinancialReportPDF = useCallback(async () => {
        if (!isPro) {
            showToast("Fonctionnalité réservée au plan Pro.", "error");
            return;
        }
        try {
            const doc = new jsPDF();
            const { businessName, businessLogo } = settings;
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let yPos = 20;

            // --- DESIGN COLORS & FONTS ---
            const colMidnight: [number, number, number] = [23, 37, 84]; // #172554
            const colEmerald: [number, number, number] = [5, 150, 105]; // #059669
            const colRed: [number, number, number] = [220, 38, 38];      // #dc2626
            const colBlue: [number, number, number] = [37, 99, 235];      // #2563eb
            const colGrayHeader: [number, number, number] = [241, 245, 249]; // #f1f5f9
            const colTextTitle: [number, number, number] = [17, 24, 39];  // #111827
            const colTextBody: [number, number, number] = [55, 65, 81];   // #374151

            // --- 1. EN-TÊTE ---
            if (businessLogo) {
                try {
                    let logoDataUrl = '';
                    if (businessLogo instanceof Blob) logoDataUrl = await blobToDataURL(businessLogo);
                    else if (typeof businessLogo === 'string' && businessLogo.startsWith('data:')) logoDataUrl = businessLogo;
                    
                    if (logoDataUrl) {
                        const img = new Image();
                        img.src = logoDataUrl;
                        await new Promise(r => { img.onload = r; img.onerror = r; });
                        const ratio = img.width / img.height;
                        let w = 35; let h = w / ratio;
                        if (h > 25) { h = 25; w = h * ratio; }
                        doc.addImage(logoDataUrl, 'PNG', margin, 15, w, h);
                    }
                } catch (e) { console.warn("Logo PDF error", e); }
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(colMidnight[0], colMidnight[1], colMidnight[2]);
            doc.text("RAPPORT D'ACTIVITÉ", pageWidth - margin, 25, { align: 'right' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(businessName || 'KAYÉ', pageWidth - margin, 32, { align: 'right' });
            const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const periodStr = period === '7d' ? '7 derniers jours' : period === '30d' ? '30 derniers jours' : 'Global';
            doc.text(`Période : ${periodStr} | Édité le : ${dateStr}`, pageWidth - margin, 37, { align: 'right' });

            yPos = 55;

            // --- 2. KPIs VISUELS ---
            const boxWidth = (pageWidth - (margin * 2) - 15) / 4;
            const boxHeight = 25;
            
            const drawKPI = (x: number, title: string, value: string, color: number[]) => {
                doc.setFillColor(color[0], color[1], color[2]);
                doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
                doc.setTextColor(255);
                doc.setFontSize(8); doc.setFont('helvetica', 'bold');
                doc.text(title.toUpperCase(), x + 5, yPos + 8);
                doc.setFontSize(16);
                doc.text(value, x + 5, yPos + 20);
            };

            const caGlobal = analytics.totalRevenue + analytics.totalDonations;
            const nombreDeVentes = analytics.validSales.length;
            const panierMoyen = nombreDeVentes > 0 ? caGlobal / nombreDeVentes : 0;
            const beneficeNet = analytics.beneficeNet;

            drawKPI(margin, "Bénéfice Net", `${beneficeNet.toFixed(2)} €`, colEmerald);
            drawKPI(margin + boxWidth + 5, "C.A. Total", `${caGlobal.toFixed(2)} €`, colBlue);
            drawKPI(margin + (boxWidth * 2) + 10, "Nb. Ventes", `${nombreDeVentes}`, colMidnight);
            drawKPI(margin + (boxWidth * 3) + 15, "Panier Moyen", `${panierMoyen.toFixed(2)} €`, [107, 114, 128]);

            yPos += boxHeight + 15;

            // --- 3. TABLEAU : RENTABILITÉ PAR MOYEN DE PAIEMENT ---
            doc.setFontSize(14); doc.setTextColor(colTextTitle[0], colTextTitle[1], colTextTitle[2]);
            doc.text("Analyse par Moyen de Paiement", margin, yPos);
            yPos += 5;

            const paypalSalesCount = analytics.validSales.filter(s => s.paymentMethod === 'paypal').length;
            const paypalFees = analytics.paypalSales > 0 ? (analytics.paypalSales * 0.029) + (paypalSalesCount * 0.35) : 0;
            const sumupFees = (analytics.cardSales + analytics.cardDonations) * 0.0175;
            
            const methodRows = [
                { name: 'Espèces', total: analytics.cashSales, count: analytics.validSales.filter(s => s.paymentMethod === 'cash').length, fee: 0 },
                { name: 'Carte (SumUp)', total: analytics.cardSales, count: analytics.validSales.filter(s => s.paymentMethod === 'card').length, fee: sumupFees },
                { name: 'PayPal', total: analytics.paypalSales, count: paypalSalesCount, fee: paypalFees },
                { name: 'Chèque', total: analytics.checkSales, count: analytics.validSales.filter(s => s.paymentMethod === 'check').length, fee: 0 },
                { name: 'Wero', total: analytics.weroSales, count: analytics.validSales.filter(s => s.paymentMethod === 'wero').length, fee: 0 },
            ].filter(m => m.count > 0);

            autoTable(doc, {
                startY: yPos,
                head: [['Moyen', 'Nb Ventes', 'Total Encaissé', 'Frais Estimés', 'Net Perçu']],
                body: methodRows.map(m => [m.name, m.count.toString(), `${m.total.toFixed(2)} €`, m.fee > 0 ? `-${m.fee.toFixed(2)} €` : '-', `${(m.total - m.fee).toFixed(2)} €`]),
                theme: 'grid',
                headStyles: { fillColor: colMidnight, textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'right' }, 3: { halign: 'right', textColor: colRed }, 4: { halign: 'right', textColor: colEmerald, fontStyle: 'bold' } },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
            
            // --- 4. TABLEAUX CÔTE À CÔTE : DONS ET COÛTS ---
            const donsBody = [
                ['Dons reçus', `${analytics.totalDonations.toFixed(2)} €`],
                ['Nombre de dons', donations.filter(d => dateRange ? new Date(d.date) >= dateRange.start && new Date(d.date) <= dateRange.end : true).length.toString()]
            ];
            const coutsBody = [
                ['Coût des marchandises', `-${analytics.totalCostOfGoods.toFixed(2)} €`],
                ['Frais SumUp (Carte)', `-${sumupFees.toFixed(2)} €`],
                ['Frais PayPal', `-${paypalFees.toFixed(2)} €`],
                ['Remboursements', `-${analytics.totalRemboursements.toFixed(2)} €`],
                ['Sorties de caisse', `-${analytics.totalCashOuts.toFixed(2)} €`],
            ];
            
            doc.setFontSize(14); doc.setTextColor(colTextTitle[0], colTextTitle[1], colTextTitle[2]);
            doc.text("Résumé des Dons", margin, yPos);
            autoTable(doc, { startY: yPos + 5, head: [['Poste', 'Montant']], body: donsBody, theme: 'grid', headStyles: { fillColor: colEmerald as any } });
            
            doc.setFontSize(14); doc.setTextColor(colTextTitle[0], colTextTitle[1], colTextTitle[2]);
            doc.text("Détail des Frais & Coûts", margin + pageWidth / 2 - 10, yPos);
            autoTable(doc, { startY: yPos + 5, head: [['Poste', 'Montant']], body: coutsBody, theme: 'grid', headStyles: { fillColor: colRed as any }, margin: { left: margin + pageWidth / 2 - 10 } });

            yPos = (doc as any).lastAutoTable.finalY + 15;

            // --- 5. JOURNAL DES VENTES ---
            if (yPos > 240) { doc.addPage(); yPos = 20; }
            doc.setFontSize(14); doc.setTextColor(colTextTitle[0], colTextTitle[1], colTextTitle[2]);
            doc.text("Journal des Ventes", margin, yPos);
            yPos += 5;

            const salesLog = analytics.validSales.slice(0, 100).map(sale => {
                const time = new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const summary = sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 30) + (sale.items.length > 1 ? '...' : '');
                let fee = 0;
                if (sale.paymentMethod === 'card') fee = sale.total * 0.0175;
                if (sale.paymentMethod === 'paypal' && sale.total > 0) fee = (sale.total * 0.029) + 0.35;
                const cogs = sale.items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0);
                const profit = sale.total - fee - cogs;

                return [time, summary, sale.paymentMethod.toUpperCase(), `${sale.total.toFixed(2)} €`, fee > 0 ? `-${fee.toFixed(2)}` : '-', `${profit.toFixed(2)} €`];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Heure', 'Produits', 'Mode', 'Total', 'Frais', 'Bénéfice']],
                body: salesLog,
                theme: 'striped',
                headStyles: { fillColor: colGrayHeader as any, textColor: colTextTitle as any, fontStyle: 'bold' },
                bodyStyles: { textColor: colTextBody as any, fontSize: 9 },
                columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right', textColor: colRed as any }, 5: { halign: 'right', textColor: colEmerald as any, fontStyle: 'bold' } },
            });
            
            // PIED DE PAGE
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Rapport KAYÉ | Page ${i}/${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
            }

            doc.save(`Rapport_Kayé_V3_${new Date().toISOString().slice(0, 10)}.pdf`);
            showToast("Rapport V3 généré avec succès !");

        } catch (error) {
            console.error("PDF generation failed:", error);
            showToast("Erreur lors de la génération du rapport PDF.", "error");
        }
    }, [analytics, settings, subscriptionPlan, period, isPro, showToast]);

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
                {isPro && (
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
                        value={`${analytics.totalEncaissements.toFixed(2)}€`} 
                        icon={ArrowTrendingUpIcon} 
                        color="text-emerald-600 dark:text-emerald-400" 
                    />
                    <StatCard 
                        title="Net en Banque (Est.)" 
                        value={`${analytics.netRevenueAfterFees.toFixed(2)}€`} 
                        icon={WalletIcon} 
                        color="text-blue-600 dark:text-blue-400" 
                        subtext={<span className="text-red-500 dark:text-red-300">Dont frais bancaires: -{analytics.estimatedFees.toFixed(2)}€</span>}
                    />
                    {isPro && (
                        <StatCard title="Bénéfice Net" value={`${analytics.beneficeNet.toFixed(2)}€`} icon={WalletIcon} color="text-amber-500 dark:text-amber-400" />
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
                message={<>Attention, vous allez supprimer définitivement cette vente de <strong>{saleToDelete?.total.toFixed(2)}€</strong>.<br/><br/>Le stock des produits sera automatiquement remis à jour.</>}
                confirmText="Supprimer & Restaurer Stock"
             />
        </div>
    );
};

export default memo(StatsPage);

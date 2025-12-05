# 💻 Exemples de Code - Améliorations PDF & Historique

## 1. Utilisation du Nouveau Générateur PDF

```typescript
// Dans StatsPage.tsx
import { generateAdvancedPDF } from '../utils/pdfGenerator';

const generateFinancialReportPDF = useCallback(async () => {
    if (!isStandardOrPro) {
        showToast("Fonctionnalité réservée aux plans Standard et Pro.", "error");
        return;
    }
    try {
        const doc = new jsPDF();
        
        // Préparer les données
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

        // Générer le PDF
        await generateAdvancedPDF(doc, pdfAnalytics, settings, period, isPro, isStandardOrPro);

        // Télécharger
        const dateStr = new Date().toISOString().slice(0, 10);
        doc.save(`rapport-kaye-${dateStr}.pdf`);
        showToast("Rapport généré avec succès ! 📊");
    } catch (error) {
        console.error("PDF generation failed:", error);
        showToast("Erreur lors de la génération du rapport.", "error");
    }
}, [analytics, settings, subscriptionPlan, period, isPro, isStandardOrPro, showToast]);
```

---

## 2. Structure HistoryList Expandable

```typescript
const HistoryList: React.FC<{ 
    sales: SaleRecord[]; 
    onDelete: (sale: SaleRecord) => void; 
    products: ProductMetrics[] 
}> = ({ sales, onDelete, products }) => {
    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
    
    return sales.map(sale => {
        const cogs = sale.items.reduce((sum, i) => 
            sum + ((i.purchasePrice || 0) * i.quantity), 0
        );
        const paypalFeeForSale = sale.paymentMethod === 'paypal' 
            ? (sale.total * 0.029) + 0.35 
            : 0;
        const sumupFeeForSale = sale.paymentMethod === 'card' 
            ? sale.total * 0.0175 
            : 0;
        const totalFees = paypalFeeForSale + sumupFeeForSale;
        const grossProfit = sale.total - cogs;
        const netProfit = grossProfit - totalFees;
        const marginPercentage = sale.total > 0 
            ? ((grossProfit / sale.total) * 100) 
            : 0;
        
        const isExpanded = expandedSaleId === sale.id;

        return (
            <div key={sale.id}>
                {/* Vue Compacte */}
                <div 
                    className="glass-panel p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/40 dark:hover:bg-black/40 transition-colors"
                    onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                >
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                                {sale.total.toFixed(2)}€
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize font-semibold">
                                {sale.paymentMethod}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                netProfit >= 0 
                                    ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                                    : 'bg-red-500/20 text-red-700 dark:text-red-300'
                            }`}>
                                Profit: {netProfit.toFixed(2)}€
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(sale.date).toLocaleString('fr-FR')} 
                            {sale.customerName ? ` • ${sale.customerName}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(sale);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <span className="text-xl text-slate-400">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    </div>
                </div>

                {/* Vue Détaillée (Expandable) */}
                {isExpanded && (
                    <div className="glass-panel p-4 rounded-xl mt-2 ml-2 mr-2 border border-slate-300 dark:border-slate-600 bg-blue-50/30 dark:bg-blue-950/20">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                                    Marge Brute
                                </p>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {grossProfit.toFixed(2)}€
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    ({marginPercentage.toFixed(1)}%)
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                                    Frais
                                </p>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                    -{totalFees.toFixed(2)}€
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {sale.paymentMethod === 'paypal' && `PayPal: ${paypalFeeForSale.toFixed(2)}€`}
                                    {sale.paymentMethod === 'card' && `Sumup: ${sumupFeeForSale.toFixed(2)}€`}
                                    {!['paypal', 'card'].includes(sale.paymentMethod) && 'Sans frais'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                                    Profit Net
                                </p>
                                <p className={`text-lg font-bold ${
                                    netProfit >= 0 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {netProfit.toFixed(2)}€
                                </p>
                            </div>
                        </div>
                        
                        {/* Détail Articles */}
                        <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-2">
                                Détail Articles
                            </p>
                            <div className="space-y-1">
                                {sale.items.map((item, idx) => {
                                    const itemCogs = (item.purchasePrice || 0) * item.quantity;
                                    const itemGrossProfit = (item.price * item.quantity) - itemCogs;
                                    return (
                                        <div key={idx} className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded flex justify-between">
                                            <span className="font-semibold">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span>
                                                {(item.price * item.quantity).toFixed(2)}€ 
                                                (Profit: {itemGrossProfit.toFixed(2)}€)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    });
};
```

---

## 3. Palette de Couleurs TypeScript

```typescript
// Dans pdfGenerator.ts
const colors: Record<string, [number, number, number]> = {
    primary: [37, 99, 235],      // Bleu - Headers principaux
    success: [16, 185, 129],     // Vert - Ventes, Profits
    warning: [249, 115, 22],     // Orange - Avertissements
    danger: [239, 68, 68],       // Rouge - Frais, Pertes
    purple: [147, 51, 234],      // Violet - Complémentaire
    pink: [236, 72, 153],        // Rose - Accents
    cyan: [6, 182, 212],         // Cyan - Historique
    gray: [107, 114, 128],       // Gris - Texte secondaire
};

// Utilisation
doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
doc.rect(x, y, width, height, 'F');
```

---

## 4. Calculs Financiers

```typescript
// Coût des marchandises (COGS)
const cogs = sale.items.reduce((sum, i) => 
    sum + ((i.purchasePrice || 0) * i.quantity), 
    0
);

// Frais PayPal (2.9% + 0.35€ par transaction)
const paypalFeeForSale = sale.paymentMethod === 'paypal' 
    ? (sale.total * 0.029) + 0.35 
    : 0;

// Frais Sumup/Carte (1.75%)
const sumupFeeForSale = sale.paymentMethod === 'card' 
    ? sale.total * 0.0175 
    : 0;

// Total frais
const totalFees = paypalFeeForSale + sumupFeeForSale;

// Marge brute (avant frais)
const grossProfit = sale.total - cogs;

// Profit net (après frais)
const netProfit = grossProfit - totalFees;

// Pourcentage de marge
const marginPercentage = sale.total > 0 
    ? ((grossProfit / sale.total) * 100) 
    : 0;
```

---

## 5. Structure PDF Multi-page

```typescript
// Page 1
- KPI Cards (4 métriques)
- Résumé Financier Détaillé
- Répartition Modes de Paiement
- Analyse Frais (Pro only)

// Page 2 (Standard+)
- Top 5 Produits par Quantité
- Top 5 Produits par Profit (Pro only)
- Ventes par Catégorie
- Historique 50 dernières ventes

// Footer (Toutes pages)
- Pagination (Page X sur Y)
- Date du rapport
- Signature "KAYÉ"
```

---

## 6. Restrictions Plans (Conditions)

```typescript
// Essentiel
if (!isStandardOrPro) {
    showToast("Fonctionnalité réservée aux plans Standard et Pro.", "error");
    return;
}

// Standard vs Pro
const isPro = subscriptionPlan === SubscriptionPlan.PRO;
const isStandardOrPro = subscriptionPlan === SubscriptionPlan.STANDARD || subscriptionPlan === SubscriptionPlan.PRO;

// Dans PDF
if (isPro) {
    // Ajouter : Profit par produit, Frais détaillés, etc.
    summaryBody.push(
        ["Bénéfice Net", `${analytics.beneficeNet.toFixed(2)}€`],
        ["Coût des Marchandises", `${analytics.totalCostOfGoods.toFixed(2)}€`],
        // ...
    );
}
```

---

## 7. Appel dans StatsPage

```typescript
// Importer
import { generateAdvancedPDF } from '../utils/pdfGenerator';

// Dans le JSX
<button
    onClick={generateFinancialReportPDF}
    className="flex items-center gap-2 bg-white/30 dark:bg-slate-600/80 backdrop-blur-sm text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-full shadow-lg hover:bg-white/50 dark:hover:bg-slate-700 transition-colors font-display text-sm border border-slate-300 dark:border-white/10"
>
    <ArrowDownTrayIcon className="w-5 h-5"/>
    PDF
</button>

// Appeler HistoryList
<HistoryList 
    sales={analytics.validSales} 
    onDelete={setSaleToDelete} 
    products={analytics.topProductsByQuantity as ProductMetrics[]} 
/>
```

---

## 8. Interfaces TypeScript

```typescript
// PDFAnalytics interface
interface PDFAnalytics {
    totalRevenue: number;
    totalDonations: number;
    estimatedFees: number;
    netRevenueAfterFees: number;
    beneficeNet: number;
    totalCostOfGoods: number;
    grossProfit: number;
    cashSales: number;
    cardSales: number;
    checkSales: number;
    paypalSales: number;
    weroSales: number;
    totalRemboursements: number;
    totalCashOuts: number;
    caisseFinaleEspeces: number;
    totalEncaissements: number;
    validSales: SaleRecord[];
    topProductsByQuantity: (Product & { unitsSold: number; revenue: number; totalProfit: number })[];
    topProductsByProfit: (Product & { unitsSold: number; revenue: number; totalProfit: number })[];
    salesByCategory: Array<{ name: string; revenue: number; count: number }>;
    chartData: Array<{ date: string; total: number }>;
    paymentStats: PDFPaymentStats;
}

interface PDFPaymentStats {
    cash: number;
    card: number;
    token: number;
    check: number;
    paypal: number;
    wero: number;
}
```

---

## ✨ Points Clés d'Implémentation

1. **Typage strict** : `[number, number, number]` pour les couleurs jsPDF
2. **Calculs détaillés** : COGS, Frais par méthode, Profit net
3. **Responsive** : Grilles adaptables (mobile/desktop)
4. **Expandable UI** : Click pour afficher/cacher détails
5. **Multi-page PDF** : Automatic page break et footer
6. **Couleurs professionnelles** : Palette cohérente et accessible
7. **Plans respectés** : Standard vs Pro features

---

**Version**: 1.0.0  
**Prêt pour**: Production  
**Tests**: ✅ Compilation OK, pas d'erreurs

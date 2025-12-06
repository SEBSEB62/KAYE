
import React, { useMemo } from 'react';
import { useBuvette } from '../hooks/useBuvette';
import { useEventAnalytics } from '../hooks/useEventAnalytics';
import { Page, Product } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatting';
import { ArrowTrendingUpIcon, ReceiptPercentIcon, WalletIcon } from '../components/Icons';
import ProductImage from '../components/ProductImage';

// Simple inline loading placeholder used when initial data isn't ready
const Loading: React.FC = () => (
    <div className="flex items-center justify-center h-full">
        <div className="text-center">
            <div className="text-3xl">Chargement…</div>
        </div>
    </div>
);

// Helpers extracted outside the component (pure functions)
function computeTodayStats(sales: any[], products: Product[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = (sales || []).filter(sale => new Date(sale.date) >= today && !sale.refunded);
    const revenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    let topProduct: (Product & { unitsSold: number }) | null = null;
    if (todaySales.length > 0) {
        const productCounts = todaySales
            .flatMap(s => s.items || [])
            .reduce((acc: Record<string, number>, item: any) => {
                acc[item.id] = (acc[item.id] || 0) + (item.quantity || 0);
                return acc;
            }, {} as Record<string, number>);

        const topProductId = Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b, '');
        const topProductDetails = (products || []).find(p => p.id === topProductId);
        if (topProductDetails) topProduct = { ...topProductDetails, unitsSold: productCounts[topProductId] };
    }

    return {
        revenue,
        salesCount: todaySales.length,
        topProduct,
    };
}

function computeUrssafCharge(totalRevenue: number, rate: number) {
    const total = totalRevenue || 0;
    const r = rate || 0;
    return total * (r / 100);
}

interface HomePageProps {
  setPage: (page: Page) => void;
}

const StatCard: React.FC<{
    icon: React.ElementType,
    title: string,
    value: React.ReactNode,
    color: string,
    subValue?: React.ReactNode
}> = ({ icon: Icon, title, value, color, subValue }) => (
    <div className="glass-panel p-4 rounded-2xl flex items-start space-x-4 transition-all hover:scale-[1.02]">
        <div className={`p-3 rounded-full bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/10 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{title}</p>
            <p className="text-2xl font-bold font-sans text-slate-900 dark:text-white drop-shadow-sm">{value}</p>
            {subValue && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subValue}</div>}
        </div>
    </div>
);

const TopProductCard: React.FC<{ product: (Product & { unitsSold: number }) | null }> = ({ product }) => (
     <div className="glass-panel p-4 rounded-2xl flex items-center space-x-4 col-span-2 transition-all hover:scale-[1.02]">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/50 dark:bg-black/30 flex items-center justify-center flex-shrink-0 border border-black/5 dark:border-white/10 shadow-inner">
            {product ? (
                <ProductImage image={product.image} alt={product.name} className="w-full h-full object-contain text-3xl" />
            ) : (
                <span className="text-3xl">🏆</span>
            )}
        </div>
        <div className="overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Produit Phare du Jour</p>
            {product ? (
                 <>
                    <p className="text-xl font-bold text-slate-900 dark:text-white truncate drop-shadow-sm">{product.name}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{product.unitsSold} vendu{product.unitsSold > 1 ? 's' : ''}</p>
                 </>
            ) : (
                <p className="text-lg font-bold text-slate-500">Aucune vente</p>
            )}
        </div>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ setPage }) => {
    // Hooks (must be declared first)
    const { settings, sales, donations, manualRefunds, safeDeposits, products, cashOuts, labels } = useBuvette();
    const { estimatedFees, netRevenueAfterFees, totalRevenue } = useEventAnalytics(sales, donations, manualRefunds, safeDeposits, cashOuts, products, settings, null);

    // Defensive early return while data loads
    if (!sales || !products || !settings || !Array.isArray(sales)) return <Loading />;

    // Memoized computations using pure helpers
    const todayStats = useMemo(() => computeTodayStats(sales || [], products || []), [sales, products]);

    const headingFontClass = useMemo(() => {
        if (settings?.appFont === 'elegant') return 'font-display';
        if (settings?.appFont === 'handwritten') return 'font-handwritten';
        return 'font-sans';
    }, [settings?.appFont]);

    const { netEstimated, feesEstimated, urssafRate, urssafCharge } = useMemo(() => {
        const net = netRevenueAfterFees ?? 0;
        const fees = estimatedFees ?? 0;
        const rate = settings?.urssafRate ?? 0;
        const charge = computeUrssafCharge(totalRevenue ?? 0, rate);
        return { netEstimated: net, feesEstimated: fees, urssafRate: rate, urssafCharge: charge };
    }, [netRevenueAfterFees, estimatedFees, totalRevenue, settings?.urssafRate]);

    return (
        <div className="flex flex-col h-full space-y-6 justify-center max-w-xl mx-auto w-full">
            
            <div className="text-center animate-in fade-in-0 slide-in-from-top-5 duration-700">
                {settings.businessLogo ? (
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 flex items-center justify-center backdrop-blur-sm">
                         <ProductImage image={settings.businessLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                ) : null}
                
                <h1 className={`text-4xl md:text-5xl text-slate-900 dark:text-white drop-shadow-lg ${headingFontClass}`}>
                    {settings.businessName || labels.buvette}
                </h1>
                 <p className="text-slate-600 dark:text-slate-300 mt-1 font-light tracking-wide">Tableau de bord</p>
            </div>

            <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-100 px-4">
                <button
                    onClick={() => setPage(Page.Sale)}
                    className="w-full bg-orange-500 text-black font-bold py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/20 text-xl font-display
                       hover:shadow-orange-500/40 hover:bg-orange-400 transform hover:scale-[1.02] transition-all duration-300 border border-orange-400/50 backdrop-blur-sm"
                >
                    Effectuer une Vente
                </button>
            </div>

            <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200 px-2">
                <h2 className={`text-lg text-slate-700 dark:text-slate-300 mb-3 px-2 opacity-90 ${headingFontClass}`}>Aperçu rapide</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                        icon={ArrowTrendingUpIcon} 
                        title="C.A. du Jour" 
                        value={`${formatCurrency(todayStats.revenue)}`} 
                        color="text-emerald-600 dark:text-emerald-400"
                    />
                     <StatCard 
                        icon={WalletIcon} 
                        title="Net Estimé" 
                        value={`${formatCurrency(netEstimated)}`}
                        subValue={<span className="text-slate-500 dark:text-slate-400/80">Dont frais: -{formatCurrency(feesEstimated)}</span>}
                        color="text-blue-600 dark:text-blue-400"
                    />
                            <StatCard 
                                icon={ReceiptPercentIcon}
                                title="Charges à prévoir (URSSAF)"
                                value={`${formatCurrency(urssafCharge)}`}
                                subValue={<span className="text-slate-500 dark:text-slate-400/80">Taux: {formatPercentage(urssafRate)}</span>}
                                color="text-orange-600 dark:text-orange-400"
                            />
                     <StatCard 
                        icon={ReceiptPercentIcon} 
                        title="Ventes du Jour" 
                        value={todayStats.salesCount} 
                        color="text-sky-600 dark:text-sky-400"
                    />
                    <TopProductCard product={todayStats.topProduct} />
                </div>
            </div>
        </div>
    );
};

export default React.memo(HomePage);

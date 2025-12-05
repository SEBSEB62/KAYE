
import { useMemo } from 'react';
import { SaleRecord, DonationRecord, ManualRefund, Product, Settings, SafeDepositRecord, ProductMetrics, CashOutRecord } from '../types';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EventAnalyticsData {
    totalRevenue: number;
    totalCostOfGoods: number;
    grossProfit: number;
    totalDonations: number;
    cashDonations: number;
    cardDonations: number;
    totalSaleRefunds: number;
    totalManualRefunds: number;
    totalCashOuts: number;
    totalRemboursements: number;
    totalSafeDeposits: number;
    totalSortiesEspeces: number;
    totalEncaissements: number;
    totalCouts: number;
    beneficeNet: number;
    cashSales: number;
    cardSales: number;
    checkSales: number; // New
    paypalSales: number; // New
    weroSales: number; // New
    entreesEspeces: number;
    entreesSumUp: number;
    initialCash: number;
    caisseFinaleEspeces: number;
    estimatedFees: number; 
    netRevenueAfterFees: number; 
    chartData: { date: string; total: number }[];
    topProductsByProfit: ProductMetrics[];
    topProductsByQuantity: ProductMetrics[];
    salesByCategory: { name: string; revenue: number; count: number }[];
    validSales: SaleRecord[];
}

export const useEventAnalytics = (
    sales: SaleRecord[],
    donations: DonationRecord[],
    manualRefunds: ManualRefund[],
    safeDeposits: SafeDepositRecord[],
    cashOuts: CashOutRecord[],
    products: Product[],
    settings: Settings,
    dateRange: DateRange | null
): EventAnalyticsData => {
    return useMemo(() => {
        const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
            if (!dateRange) return items;
            const endOfDay = new Date(dateRange.end);
            endOfDay.setHours(23, 59, 59, 999);
            return items.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= dateRange.start && itemDate <= endOfDay;
            });
        };

        const filteredSales = filterByDate(sales);
        const filteredDonations = filterByDate(donations);
        const filteredManualRefunds = filterByDate(manualRefunds);
        const filteredSafeDeposits = filterByDate(safeDeposits);
        const filteredCashOuts = filterByDate(cashOuts);

        const validSales = filteredSales.filter(s => !s.refunded);
        const initialCash = settings.initialCash || 0;

        const totalRevenue = validSales.reduce((sum, sale) => sum + sale.total, 0);
        
        // --- Sales breakdown ---
        const cashSales = validSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
        const cardSalesRecords = validSales.filter(s => s.paymentMethod === 'card');
        const cardSales = cardSalesRecords.reduce((sum, s) => sum + s.total, 0);
        const checkSales = validSales.filter(s => s.paymentMethod === 'check').reduce((sum, s) => sum + s.total, 0);
        const paypalSalesRecords = validSales.filter(s => s.paymentMethod === 'paypal');
        const paypalSales = paypalSalesRecords.reduce((sum, s) => sum + s.total, 0);
        const weroSales = validSales.filter(s => s.paymentMethod === 'wero').reduce((sum, s) => sum + s.total, 0);

        const totalDonations = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
        const cashDonations = filteredDonations.filter(d => d.paymentMethod === 'cash' || d.paymentMethod === undefined).reduce((sum, d) => sum + d.amount, 0);
        const cardDonations = filteredDonations.filter(d => d.paymentMethod === 'card').reduce((sum, d) => sum + d.amount, 0);

        const totalCostOfGoods = validSales.reduce((sum, sale) => {
            const saleCost = sale.items.reduce((itemSum, item) => {
                const prod = productMap.get(item.id);
                const material = (item.purchasePrice || 0);
                const laborMinutes = (prod?.laborTimeMinutes) || 0;
                const hourly = settings.hourlyRate || 0;
                const laborCostPerUnit = (laborMinutes / 60) * hourly;
                return itemSum + (material + laborCostPerUnit) * item.quantity;
            }, 0);
            return sum + saleCost;
        }, 0);
        
        // --- FEE LOGIC (2025 Rates) ---
        const sumUpFees = (cardSales + cardDonations) * 0.0175;
        const paypalFees = paypalSalesRecords.reduce((sum, sale) => {
            if (sale.total > 0) {
                return sum + (sale.total * 0.029 + 0.35);
            }
            return sum;
        }, 0);
        const estimatedFees = sumUpFees + paypalFees;

        const totalSaleRefunds = filteredSales.filter(s => s.refunded).reduce((sum, sale) => sum + sale.total, 0);
        const totalManualRefunds = filteredManualRefunds.reduce((sum, refund) => sum + refund.amount, 0);
        const totalCashOuts = filteredCashOuts.reduce((sum, co) => sum + co.amount, 0);
        const totalRemboursements = totalSaleRefunds + totalManualRefunds;
        const totalSafeDeposits = filteredSafeDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
        const totalSortiesEspeces = totalRemboursements + totalSafeDeposits + totalCashOuts;

        const grossProfit = totalRevenue - totalCostOfGoods;

        const entreesEspeces = cashSales + cashDonations;
        const entreesSumUp = cardSales + cardDonations;
        const caisseFinaleEspeces = initialCash + entreesEspeces - totalSortiesEspeces;

        const totalEncaissements = totalRevenue + totalDonations;
        const netRevenueAfterFees = totalEncaissements - estimatedFees;
        const totalCouts = totalCostOfGoods + totalRemboursements + totalCashOuts + estimatedFees;
        const beneficeNet = totalEncaissements - totalCouts;

        const salesByDay = validSales.reduce((acc, sale) => {
            const day = new Date(sale.date).toLocaleDateString('fr-CA');
            if (!acc[day]) acc[day] = 0;
            acc[day] += sale.total;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(salesByDay)
            .map(([date, total]) => ({ date, total: Number(total) }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const productSales = validSales.flatMap(sale => sale.items).reduce((acc, item) => {
            if (!item.isMisc) {
               acc[item.id] = (acc[item.id] || 0) + item.quantity;
            }
            return acc;
        }, {} as Record<string, number>);

        const productMap = new Map(products.map(p => [p.id, p]));

        const productMetrics = Object.entries(productSales)
            .map(([productId, unitsSold]) => {
                const product = productMap.get(productId);
                if (!product) return null;
                const revenue = product.price * unitsSold;
                const marginPerUnit = product.price - (product.purchasePrice || 0);
                const totalProfit = marginPerUnit * unitsSold;
                return { ...product, unitsSold, revenue, marginPerUnit, totalProfit };
            })
            .filter((p): p is ProductMetrics => p !== null);

        const topProductsByProfit = [...productMetrics].sort((a, b) => b.totalProfit - a.totalProfit);
        const topProductsByQuantity = [...productMetrics].sort((a, b) => b.unitsSold - a.unitsSold);

        const salesByCategoryRaw = validSales
            .flatMap(sale => sale.items)
            .reduce((acc, item) => {
                const category = item.category || 'Divers';
                if (!acc[category]) acc[category] = { revenue: 0, count: 0 };
                acc[category].revenue += item.price * item.quantity;
                acc[category].count += item.quantity;
                return acc;
            }, {} as Record<string, { revenue: number; count: number }>);

        const salesByCategory = Object.entries(salesByCategoryRaw)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue);


        return {
            totalRevenue, totalCostOfGoods, grossProfit, totalDonations, cashDonations, cardDonations,
            totalSaleRefunds, totalManualRefunds, totalCashOuts, totalRemboursements, totalSafeDeposits,
            totalSortiesEspeces, totalEncaissements, totalCouts, beneficeNet, cashSales, cardSales,
            checkSales, paypalSales, weroSales, entreesEspeces, entreesSumUp, initialCash,
            caisseFinaleEspeces, estimatedFees, netRevenueAfterFees, chartData, topProductsByProfit,
            topProductsByQuantity, salesByCategory, validSales,
        };
    }, [sales, donations, manualRefunds, safeDeposits, cashOuts, products, settings, dateRange]);
};

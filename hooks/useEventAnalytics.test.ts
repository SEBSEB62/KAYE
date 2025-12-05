
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventAnalytics } from './useEventAnalytics';
import { Product, SaleRecord, DonationRecord, Settings, SubscriptionPlan } from '../types';

// Données de test
const mockProducts: Product[] = [
  { id: '1', name: 'Soda', price: 2.5, purchasePrice: 1, stock: 50, category: 'Boissons', image: '🥤' },
  { id: '2', name: 'Chips', price: 1.5, purchasePrice: 0.5, stock: 100, category: 'Snacks', image: '🍿' },
  { id: '3', name: 'Sandwich', price: 5, purchasePrice: 2, stock: 20, category: 'Divers', image: '🥪' },
];

const mockSales: SaleRecord[] = [
  { 
    id: 's1', 
    date: new Date().toISOString(), 
    items: [
      { ...mockProducts[0], quantity: 2, purchasePrice: mockProducts[0].purchasePrice }, // 2 Sodas
      { ...mockProducts[1], quantity: 1, purchasePrice: mockProducts[1].purchasePrice }, // 1 Chips
    ], 
    total: 2.5 * 2 + 1.5 * 1, // 6.5
    paymentMethod: 'cash' 
  },
  { 
    id: 's2', 
    date: new Date().toISOString(), 
    items: [
      { ...mockProducts[2], quantity: 1, purchasePrice: mockProducts[2].purchasePrice }, // 1 Sandwich
    ], 
    total: 5, 
    paymentMethod: 'card' 
  },
];

const mockDonations: DonationRecord[] = [
    { id: 'd1', date: new Date().toISOString(), amount: 10, paymentMethod: 'cash' },
];

const mockSettings: Settings = {
    businessName: 'Test Buvette',
    initialCash: 100,
    subscriptionPlan: SubscriptionPlan.PRO,
    team: [],
    businessAddress: '',
    businessContact: '',
    receiptFooter: '',
    businessLogo: null,
    startupGif: null,
    lowStockThreshold: 5,
    tokenMode: false,
    appMode: 'association',
    uiMode: 'grid',
    subscriptionExpiry: new Date().toISOString(),
    backgroundImage: null,
    backgroundOverlayOpacity: 0.7,
    appFont: 'modern',
    categories: ['Boissons', 'Snacks', 'Divers'],
    themeMode: 'dark',
};

describe('useEventAnalytics Hook', () => {

  it('should calculate financial metrics correctly', () => {
    const { result } = renderHook(() => 
      useEventAnalytics(mockSales, mockDonations, [], [], [], mockProducts, mockSettings, null)
    );

    // CA = 6.5 (vente 1) + 5 (vente 2) = 11.5
    expect(result.current.totalRevenue).toBe(11.5);

    // Coût = (2 * 1) + (1 * 0.5) + (1 * 2) = 2 + 0.5 + 2 = 4.5
    expect(result.current.totalCostOfGoods).toBe(4.5);

    // Marge Brute = 11.5 - 4.5 = 7
    expect(result.current.grossProfit).toBe(7);
    
    // Total Dons = 10
    expect(result.current.totalDonations).toBe(10);

    // Bénéfice Net = (Total Encaissements) - (Total Coûts)
    // Encaissements = CA + Dons = 11.5 + 10 = 21.5
    // Coûts = Coût Marchandises = 4.5
    // Bénéfice Net = 21.5 - 4.5 = 17
    expect(result.current.beneficeNet).toBe(17);
  });

  it('should correctly rank products by profit and quantity', () => {
     const { result } = renderHook(() => 
      useEventAnalytics(mockSales, [], [], [], [], mockProducts, mockSettings, null)
    );
    
    // Profit Soda = 2 * (2.5 - 1) = 3
    // Profit Chips = 1 * (1.5 - 0.5) = 1
    // Profit Sandwich = 1 * (5 - 2) = 3
    // Le soda et le sandwich sont à égalité de profit, l'ordre peut varier.
    expect(result.current.topProductsByProfit[0].name).toBe('Soda');
    expect(result.current.topProductsByProfit[1].name).toBe('Sandwich');
    expect(result.current.topProductsByProfit[2].name).toBe('Chips');

    // Quantité Soda = 2
    // Quantité Chips = 1
    // Quantité Sandwich = 1
    expect(result.current.topProductsByQuantity[0].name).toBe('Soda');
    expect(result.current.topProductsByQuantity[0].unitsSold).toBe(2);
  });
  
});
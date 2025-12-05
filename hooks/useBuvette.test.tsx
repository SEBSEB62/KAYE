
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BuvetteProvider, useBuvette, simpleHash, verifyHash } from './useBuvette';
import { Product } from '../types';

// Données de test
const mockProduct1: Omit<Product, 'id'> = {
  name: 'Soda', price: 2.5, purchasePrice: 1, stock: 10, category: 'Boissons', image: '🥤'
};
const mockProduct2: Omit<Product, 'id'> = {
  name: 'Chips', price: 1.5, purchasePrice: 0.5, stock: 5, category: 'Snacks', image: '🍿'
};


describe('useBuvette Hook & Helpers', () => {
    
    // Wrapper pour fournir le contexte à notre hook
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BuvetteProvider>{children}</BuvetteProvider>
    );

    beforeEach(() => {
        // Clear mocks and reset localStorage before each test
        localStorage.clear();
    });
    
    describe('Security Functions', () => {
        it('should correctly hash and verify a secret', () => {
            const secret = 'myS3cr3tP!N';
            const storedHash = simpleHash(secret);

            expect(storedHash).toMatch(/^b64\|.+/);
            expect(verifyHash(secret, storedHash)).toBe(true);
            expect(verifyHash('wrong_secret', storedHash)).toBe(false);
        });

        it('should handle UTF-8 characters correctly', () => {
            const secret = 'motdepasséàçù';
            const storedHash = simpleHash(secret);
            expect(verifyHash(secret, storedHash)).toBe(true);
        });
    });

    describe('Product Management', () => {
        it('should add a product and initialize stock history', () => {
            const { result } = renderHook(() => useBuvette(), { wrapper });

            act(() => {
                result.current.addProduct(mockProduct1);
            });
            
            expect(result.current.products).toHaveLength(1);
            expect(result.current.products[0].name).toBe('Soda');
            expect(result.current.stockHistory).toHaveLength(1);
            expect(result.current.stockHistory[0].type).toBe('initial');
            expect(result.current.stockHistory[0].newStock).toBe(10);
        });
    });
    
    describe('Cart Management', () => {
        it('should add an item to the cart', () => {
            const { result } = renderHook(() => useBuvette(), { wrapper });
            
            act(() => {
                result.current.addProduct(mockProduct1);
            });

            const product = result.current.products[0];
            
            act(() => {
                result.current.addToCart(product);
            });
            
            expect(result.current.cart).toHaveLength(1);
            expect(result.current.cart[0].name).toBe('Soda');
            expect(result.current.cart[0].quantity).toBe(1);
            expect(result.current.cartCount).toBe(1);
        });

        it('should not add an item to the cart if out of stock', () => {
            const { result } = renderHook(() => useBuvette(), { wrapper });
            const outOfStockProduct = { ...mockProduct1, stock: 0 };
             act(() => {
                result.current.addProduct(outOfStockProduct);
            });
            
            act(() => {
                result.current.addToCart(result.current.products[0]);
            });

            expect(result.current.cart).toHaveLength(0);
        });

        it('should update cart quantity correctly', () => {
            const { result } = renderHook(() => useBuvette(), { wrapper });
            act(() => { result.current.addProduct(mockProduct1); });
            const product = result.current.products[0];
            act(() => { result.current.addToCart(product); });

            act(() => {
                result.current.updateCartQuantity(product.id, 5);
            });

            expect(result.current.cart[0].quantity).toBe(5);
            expect(result.current.cartCount).toBe(5);
        });
        
        it('should respect stock limits when updating quantity', () => {
            const { result } = renderHook(() => useBuvette(), { wrapper });
            act(() => { result.current.addProduct(mockProduct2); }); // Stock is 5
            const product = result.current.products[0];
            act(() => { result.current.addToCart(product); });

            act(() => {
                result.current.updateCartQuantity(product.id, 10);
            });

            expect(result.current.cart[0].quantity).toBe(5); // Adjusted to max stock
        });
        
        it('should remove an item when quantity is updated to 0', () => {
             const { result } = renderHook(() => useBuvette(), { wrapper });
             act(() => { result.current.addProduct(mockProduct1); });
             const product = result.current.products[0];
             act(() => { result.current.addToCart(product); });
             
             act(() => {
                result.current.updateCartQuantity(product.id, 0);
             });
             
             expect(result.current.cart).toHaveLength(0);
        });
    });
    
    describe('Sale Processing', () => {
        it('should process a sale, update stock, and clear the cart', () => {
            const { result } = renderHook(() => useBuvette(), { wrapper });
            
            // Setup products and cart
            act(() => { result.current.addProduct(mockProduct1); });
            act(() => { result.current.addProduct(mockProduct2); });
            
            const p1 = result.current.products.find(p => p.name === 'Soda')!;
            const p2 = result.current.products.find(p => p.name === 'Chips')!;
            
            act(() => {
                result.current.addToCart(p1); // Qty 1
                result.current.addToCart(p1); // Qty 2
                result.current.addToCart(p2); // Qty 1
            });
            
            expect(result.current.cart).toHaveLength(2);
            expect(result.current.cartTotal).toBe(2.5 * 2 + 1.5); // 6.5
            
            // Process the sale
            act(() => {
                result.current.processSale('cash');
            });
            
            // Verify outcomes
            expect(result.current.sales).toHaveLength(1);
            expect(result.current.sales[0].total).toBe(6.5);
            
            expect(result.current.cart).toHaveLength(0); // Cart is cleared
            
            const updatedP1 = result.current.products.find(p => p.id === p1.id)!;
            const updatedP2 = result.current.products.find(p => p.id === p2.id)!;
            
            expect(updatedP1.stock).toBe(8); // 10 - 2
            expect(updatedP2.stock).toBe(4); // 5 - 1
            
            expect(result.current.stockHistory.some(h => h.type === 'sale' && h.productId === p1.id)).toBe(true);
        });
    });
});


import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render } from '../test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import SalePage from './SalePage';
import { useBuvette } from '../hooks/useBuvette';
import { Product } from '../types';

vi.mock('../hooks/useBuvette', async () => {
    const actual = await vi.importActual('../hooks/useBuvette');
    return {
        ...actual,
        useBuvette: vi.fn(),
    };
});

const mockAddToCart = vi.fn();

const mockProducts: Product[] = [
    { id: '1', name: 'Coca-Cola', price: 2.5, stock: 10, category: 'Boissons', image: '🥤' },
    { id: '2', name: 'Chips Sel', price: 1.5, stock: 20, category: 'Snacks', image: '🍿' },
    { id: '3', name: 'Gaufre au sucre', price: 3, stock: 5, category: 'Divers', image: '🧇' },
];

const mockSettings = {
    uiMode: 'grid', // Test with grid mode for simplicity
    categories: ['Boissons', 'Snacks', 'Divers']
};

describe('SalePage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        (useBuvette as Mock).mockReturnValue({
            products: mockProducts,
            settings: mockSettings,
            addToCart: mockAddToCart,
            addMiscSaleToCart: vi.fn(),
            showToast: vi.fn(),
        });
    });

    it('renders all products by default', () => {
        render(<SalePage />);
        expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
        expect(screen.getByText('Chips Sel')).toBeInTheDocument();
        expect(screen.getByText('Gaufre au sucre')).toBeInTheDocument();
    });

    it('filters products by search term', async () => {
        render(<SalePage />);
        const searchInput = screen.getByPlaceholderText(/Rechercher un produit/i);

        fireEvent.change(searchInput, { target: { value: 'coca' } });

        await waitFor(() => {
            expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
            expect(screen.queryByText('Chips Sel')).not.toBeInTheDocument();
            expect(screen.queryByText('Gaufre au sucre')).not.toBeInTheDocument();
        });
    });

    it('filters products by category', async () => {
        render(<SalePage />);
        
        // Find the category button for "Snacks"
        const snackCategoryButton = screen.getByRole('button', { name: 'Snacks' });
        fireEvent.click(snackCategoryButton);

        await waitFor(() => {
            expect(screen.queryByText('Coca-Cola')).not.toBeInTheDocument();
            expect(screen.getByText('Chips Sel')).toBeInTheDocument();
            expect(screen.queryByText('Gaufre au sucre')).not.toBeInTheDocument();
        });
    });

    it('calls addToCart when a product is clicked', () => {
        render(<SalePage />);

        const productButton = screen.getByRole('button', { name: /Ajouter Coca-Cola au panier/i });
        fireEvent.click(productButton);

        expect(mockAddToCart).toHaveBeenCalledTimes(1);
        expect(mockAddToCart).toHaveBeenCalledWith(mockProducts[0]);
    });
    
    it('disables a product button when it is out of stock', () => {
        const productsWithOutOfStock = [
            ...mockProducts,
            { id: '4', name: 'Jus de Pomme', price: 2, stock: 0, category: 'Boissons', image: '🧃' }
        ];
        (useBuvette as Mock).mockReturnValue({
            products: productsWithOutOfStock,
            settings: mockSettings,
            addToCart: mockAddToCart,
            showToast: vi.fn(),
        });

        render(<SalePage />);
        const outOfStockButton = screen.getByRole('button', { name: /Jus de Pomme en rupture de stock/i });
        expect(outOfStockButton).toBeDisabled();
    });

});


import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render } from '../test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import CartPage from './CartPage';
import { useBuvette } from '../hooks/useBuvette';
import { Page } from '../types';

// Mock the useBuvette hook
vi.mock('../hooks/useBuvette', async () => {
  const actual = await vi.importActual('../hooks/useBuvette');
  return {
    ...actual,
    useBuvette: vi.fn(),
  };
});

const mockProcessSale = vi.fn();
const mockSetPage = vi.fn();
const mockShowToast = vi.fn();

const mockCartItem = {
    id: 'prod-1',
    name: 'Soda Can',
    price: 2.5,
    quantity: 2,
    image: '🥤',
    category: 'Boissons'
};

const mockSettings = {
    businessName: 'Test Buvette',
    tokenMode: false,
};

describe('CartPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty cart message when cart is empty', () => {
        (useBuvette as Mock).mockReturnValue({
            cart: [],
            cartCount: 0,
            cartTotal: 0,
            settings: mockSettings,
            setPage: mockSetPage,
            showToast: mockShowToast,
        });
        render(<CartPage setPage={mockSetPage} />);
        expect(screen.getByText('Panier Vide')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Parcourir les produits/i })).toBeInTheDocument();
    });

    it('renders cart items and total when cart is not empty', () => {
         (useBuvette as Mock).mockReturnValue({
            cart: [mockCartItem],
            cartCount: 2,
            cartTotal: 5.0,
            cartTokenTotal: 0,
            settings: mockSettings,
            showToast: mockShowToast,
        });
        render(<CartPage setPage={mockSetPage} />);
        
        expect(screen.getByText('Soda Can')).toBeInTheDocument();
        expect(screen.getByText('Panier (2)')).toBeInTheDocument();
        expect(screen.getByText('5.00€')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Espèces/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Carte/i })).toBeInTheDocument();
    });

    it('opens cash modal and processes sale', async () => {
         mockProcessSale.mockReturnValue({
            id: 'sale-1',
            total: 5.0,
            paymentMethod: 'cash',
            items: [mockCartItem],
            date: new Date().toISOString()
         });
         (useBuvette as Mock).mockReturnValue({
            cart: [mockCartItem],
            cartCount: 2,
            cartTotal: 5.0,
            settings: mockSettings,
            processSale: mockProcessSale,
            setPage: mockSetPage,
            showToast: mockShowToast,
        });

        render(<CartPage setPage={mockSetPage} />);

        // Open cash modal
        fireEvent.click(screen.getByRole('button', { name: /Espèces/i }));
        expect(await screen.findByText('Paiement Espèces')).toBeInTheDocument();

        // The keypad appears on input focus.
        const cashInput = screen.getByLabelText(/Montant reçu/i);
        fireEvent.focus(cashInput);
        
        // Now that the keypad is visible, simulate input
        const button1 = await screen.findByRole('button', { name: '1' });
        fireEvent.click(button1);
        fireEvent.click(screen.getByRole('button', { name: '0' }));

        // Keypad has an OK button to be dismissed
        const okButton = await screen.findByRole('button', { name: 'OK' });
        fireEvent.click(okButton);
        
        // Confirm payment
        const confirmButton = await screen.findByRole('button', { name: 'Confirmer Vente' });
        expect(confirmButton).not.toBeDisabled();
        fireEvent.click(confirmButton);
        
        // Verify sale was processed
        expect(mockProcessSale).toHaveBeenCalledWith('cash');
        
        // Verify success screen is shown
        await waitFor(() => {
            expect(screen.getByText(/Vente de 5.00€ Complète !/i)).toBeInTheDocument();
            expect(screen.getByText(/Monnaie à rendre :/i)).toBeInTheDocument();
            expect(screen.getByText('5.00€')).toBeInTheDocument(); // Change
        });
        
        // Click new sale
        fireEvent.click(screen.getByRole('button', { name: /Nouvelle Vente/i }));
        expect(mockSetPage).toHaveBeenCalledWith(Page.Sale);
    });

    it('processes card payment directly', async () => {
         mockProcessSale.mockReturnValue({
            id: 'sale-2',
            total: 5.0,
            paymentMethod: 'card',
            items: [mockCartItem],
            date: new Date().toISOString()
         });
         (useBuvette as Mock).mockReturnValue({
            cart: [mockCartItem],
            cartCount: 2,
            cartTotal: 5.0,
            settings: mockSettings,
            processSale: mockProcessSale,
            showToast: mockShowToast,
        });

        render(<CartPage setPage={mockSetPage} />);
        
        fireEvent.click(screen.getByRole('button', { name: /Carte/i }));
        
        expect(mockProcessSale).toHaveBeenCalledWith('card');

        await waitFor(() => {
            expect(screen.getByText(/Vente de 5.00€ Complète !/i)).toBeInTheDocument();
        });
    });

});

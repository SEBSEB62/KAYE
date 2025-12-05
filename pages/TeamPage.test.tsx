import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render } from '../test-utils';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import TeamPage from './TeamPage';
import { useBuvette } from '../hooks/useBuvette';
import { UserRole } from '../types';

vi.mock('../hooks/useBuvette', async () => {
    const actual = await vi.importActual('../hooks/useBuvette');
    return {
        ...actual,
        useBuvette: vi.fn(),
    };
});

const mockAddTeamMember = vi.fn();
const mockUpdateTeamMember = vi.fn();
const mockDeleteTeamMember = vi.fn();
const mockSetPage = vi.fn();

const mockTeam = [
    { id: 't1', name: 'John Doe', role: UserRole.Seller, pinHash: 'hashedpin1' },
    { id: 't2', name: 'Jane Smith', role: UserRole.Seller, pinHash: 'hashedpin2' },
];

const mockSettings = {
    team: mockTeam,
};

describe('TeamPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        (useBuvette as Mock).mockReturnValue({
            settings: mockSettings,
            addTeamMember: mockAddTeamMember,
            updateTeamMember: mockUpdateTeamMember,
            deleteTeamMember: mockDeleteTeamMember,
        });
    });

    it('renders the list of team members', () => {
        render(<TeamPage setPage={mockSetPage} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('opens the "Add Member" modal and submits', async () => {
        render(<TeamPage setPage={mockSetPage} />);
        
        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /Ajouter un Membre/i }));
        expect(await screen.findByText('Ajouter un Membre')).toBeInTheDocument();

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nom du vendeur/i), { target: { value: 'New Member' } });
        fireEvent.change(screen.getByLabelText(/Code PIN/i), { target: { value: '1234' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

        await waitFor(() => {
            expect(mockAddTeamMember).toHaveBeenCalledWith('New Member', '1234');
        });
    });
    
    it('opens the "Edit Member" modal and submits', async () => {
        render(<TeamPage setPage={mockSetPage} />);

        // Find the edit button for John Doe
        const editButtons = screen.getAllByRole('button', { name: /Modifier/i });
        fireEvent.click(editButtons[0]);

        expect(await screen.findByText('Modifier le Membre')).toBeInTheDocument();

        // Check if name is pre-filled
        const nameInput = screen.getByLabelText(/Nom du vendeur/i) as HTMLInputElement;
        expect(nameInput.value).toBe('John Doe');
        
        // Change name and PIN
        fireEvent.change(nameInput, { target: { value: 'John Doe Updated' } });
        fireEvent.change(screen.getByLabelText(/Code PIN/i), { target: { value: '4321' } });
        
        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

        await waitFor(() => {
            expect(mockUpdateTeamMember).toHaveBeenCalledWith('t1', 'John Doe Updated', '4321');
        });
    });
    
    it('opens the "Delete Member" confirmation and confirms', async () => {
        render(<TeamPage setPage={mockSetPage} />);
        
        // Find delete button for Jane Smith
        const deleteButtons = screen.getAllByRole('button', { name: /Supprimer/i });
        fireEvent.click(deleteButtons[1]);
        
        // Confirm modal opens
        const modal = await screen.findByRole('dialog', { name: /Supprimer le Membre/i });
        expect(modal).toBeInTheDocument();
        expect(within(modal).getByText(/Êtes-vous sûr de vouloir supprimer/i)).toBeInTheDocument();
        expect(within(modal).getByText('Jane Smith')).toBeInTheDocument();
        
        // Confirm deletion
        fireEvent.click(within(modal).getByRole('button', { name: 'Supprimer' }));
        
        await waitFor(() => {
            expect(mockDeleteTeamMember).toHaveBeenCalledWith('t2');
        });
    });
});

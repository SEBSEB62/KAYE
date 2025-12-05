import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render } from '../test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from './AuthPage';
import { useBuvette } from '../hooks/useBuvette';

// Mock the useBuvette hook to control its return values
vi.mock('../hooks/useBuvette', async () => {
  const actual = await vi.importActual('../hooks/useBuvette');
  return {
    ...actual,
    useBuvette: vi.fn(),
  };
});

const mockLoginUser = vi.fn();
const mockRegisterUser = vi.fn();
const mockSetPage = vi.fn();

describe('AuthPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    (useBuvette as Mock).mockReturnValue({
      loginUser: mockLoginUser,
      registerUser: mockRegisterUser,
      setPage: mockSetPage,
    });
  });

  it('renders the login form by default', () => {
    render(<AuthPage setPage={mockSetPage} />);
    expect(screen.getByRole('heading', { name: /Connexion/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/votre.email@exemple.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se Connecter/i })).toBeInTheDocument();
  });

  it('switches to register mode when "Créer un compte" is clicked', async () => {
    render(<AuthPage setPage={mockSetPage} />);
    const switchButton = screen.getByRole('button', { name: /Pas de compte \? Créer un compte/i });
    
    fireEvent.click(switchButton);

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Créer un Compte/i })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Confirmer le mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /S'inscrire/i })).toBeInTheDocument();
  });

  it('allows typing in email and password fields', () => {
    render(<AuthPage setPage={mockSetPage} />);
    const emailInput = screen.getByPlaceholderText(/votre.email@exemple.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('calls loginUser on form submission in login mode', async () => {
    mockLoginUser.mockReturnValue({ success: true });
    render(<AuthPage setPage={mockSetPage} />);
    
    fireEvent.change(screen.getByPlaceholderText(/votre.email@exemple.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mot de passe/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Se Connecter/i }));

    await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('calls registerUser on form submission in register mode', async () => {
    mockRegisterUser.mockReturnValue({ success: true });
    render(<AuthPage setPage={mockSetPage} />);

    // Switch to register mode
    fireEvent.click(screen.getByRole('button', { name: /Pas de compte \? Créer un compte/i }));

    // Fill the form
    await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText(/votre.email@exemple.com/i), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getAllByPlaceholderText(/Mot de passe/i)[0], { target: { value: 'newPassword1!' } });
        fireEvent.change(screen.getByPlaceholderText(/Confirmer le mot de passe/i), { target: { value: 'newPassword1!' } });
        fireEvent.click(screen.getByRole('checkbox', { name: /J'accepte les/i }));
    });

    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));
    
    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith('new@example.com', 'newPassword1!');
    });
  });
  
  it('displays an error if passwords do not match in register mode', async () => {
     render(<AuthPage setPage={mockSetPage} />);
     fireEvent.click(screen.getByRole('button', { name: /Pas de compte \? Créer un compte/i }));

     await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText(/votre.email@exemple.com/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getAllByPlaceholderText(/Mot de passe/i)[0], { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText(/Confirmer le mot de passe/i), { target: { value: 'password456' } });
        fireEvent.click(screen.getByRole('checkbox', { name: /J'accepte les/i }));
     });
     
     fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));

     expect(await screen.findByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
     expect(mockRegisterUser).not.toHaveBeenCalled();
  });
});
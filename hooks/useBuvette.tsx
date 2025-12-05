
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Product, Settings, SaleRecord, CartItem, Notification, StockHistoryEntry, DonationRecord, ManualRefund, SafeDepositRecord, SubscriptionPlan, User, CashOutRecord, SubUser, UserRole, SelectedUser } from '../types';
import { signUp, signIn, logOut, onAuthChange, verifyAndActivateLicense } from '../services/firebaseService';
import { saveUserData, loadUserData } from '../utils/db';

// --- Fonctions de Sécurité (PIN local) ---
const btoaUtf8 = (str: string): string => btoa(unescape(encodeURIComponent(str)));
export const simpleHash = (str: string) => `b64|${btoaUtf8(str)}`;
export const verifyHash = (str: string, hash: string) => hash === `b64|${btoaUtf8(str)}`;


// Default settings for a new user/event
const DEFAULT_SETTINGS: Settings = {
  businessName: 'KAYÉ',
  businessAddress: '',
  businessContact: '',
  receiptFooter: 'Merci de votre visite !',
  businessLogo: null,
  backgroundImage: null,
  backgroundOverlayOpacity: 0.7,
  appFont: 'modern',
  startupGif: null,
  adminPassword: simpleHash('admin'),
  initialCash: 0,
  lowStockThreshold: 5,
  tokenMode: false,
  appMode: 'business',
  uiMode: 'carousel',
  subscriptionPlan: SubscriptionPlan.ESSENTIEL,
  subscriptionExpiry: null,
  team: [],
  brandColor: '#2563eb',
  categories: ['Divers', 'Boissons', 'Snacks'], // Default categories
  themeMode: 'dark',
    // URSSAF defaults: 'vente' (commerce / vente de marchandises) ~12.3%
    urssafActivity: 'vente',
    urssafRate: 12.3,
    // Default hourly rate (target pay) in €/hour. Default to SMIC-ish value for backward compatibility.
    hourlyRate: 11.65,
};

// Labels interface for dynamic vocabulary
export interface AppLabels {
    buvette: string;
    team: string;
    donation: string;
    event: string;
    token: string;
}

// Data structure for a single user's persisted data
interface UserData {
    products: Product[];
    settings: Settings;
    sales: SaleRecord[];
    donations: DonationRecord[];
    manualRefunds: ManualRefund[];
    safeDeposits: SafeDepositRecord[];
    stockHistory: StockHistoryEntry[];
    cashOuts: CashOutRecord[];
}

// Shape of the context data
interface BuvetteContextType {
  // State
  products: Product[];
  settings: Settings;
  sales: SaleRecord[];
  donations: DonationRecord[];
  manualRefunds: ManualRefund[];
  safeDeposits: SafeDepositRecord[];
  cashOuts: CashOutRecord[];
  stockHistory: StockHistoryEntry[];
  cart: CartItem[];
  notifications: Notification[];
  isAdmin: boolean;
  currentUser: User | null;
  justActivated: boolean;
  activeSessionUser: SelectedUser | null;
  isAuthLoading: boolean;

  // Derived State
  cartCount: number;
  cartTotal: number;
  cartTokenTotal: number;
  subscriptionPlan: SubscriptionPlan;
  labels: AppLabels; // Dynamic vocabulary

  // Methods
  addProduct: (productData: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  setSettings: (settings: Settings | ((s: Settings) => Settings)) => void;
  addToCart: (product: Product) => void;
  addMiscSaleToCart: (price: number, name: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  processSale: (paymentMethod: 'cash' | 'card' | 'token' | 'check' | 'paypal' | 'wero', customerName?: string) => SaleRecord;
  deleteSale: (saleId: string) => void;
  addDonation: (amount: number, name?: string, note?: string, method?: 'cash' | 'card') => void;
  addManualRefund: (amount: number, reason: string) => void;
  addSafeDeposit: (amount: number, note?: string) => void;
  addCashOut: (amount: number, reason: string, receiptImage: Blob | string | null) => void;
  startNewEvent: () => void;
  addStockHistoryEntry: (entry: Omit<StockHistoryEntry, 'id' | 'date'>) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  removeNotification: (id: number) => void;
  activateApp: (key: string) => Promise<{ success: boolean; message?: string }>;
  startTrial: () => void;
  clearJustActivatedFlag: () => void;
  
  // Auth methods (now using Firebase)
  registerUser: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => void;
  changeAdminPassword: (password: string) => void;
  restoreUserData: (data: UserData) => boolean;
  
  // Session methods
  loginAdmin: (password: string) => { success: boolean, message: string };
  loginTeamMember: (userId: string, pin: string) => { success: boolean, message: string };
  logoutSession: () => void;

  // Team management methods
  addTeamMember: (name: string, pin: string) => void;
  updateTeamMember: (id: string, name: string, pin?: string) => void;
  deleteTeamMember: (id: string) => void;
}

// Create the context
const BuvetteContext = createContext<BuvetteContextType | undefined>(undefined);

// Provider component
export const BuvetteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- AUTHENTICATION STATE (Firebase-driven) ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- USER-SPECIFIC DATA STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [manualRefunds, setManualRefunds] = useState<ManualRefund[]>([]);
  const [safeDeposits, setSafeDeposits] = useState<SafeDepositRecord[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);
  const [cashOuts, setCashOuts] = useState<CashOutRecord[]>([]);

  // --- SESSION-ONLY STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // Session-based admin status
  const [activeSessionUser, setActiveSessionUser] = useState<SelectedUser | null>(null);
  
  const [justActivated, setJustActivated] = useLocalStorage('buv-justActivated', false);
  
  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [...prev, newNotification]);
  }, []);
  
  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthChange(firebaseUser => {
        if (firebaseUser) {
            setCurrentUser({ id: firebaseUser.uid, email: firebaseUser.email });
        } else {
            setCurrentUser(null);
        }
        if (!firebaseUser) {
             setIsAuthLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  // --- DATA PERSISTENCE (IndexedDB) ---
  useEffect(() => {
    const initializeData = async () => {
      if (currentUser) {
        try {
          let data = await loadUserData(currentUser.id) as UserData | null;

          // Migration from LocalStorage if IndexedDB is empty
          if (!data) {
              const localStorageKey = `buv-data-${currentUser.id}`;
              const storedData = localStorage.getItem(localStorageKey);
              if (storedData) {
                  try {
                      data = JSON.parse(storedData);
                      if (data) {
                          await saveUserData(currentUser.id, data);
                      }
                  } catch (e) {
                      console.error("Migration from LocalStorage failed", e);
                  }
              }
          }

          if (data) {
              setProducts(data.products || []);
              // Ensure categories array exists for migrated data
              const migratedSettings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS;
                  // If hourlyRate not present in migrated settings, try reading from legacy localStorage key
                  try {
                      if (migratedSettings.hourlyRate === undefined || migratedSettings.hourlyRate === null) {
                          const ls = localStorage.getItem('buvette-hourlyRate');
                          if (ls) {
                              const parsed = parseFloat(ls);
                              if (!isNaN(parsed)) migratedSettings.hourlyRate = parsed;
                          }
                      }
                  } catch (e) {
                      // ignore localStorage read errors
                  }
              if (!migratedSettings.categories || migratedSettings.categories.length === 0) {
                  migratedSettings.categories = DEFAULT_SETTINGS.categories;
              }
              setSettings(migratedSettings);
              setSales(data.sales || []);
              setDonations(data.donations || []);
              setManualRefunds(data.manualRefunds || []);
              setSafeDeposits(data.safeDeposits || []);
              setStockHistory(data.stockHistory || []);
              setCashOuts(data.cashOuts || []);
          } else {
              setProducts([]);
              setSettings(DEFAULT_SETTINGS);
              setSales([]);
              setDonations([]);
              setManualRefunds([]);
              setSafeDeposits([]);
              setStockHistory([]);
              setCashOuts([]);
          }
        } catch (error) {
          console.error("Failed to load user data from IndexedDB.", error);
          showToast("Erreur de chargement des données locales.", "error");
        }
      } else {
        setProducts([]);
        setSettings(DEFAULT_SETTINGS);
        setSales([]);
        setDonations([]);
        setManualRefunds([]);
        setSafeDeposits([]);
        setStockHistory([]);
        setCashOuts([]);
        setIsAdmin(false);
        setActiveSessionUser(null);
      }
      setIsAuthLoading(false);
    };

    initializeData();
  }, [currentUser, showToast]);

  // Persist data whenever it changes
  useEffect(() => {
    if (currentUser && !isAuthLoading) {
      const persistData = async () => {
        try {
          const userData: UserData = { 
            products, 
            settings, 
            sales, 
            donations, 
            manualRefunds, 
            safeDeposits, 
            stockHistory, 
            cashOuts
          };
          
          await saveUserData(currentUser.id, userData);
        } catch (e) {
            console.error("Failed to save data to IndexedDB", e);
        }
      };
      
      const timeoutId = setTimeout(persistData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentUser, isAuthLoading, products, settings, sales, donations, manualRefunds, safeDeposits, stockHistory, cashOuts]);


  // --- Methods Implementation ---

  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...productData, id: crypto.randomUUID() };
    setProducts(prev => [...prev, newProduct]);
    if (newProduct.stock > 0) {
        const historyEntry: StockHistoryEntry = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            productId: newProduct.id,
            productName: newProduct.name,
            type: 'initial',
            quantityChange: newProduct.stock,
            newStock: newProduct.stock,
            note: 'Création du produit'
        };
        setStockHistory(prev => [...prev, historyEntry]);
    }
  }, []);

  const updateProduct = useCallback((product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);
  
  const addStockHistoryEntry = useCallback((entry: Omit<StockHistoryEntry, 'id' | 'date'>) => {
      const newEntry: StockHistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          date: new Date().toISOString()
      };
      setStockHistory(prev => [newEntry, ...prev]);
  }, []);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
        showToast("Produit en rupture de stock", "error");
        return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
          if (existing.quantity >= product.stock) {
              showToast("Stock insuffisant", "error");
              return prev;
          }
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [showToast]);

  const addMiscSaleToCart = useCallback((price: number, name: string) => {
      const miscItem: CartItem = {
          id: `misc-${Date.now()}`,
          name,
          price,
          quantity: 1,
          image: '🏷️',
          isMisc: true,
          category: 'Divers'
      };
      setCart(prev => [...prev, miscItem]);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const processSale = useCallback((paymentMethod: 'cash' | 'card' | 'token' | 'check' | 'paypal' | 'wero', customerName?: string) => {
      const total = cart.reduce((sum, item) => {
          const price = settings.tokenMode ? (item.tokenPrice || 0) : item.price;
          return sum + (price * item.quantity);
      }, 0);

      const sale: SaleRecord = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          items: [...cart],
          total,
          paymentMethod,
          customerName
      };

      setSales(prev => [sale, ...prev]);
      
      const productUpdates = new Map<string, number>();
      cart.forEach(item => {
          if (!item.isMisc) {
            productUpdates.set(item.id, item.quantity);
          }
      });

      setProducts(prev => prev.map(p => {
          const qtySold = productUpdates.get(p.id);
          if (qtySold) {
              const newStock = Math.max(0, p.stock - qtySold);
              const historyEntry: StockHistoryEntry = {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString(),
                  productId: p.id,
                  productName: p.name,
                  type: 'sale',
                  quantityChange: -qtySold,
                  newStock,
                  note: `Vente #${sale.id.slice(-6)}`
              };
              setStockHistory(prevHistory => [historyEntry, ...prevHistory]);
              return { ...p, stock: newStock };
          }
          return p;
      }));

      setCart([]);
      return sale;
  }, [cart, settings.tokenMode]);

  const deleteSale = useCallback((saleId: string) => {
      const saleToDelete = sales.find(s => s.id === saleId);
      if (!saleToDelete) return;

      // 1. Restaurer le stock
      const productUpdates = new Map<string, number>();
      saleToDelete.items.forEach(item => {
          if (!item.isMisc) {
              productUpdates.set(item.id, item.quantity);
          }
      });

      setProducts(prevProducts => prevProducts.map(p => {
          const qtyToRestore = productUpdates.get(p.id);
          if (qtyToRestore) {
              const newStock = p.stock + qtyToRestore;
              const historyEntry: StockHistoryEntry = {
                  id: crypto.randomUUID(),
                  date: new Date().toISOString(),
                  productId: p.id,
                  productName: p.name,
                  type: 'refund', // On utilise 'refund' pour l'historique lors d'une annulation
                  quantityChange: qtyToRestore,
                  newStock,
                  note: `Annulation vente #${saleToDelete.id.slice(-6)}`
              };
              setStockHistory(prevHistory => [historyEntry, ...prevHistory]);
              return { ...p, stock: newStock };
          }
          return p;
      }));

      // 2. Supprimer la vente de la liste
      setSales(prevSales => prevSales.filter(s => s.id !== saleId));
      showToast("Vente annulée et stock restauré.", "success");
  }, [sales, showToast]);

  const addDonation = useCallback((amount: number, name?: string, note?: string, method: 'cash' | 'card' = 'cash') => {
    const donation: DonationRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount,
      name: name || 'Anonyme',
      note,
      paymentMethod: method
    };
    setDonations(prev => [donation, ...prev]);
    showToast(`Don de ${amount}€ ajouté !`, "success");
  }, [showToast]);

    const addManualRefund = useCallback((amount: number, reason: string) => {
        const refund: ManualRefund = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount,
            reason
        };
        setManualRefunds(prev => [refund, ...prev]);
    }, []);

    const addSafeDeposit = useCallback((amount: number, note?: string) => {
        const deposit: SafeDepositRecord = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount,
            note
        };
        setSafeDeposits(prev => [deposit, ...prev]);
        showToast(`Dépôt au coffre de ${amount}€ enregistré.`, "success");
    }, [showToast]);

    const addCashOut = useCallback((amount: number, reason: string, receiptImage: Blob | string | null) => {
        const cashOut: CashOutRecord = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount,
            reason,
            receiptImage
        };
        setCashOuts(prev => [cashOut, ...prev]);
        showToast(`Sortie d'espèces de ${amount}€ enregistrée.`, "success");
    }, [showToast]);

  const startNewEvent = useCallback(() => {
    setSales([]);
    setDonations([]);
    setManualRefunds([]);
    setSafeDeposits([]);
    setStockHistory([]);
    setCashOuts([]);
    showToast("Nouvel événement démarré. Les historiques ont été réinitialisés.");
  }, [showToast]);

  // Auth Wrappers
  const registerUserWrapper = async (email: string, pass: string) => {
      return await signUp(email, pass);
  };
  
  const loginUserWrapper = async (email: string, pass: string) => {
      return await signIn(email, pass);
  };
  
  const logoutUserWrapper = () => {
      logOut();
      setActiveSessionUser(null);
      setIsAdmin(false);
  };
  
  const changeAdminPassword = useCallback((password: string) => {
      const hashed = simpleHash(password);
      setSettings(prev => ({ ...prev, adminPassword: hashed }));
  }, []);
  
  const restoreUserData = useCallback((data: UserData) => {
      if (!data || !data.settings) return false;
      try {
          setProducts(data.products || []);
          setSettings(data.settings);
          setSales(data.sales || []);
          setDonations(data.donations || []);
          setManualRefunds(data.manualRefunds || []);
          setSafeDeposits(data.safeDeposits || []);
          setStockHistory(data.stockHistory || []);
          setCashOuts(data.cashOuts || []);
          showToast("Données restaurées avec succès !", "success");
          return true;
      } catch (e) {
          return false;
      }
  }, [showToast]);
  
  // Session Logic
  const loginAdmin = useCallback((password: string) => {
      if (!settings.adminPassword) {
          if (password === 'admin') {
              setIsAdmin(true);
              setActiveSessionUser({ type: 'admin' });
              return { success: true, message: 'Bienvenue Admin' };
          }
      }
      if (verifyHash(password, settings.adminPassword || simpleHash('admin'))) {
          setIsAdmin(true);
           setActiveSessionUser({ type: 'admin' });
          return { success: true, message: 'Bienvenue Admin' };
      }
      return { success: false, message: 'Mot de passe incorrect' };
  }, [settings.adminPassword]);
  
  const loginTeamMember = useCallback((userId: string, pin: string) => {
      const member = settings.team.find(u => u.id === userId);
      if (!member) return { success: false, message: 'Utilisateur introuvable' };
      
      if (verifyHash(pin, member.pinHash)) {
          setIsAdmin(false);
          setActiveSessionUser({ type: 'team', user: member });
          return { success: true, message: `Bienvenue ${member.name}` };
      }
      return { success: false, message: 'Code PIN incorrect' };
  }, [settings.team]);
  
  const logoutSession = useCallback(() => {
      setIsAdmin(false);
      setActiveSessionUser(null);
  }, []);

  // Team Management
  const addTeamMember = useCallback((name: string, pin: string) => {
      const newMember: SubUser = {
          id: crypto.randomUUID(),
          name,
          role: UserRole.Seller,
          pinHash: simpleHash(pin)
      };
      setSettings(prev => ({ ...prev, team: [...prev.team, newMember] }));
      showToast(`Membre ${name} ajouté !`, "success");
  }, [showToast]);
  
  const updateTeamMember = useCallback((id: string, name: string, pin?: string) => {
      setSettings(prev => ({
          ...prev,
          team: prev.team.map(m => {
              if (m.id === id) {
                  return {
                      ...m,
                      name,
                      pinHash: pin ? simpleHash(pin) : m.pinHash
                  };
              }
              return m;
          })
      }));
      showToast(`Membre ${name} mis à jour !`, "success");
  }, [showToast]);
  
  const deleteTeamMember = useCallback((id: string) => {
      setSettings(prev => ({ ...prev, team: prev.team.filter(m => m.id !== id) }));
      showToast("Membre supprimé.", "success");
  }, [showToast]);
  
  // License Logic
  const activateApp = useCallback(async (key: string) => {
      if (!currentUser) return { success: false, message: "Vous devez être connecté pour activer une licence." };
      
      const result = await verifyAndActivateLicense(key, currentUser.id);
      
      if (result.success && result.plan && result.duration) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + result.duration);
          
          setSettings(prev => ({
              ...prev,
              subscriptionPlan: result.plan!,
              subscriptionExpiry: expiryDate.toISOString()
          }));
          setJustActivated(true);
          return { success: true };
      }
      return { success: false, message: result.message };
  }, [currentUser, setJustActivated]);
  
  const startTrial = useCallback(() => {
       const expiryDate = new Date();
       expiryDate.setDate(expiryDate.getDate() + 7);
       setSettings(prev => ({
           ...prev,
           subscriptionPlan: SubscriptionPlan.PRO,
           subscriptionExpiry: expiryDate.toISOString()
       }));
       setJustActivated(true);
  }, [setJustActivated]);
  
  const clearJustActivatedFlag = useCallback(() => {
      setJustActivated(false);
  }, [setJustActivated]);

  // Derived State
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTokenTotal = cart.reduce((sum, item) => sum + (item.tokenPrice || 0) * item.quantity, 0);
  
  const labels: AppLabels = useMemo(() => {
      const isAssoc = settings.appMode === 'association';
      return {
          buvette: isAssoc ? 'Buvette' : 'Boutique',
          team: isAssoc ? 'Bénévoles' : 'Équipe',
          donation: isAssoc ? 'Don' : 'Pourboire',
          event: isAssoc ? 'Événement' : 'Session',
          token: isAssoc ? 'Jeton' : 'Crédit'
      };
  }, [settings.appMode]);

  // Value object
  const value: BuvetteContextType = {
    products,
    settings,
    sales,
    donations,
    manualRefunds,
    safeDeposits,
    stockHistory,
    cart,
    cartCount,
    cartTotal,
    cartTokenTotal,
    notifications,
    cashOuts,
    isAdmin,
    currentUser,
    justActivated,
    subscriptionPlan: settings.subscriptionPlan,
    activeSessionUser,
    labels,
    isAuthLoading,

    addProduct,
    updateProduct,
    deleteProduct,
    setSettings,
    addToCart,
    addMiscSaleToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processSale,
    deleteSale,
    addDonation,
    addManualRefund,
    addSafeDeposit,
    addCashOut,
    startNewEvent,
    addStockHistoryEntry,
    showToast,
    removeNotification,
    activateApp,
    startTrial,
    clearJustActivatedFlag,
    
    registerUser: registerUserWrapper,
    loginUser: loginUserWrapper,
    logoutUser: logoutUserWrapper,
    changeAdminPassword,
    restoreUserData,
    
    loginAdmin,
    loginTeamMember,
    logoutSession,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember
  };

  return (
    <BuvetteContext.Provider value={value}>
      {children}
    </BuvetteContext.Provider>
  );
};

export const useBuvette = () => {
  const context = useContext(BuvetteContext);
  if (context === undefined) {
    throw new Error('useBuvette must be used within a BuvetteProvider');
  }
  return context;
};

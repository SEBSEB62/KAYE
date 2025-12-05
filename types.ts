
// Defines the main pages of the application for navigation
export enum Page {
    Home = 'home',
    Sale = 'sale',
    Cart = 'cart',
    Stock = 'stock',
    Stats = 'stats',
    More = 'more',
    Settings = 'settings',
    Donations = 'donations',
    Reset = 'reset',
    Ideas = 'ideas',
    Upgrade = 'upgrade',
    Backup = 'backup',
    Tutorial = 'tutorial',
    CashOut = 'cash-out',
    Team = 'team',
    TermsOfUse = 'terms-of-use',
}

// Defines subscription plans
export enum SubscriptionPlan {
    ESSENTIEL = 'Essentiel',
    STANDARD = 'Standard',
    PRO = 'Pro',
}

export enum UserRole {
    Admin = 'admin',
    Seller = 'seller',
}

export interface SubUser {
  id: string;
  name: string;
  role: UserRole;
  pinHash: string;
}

// Represents a user account (aligned with Firebase Auth user object)
export interface User {
  id: string; // This will be the Firebase UID
  email: string | null; // Firebase email can be null
}

// REMOVED: Enum ProductCategory is replaced by dynamic strings.
// We keep a type alias for clarity if needed, but it's just a string now.
export type CategoryName = string; 

// Represents a product in the inventory
export interface Product {
  id: string;
  name: string;
  price: number;
  tokenPrice?: number;
  purchasePrice?: number;
  stock: number;
  category: string; // Changed from Enum to string
  image: Blob | string; // Can be a Blob for uploaded images or a string for emojis
  packageUnit?: string;
  servingsPerPackage?: number;
  // Estimated labor time to produce one unit, in minutes. Optional for backward compatibility.
  laborTimeMinutes?: number;
}

// Represents an item within the shopping cart
export interface CartItem {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  tokenPrice?: number;
  quantity: number;
  image: Blob | string;
  isMisc?: boolean;
  category?: string; // Changed from Enum to string
}


// Represents a completed sale transaction
export interface SaleRecord {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'token' | 'check' | 'paypal' | 'wero';
  customerName?: string; // New field for CRM
  refunded?: boolean;
  refundDate?: string;
  refundReason?: string;
}

// Represents a donation
export interface DonationRecord {
  id: string;
  date: string; // ISO string;
  amount: number;
  name?: string;
  note?: string;
  paymentMethod: 'cash' | 'card';
}

// Represents a manual refund not tied to a specific sale
export interface ManualRefund {
    id:string;
    date: string; // ISO string;
    amount: number;
    reason: string;
}

// Represents a deposit of cash into a safe
export interface SafeDepositRecord {
    id: string;
    date: string; // ISO string;
    amount: number;
    note?: string;
}

// Represents a cash withdrawal from the register
export interface CashOutRecord {
    id: string;
    date: string; // ISO string
    amount: number;
    reason: string;
    receiptImage: Blob | string | null;
}

// Represents a stock movement (addition, sale, etc.)
export interface StockHistoryEntry {
    id: string;
    date: string; // ISO string
    productId: string;
    productName: string;
    type: 'add' | 'sale' | 'edit' | 'refund' | 'initial';
    quantityChange: number;
    newStock: number;
    note?: string;
}

export type AppFont = 'modern' | 'elegant' | 'handwritten';

// Application settings
export interface Settings {
    businessName: string;
    businessAddress: string;
    businessContact: string;
    receiptFooter: string;
    businessLogo: Blob | string | null;
    backgroundImage: Blob | string | null;
    backgroundOverlayOpacity: number;
    appFont: AppFont;
    startupGif: Blob | string | null;
    adminPassword?: string;
    initialCash: number;
    lowStockThreshold: number;
    tokenMode: boolean;
    appMode: 'association' | 'business';
    uiMode: 'carousel' | 'grid';
    subscriptionPlan: SubscriptionPlan;
    subscriptionExpiry: string | null; // ISO string date
    team: SubUser[];
    brandColor?: string;
    categories: string[]; // NEW: Dynamic categories list
    themeMode: 'light' | 'dark'; // NEW: Light/Dark mode
    // URSSAF estimation settings
    urssafActivity?: 'vente' | 'prestation';
    urssafRate?: number; // percent, e.g. 12.3
    // Target hourly rate for creator profitability calculations (€/hour)
    hourlyRate?: number;
}

// Enriched product data with sales metrics
export interface ProductMetrics extends Product {
    unitsSold: number;
    revenue: number;
    marginPerUnit: number;
    totalProfit: number;
}

// Represents a UI notification (toast)
export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// Type for user selection modal
export type SelectedUser = { type: 'admin' } | { type: 'team'; user: SubUser };

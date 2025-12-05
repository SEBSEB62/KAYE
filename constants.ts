import { HomeIcon, ShoppingCartIcon, ArchiveBoxIcon, ChartBarIcon, EllipsisHorizontalIcon } from './components/Icons';
import { Page } from './types';

export const NAV_ITEMS = [
    { page: Page.Home, label: 'Accueil', icon: HomeIcon },
    { page: Page.Sale, label: 'Vente', icon: ShoppingCartIcon },
    { page: Page.Stock, label: 'Stock', icon: ArchiveBoxIcon },
    { page: Page.Stats, label: 'Stats', icon: ChartBarIcon },
    { page: Page.More, label: 'Plus', icon: EllipsisHorizontalIcon },
];

export const PROTECTED_PAGES: Page[] = [
    Page.Stock,
    Page.Stats,
    Page.Settings,
    Page.Donations,
    Page.Reset,
    Page.Upgrade,
    Page.Backup,
    Page.CashOut,
    Page.Team,
];
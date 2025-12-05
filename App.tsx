
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Page } from './types';
import { useBuvette } from './hooks/useBuvette';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import ActivationPage from './pages/ActivationPage';
import SubscriptionBanner from './components/SubscriptionBanner';
import SplashScreen from './components/SplashScreen';
import AuthPage from './pages/AuthPage';
import UserSelectionPage from './pages/UserSelectionPage';
import ActivationSuccessPage from './pages/ActivationSuccessPage';
import SubscriptionExpiredPage from './pages/SubscriptionExpiredPage';
import StartupPage from './pages/StartupPage';
import { blobToDataURL } from './utils/image';

// Lazy load pages for better initial performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SalePage = lazy(() => import('./pages/SalePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const MorePage = lazy(() => import('./pages/MorePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DonationsPage = lazy(() => import('./pages/DonationsPage'));
const ResetPage = lazy(() => import('./pages/ResetPage'));
const IdeasPage = lazy(() => import('./pages/IdeasPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const BackupPage = lazy(() => import('./pages/BackupPage'));
const TutorialPage = lazy(() => import('./pages/TutorialPage'));
const CashOutPage = lazy(() => import('./pages/CashOutPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage'));

const PageLoader: React.FC = () => (
    <div className="flex h-screen w-screen items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const App: React.FC = () => {
    const { 
        currentUser,
        activeSessionUser,
        justActivated,
        settings,
        clearJustActivatedFlag,
        notifications,
        removeNotification,
        isAuthLoading,
    } = useBuvette();

    const [showSplash, setShowSplash] = useState(true);
    const [page, setPage] = useState<Page>(Page.Home);
    const [showStartup, setShowStartup] = useState(false);
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);

    // Effect to handle background image blob/url
    useEffect(() => {
        let active = true;
        const loadBg = async () => {
            if (settings.backgroundImage) {
                if (settings.backgroundImage instanceof Blob) {
                    const url = await blobToDataURL(settings.backgroundImage);
                    if (active) setBgImageUrl(url);
                } else if (typeof settings.backgroundImage === 'string') {
                    setBgImageUrl(settings.backgroundImage);
                }
            } else {
                setBgImageUrl(null);
            }
        };
        loadBg();
        return () => { active = false; };
    }, [settings.backgroundImage]);

    // --- Font Class Helper ---
    const getFontClass = () => {
        switch (settings.appFont) {
            case 'elegant': return 'font-display'; // Playfair Display
            case 'handwritten': return 'font-handwritten'; // Dancing Script
            default: return 'font-sans'; // Modern/Nunito
        }
    };

    // --- State-based Routing ---

    if (showSplash) {
        return <SplashScreen startupMedia={settings.startupGif} onComplete={() => setShowSplash(false)} />;
    }

    if (isAuthLoading) {
        return <PageLoader />; // Show loader while checking auth status
    }

    const isDarkMode = settings.themeMode === 'dark';

    // Dynamic styles for the root container
    const appStyles = {
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : isDarkMode 
            ? 'radial-gradient(circle at top, #1a1a1a 0%, #000 100%)' 
            : 'radial-gradient(circle at top, #f0f0f0 0%, #e2e8f0 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };

    // Overlay logic: Dark mode uses settings opacity (default 0.7), Light mode fixed at 0.4 (40%) to see image
    const overlayStyles = {
        backgroundColor: isDarkMode ? 'black' : 'white',
        opacity: isDarkMode ? (settings.backgroundOverlayOpacity ?? 0.7) : 0.4, 
    };

    const renderContent = () => {
        if (page === Page.TermsOfUse) {
            return <Suspense fallback={<PageLoader />}><TermsOfUsePage setPage={setPage} /></Suspense>;
        }

        if (justActivated) {
            return <ActivationSuccessPage setPage={() => clearJustActivatedFlag()} />;
        }

        const isFirstRun = !settings.subscriptionExpiry;
        const isSubscriptionExpired = settings.subscriptionExpiry && new Date(settings.subscriptionExpiry) < new Date();

        if (isFirstRun || isSubscriptionExpired) {
            if (!currentUser) {
                 if (!showStartup) {
                    return <StartupPage onStart={() => setShowStartup(true)} />;
                }
                return <AuthPage setPage={setPage} />;
            }
            if(isFirstRun) {
                return <ActivationPage isFirstRun={true} setPage={setPage} />;
            }
            if(isSubscriptionExpired) {
                return <SubscriptionExpiredPage />;
            }
        }

        if (!currentUser) {
            if (!showStartup) {
                return <StartupPage onStart={() => setShowStartup(true)} />;
            }
            return <AuthPage setPage={setPage} />;
        }

        if (!activeSessionUser) {
            return <UserSelectionPage />;
        }

        return (
            <>
                <div className={`flex-grow p-4 overflow-y-auto pb-24 ${settings.subscriptionExpiry && daysRemaining <= 7 && daysRemaining >= 0 ? 'pt-8' : ''}`}>
                    <Suspense fallback={<PageLoader />}>
                        {renderPage()}
                    </Suspense>
                </div>
                <BottomNav currentPage={page} setPage={setPage} />
            </>
        );
    };

    const renderPage = () => {
        switch (page) {
            case Page.Home: return <HomePage setPage={setPage} />;
            case Page.Sale: return <SalePage />;
            case Page.Cart: return <CartPage setPage={setPage} />;
            case Page.Stock: return <StockPage />;
            case Page.Stats: return <StatsPage setPage={setPage} />;
            case Page.More: return <MorePage setPage={setPage} />;
            case Page.Settings: return <SettingsPage setPage={setPage} />;
            case Page.Donations: return <DonationsPage />;
            case Page.Reset: return <ResetPage setPage={setPage} />;
            case Page.Ideas: return <IdeasPage />;
            case Page.Upgrade: return <UpgradePage />;
            case Page.Backup: return <BackupPage setPage={setPage} />;
            case Page.Tutorial: return <TutorialPage setPage={setPage} />;
            case Page.CashOut: return <CashOutPage setPage={setPage} />;
            case Page.Team: return <TeamPage setPage={setPage} />;
            default: return <HomePage setPage={setPage} />;
        }
    };

    const daysRemaining = settings.subscriptionExpiry ? Math.ceil((new Date(settings.subscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Use --primary variable for main color if needed in CSS
    const rootStyle = {
        '--primary': settings.brandColor || '#2563eb',
    } as React.CSSProperties;

    return (
        <div 
            className={`font-sans h-screen w-screen overflow-hidden flex flex-col transition-colors duration-500
            ${getFontClass()}-headings 
            ${isDarkMode ? 'dark text-slate-100' : 'text-slate-900'}
            `} 
            style={{...appStyles, ...rootStyle}}
        >
            {/* Dark/Light Overlay for Readability */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500" style={overlayStyles} />
            
            {/* Content Wrapper - Relative z-10 to sit above overlay */}
            <div className="relative z-10 flex flex-col h-full w-full">
                {settings.subscriptionExpiry && daysRemaining <= 7 && daysRemaining >= 0 && (
                    <SubscriptionBanner daysRemaining={daysRemaining} plan={settings.subscriptionPlan} />
                )}
                {renderContent()}
            </div>
            
            {/* Toast Container */}
            <div className="fixed bottom-24 right-0 p-4 z-[100] w-full max-w-md space-y-2 pointer-events-none">
                {notifications.map((n) => (
                    <Toast key={n.id} notification={n} onClose={removeNotification} />
                ))}
            </div>
        </div>
    );
};

export default App;

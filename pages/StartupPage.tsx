
import React, { useState, useEffect, memo } from 'react';
import { useBuvette } from '../hooks/useBuvette';

interface StartupPageProps {
  onStart: () => void;
}

export const BuvetteLogo: React.FC<{ className?: string }> = memo(({ className = "w-36 h-36" }) => (
    // Replaced SVG with the image logo as requested
    <img 
        src="/logo.png" 
        alt="KAYÉ Logo" 
        className={`${className} object-contain`} 
    />
));

export const AnimatedBackground: React.FC = memo(() => (
    <div className="absolute inset-0 overflow-hidden bg-transparent" aria-hidden="true">
        {/* Cercles décoratifs plus subtils pour ne pas jurer avec l'image de fond */}
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-orange-500/20 dark:bg-orange-500/10 rounded-full filter blur-3xl opacity-40 animate-pulse [animation-delay:-2s]"></div>
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/20 dark:bg-blue-400/10 rounded-full filter blur-3xl opacity-40 animate-pulse [animation-delay:-4s]"></div>
    </div>
));


const featureKeywords = ['VENTES', 'STOCKS', 'STATS', 'PROFITS'];

const StartupPage: React.FC<StartupPageProps> = ({ onStart }) => {
  const { settings } = useBuvette();
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [isKeywordVisible, setIsKeywordVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const mountTimeout = setTimeout(() => setIsMounted(true), 100);
    const interval = setInterval(() => {
      setIsKeywordVisible(false); // Commence à s'estomper
      setTimeout(() => {
        setKeywordIndex(prevIndex => (prevIndex + 1) % featureKeywords.length);
        setIsKeywordVisible(true); // Apparaît avec le nouveau mot
      }, 500); // Ce délai doit correspondre à la durée de la transition
    }, 2500); // Temps de cycle total : 500ms de transition + 2000ms visible
    return () => {
        clearTimeout(mountTimeout);
        clearInterval(interval);
    };
  }, []);

  const getTransitionClasses = (delay: string) => 
      `transition-all duration-700 ${delay} ${isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95'}`;

  // Police dynamique selon les paramètres
  const headingFontClass = settings.appFont === 'elegant' ? 'font-display' 
                           : settings.appFont === 'handwritten' ? 'font-handwritten' 
                           : 'font-sans';

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-center items-center p-4">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center text-center w-full h-full">
        <div className="flex-grow flex flex-col items-center justify-center">
           <div className={`mb-6 ${getTransitionClasses('delay-100')}`}>
                <BuvetteLogo />
           </div>
          <div className={getTransitionClasses('delay-300')}>
            {/* TEXTE KAYÉ : Noir en mode clair, Blanc en mode sombre */}
            <h2 className={`text-6xl md:text-7xl ${headingFontClass} text-slate-900 dark:text-white drop-shadow-lg`}>
               KAYÉ
            </h2>
            <div className="mt-2 text-lg h-8 text-slate-600 dark:text-slate-300 flex items-center justify-center font-semibold tracking-widest">
                <div
                    className={`transition-opacity duration-500 ease-in-out ${isKeywordVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    {featureKeywords[keywordIndex]}
                </div>
            </div>
          </div>
        </div>

        <div className={`flex-shrink-0 w-full max-w-md mx-auto mb-16 ${getTransitionClasses('delay-500')}`}>
          <button
            onClick={onStart}
            className="w-full bg-orange-500 text-black font-bold py-4 px-8 rounded-full shadow-lg text-2xl font-display
                       shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:bg-orange-600 transform hover:scale-105 transition-all duration-300
                       relative overflow-hidden group"
          >
            <span className="relative z-10">Démarrer</span>
            <span className="absolute top-0 left-[-100%] w-full h-full bg-white/20 skew-x-[-20deg] transition-all duration-700 group-hover:left-[150%]"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(StartupPage);

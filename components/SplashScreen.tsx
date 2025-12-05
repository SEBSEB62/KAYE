import React, { useEffect, memo, useState } from 'react';
import { BuvetteLogo, AnimatedBackground } from '../pages/StartupPage';
import ProductImage from './ProductImage';

interface SplashScreenProps {
  startupMedia: Blob | string | null;
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ startupMedia, onComplete }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setIsMounted(true), 100);
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500); // 2.5 seconds duration

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(completeTimer);
    }
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[200]"
      aria-label="Écran de démarrage de Buvette+"
      role="alert"
      aria-busy="true"
    >
      <AnimatedBackground />
      <div className={`relative z-10 transition-all duration-1000 ease-out ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        {startupMedia ? (
            <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20 border-2 border-amber-500/30 bg-black/20">
                <ProductImage 
                    image={startupMedia} 
                    alt="Média de démarrage" 
                    className="w-full h-full object-contain" 
                />
            </div>
        ) : (
            <BuvetteLogo />
        )}
      </div>
    </div>
  );
};

export default memo(SplashScreen);
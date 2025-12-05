import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Notification } from '../types';

interface ToastProps {
  notification: Notification;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const { id, message, type } = notification;
  const [isExiting, setIsExiting] = useState(false);

  const DURATION_SUCCESS = 3000;
  const DURATION_ERROR = 5000;
  const ANIMATION_DURATION = 300;

  const timerRef = useRef<number | null>(null);
  const remainingTimeRef = useRef<number>(type === 'success' ? DURATION_SUCCESS : DURATION_ERROR);
  const startTimeRef = useRef<number>(Date.now());

  const handleClose = useCallback(() => {
    setIsExiting(true);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsedTime = Date.now() - startTimeRef.current;
      remainingTimeRef.current -= elapsedTime;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = window.setTimeout(handleClose, remainingTimeRef.current);
  }, [handleClose]);

  // Start timer on mount
  useEffect(() => {
    resumeTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resumeTimer]);

  // Trigger onClose after exit animation
  useEffect(() => {
    if (isExiting) {
      const exitTimer = setTimeout(() => {
        onClose(id);
      }, ANIMATION_DURATION);
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting, onClose, id]);

  const baseClasses = 'pointer-events-auto w-full max-w-md px-4 py-3 text-white rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 border backdrop-blur-md';

  let typeClasses = '';
  let icon: React.ReactNode;
  
  switch (type) {
    case 'success':
      typeClasses = 'bg-emerald-800/80 border-emerald-500';
      icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      break;
    case 'error':
      typeClasses = 'bg-red-800/80 border-red-500';
      icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      break;
  }

  const animationClasses = isExiting ? 'animate-out fade-out slide-out-to-bottom' : 'animate-in fade-in slide-in-from-bottom-10';
  const role = type === 'success' ? 'status' : 'alert';
  const ariaLive = type === 'success' ? 'polite' : 'assertive';

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      className={`${baseClasses} ${typeClasses} ${animationClasses}`}
      role={role}
      aria-live={ariaLive}
    >
      <span className="flex-shrink-0">{icon}</span>
      <p className="font-semibold text-slate-100 text-sm text-center flex-grow">{message}</p>
      <button onClick={handleClose} aria-label="Fermer la notification" className="ml-2 text-2xl leading-none opacity-70 hover:opacity-100 flex-shrink-0">&times;</button>
    </div>
  );
};

export default memo(Toast);

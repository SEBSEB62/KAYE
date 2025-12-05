import React, { ReactNode, useEffect, useId, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);

  // Effet pour gérer le focus trap et la touche "Échap"
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      
      if (event.key === 'Tab') {
          // Si aucun élément n'est focusable, on empêche de sortir
          if (focusableElements.length === 0) {
              event.preventDefault();
              return;
          }
          if (event.shiftKey) { // Shift + Tab
              if (document.activeElement === firstElement) {
                  lastElement.focus();
                  event.preventDefault();
              }
          } else { // Tab
              if (document.activeElement === lastElement) {
                  firstElement.focus();
                  event.preventDefault();
              }
          }
      }
    };
    
    // Un court délai pour s'assurer que la modale est entièrement rendue avant de focus
    const focusTimeout = setTimeout(() => {
        firstElement?.focus();
    }, 100);
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // Gère le clic en dehors du contenu de la modale pour la fermer
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
      // S'assure que le clic est sur le fond et non sur un enfant
      if (event.target === event.currentTarget) {
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
    >
      <div 
        ref={modalRef}
        className="bg-[#2a2a2a]/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95 flex flex-col max-h-[85vh] border border-amber-500/30"
      >
        
        <div className="flex-shrink-0 px-6 pt-6 pb-4 flex justify-between items-center border-b border-white/10">
          <h2 id={titleId} className="text-xl font-display text-amber-400">{title}</h2>
          <button onClick={onClose} aria-label="Fermer la modale" className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-4">
            {children}
        </div>

      </div>
    </div>
  );
};

export default React.memo(Modal);
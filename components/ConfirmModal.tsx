import React from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer' }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <p className="text-slate-300 mb-6 text-lg">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-slate-700 transition-colors font-display text-lg"
            autoFocus
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-red-700 transition-colors font-display text-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(ConfirmModal);
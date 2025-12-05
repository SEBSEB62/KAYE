import React from 'react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onDone?: () => void;
}

const KeypadButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-[#2a2a2a] text-white font-bold text-2xl rounded-lg h-14 flex items-center justify-center
                hover:bg-[#3a3a3a] active:bg-[#4a4a4a] transition-all duration-150 shadow-sm border border-white/10 ${className}`}
  >
    {children}
  </button>
);

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, onDelete, onDone }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="bg-black/20 p-4 rounded-xl shadow-inner mt-4">
      <div className="grid grid-cols-3 gap-2">
        {keys.map(key => (
          <KeypadButton key={key} onClick={() => onKeyPress(key)}>
            {key}
          </KeypadButton>
        ))}
        <KeypadButton onClick={onDelete}>
          ⌫
        </KeypadButton>
      </div>
       {onDone && (
         <button
          type="button"
          onClick={onDone}
          className="w-full mt-3 bg-amber-500 text-black font-bold py-3 rounded-lg shadow-lg hover:bg-amber-600 transition-all font-display text-lg"
        >
          OK
        </button>
       )}
    </div>
  );
};

export default React.memo(NumericKeypad);
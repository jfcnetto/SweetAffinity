import React, { useState, useEffect } from 'react';
import { Button } from '../design-system/components/Button';
import { Shield } from 'lucide-react';
import { toast } from '../design-system/components/Toast';

interface PinLockOverlayProps {
  onUnlock: () => void;
  savedPin: string;
}

export const PinLockOverlay: React.FC<PinLockOverlayProps> = ({ onUnlock, savedPin }) => {
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === savedPin) {
        toast.success('Acesso liberado!');
        onUnlock();
      } else {
        toast.error('PIN incorreto. Tente novamente.');
        setPin('');
      }
    }
  }, [pin, savedPin, onUnlock]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white select-none">
      <div className="flex flex-col items-center max-w-xs text-center px-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Modo Discrição Ativo</h2>
        <p className="text-gray-400 text-xs mb-8">Insira o seu PIN de 4 dígitos para desbloquear o aplicativo.</p>

        {/* Display do PIN */}
        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 border-slate-700 transition-all duration-150 ${
                pin.length > index ? 'bg-gradient-to-r from-gradient-pink to-gradient-orange border-transparent scale-110' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center text-xl font-bold font-sans mx-auto"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full hover:text-red-400 flex items-center justify-center text-xs font-semibold uppercase mx-auto"
          >
            Limpar
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center text-xl font-bold font-sans mx-auto"
          >
            0
          </button>
          <div className="w-16 h-16" />
        </div>
      </div>
    </div>
  );
};

export default PinLockOverlay;

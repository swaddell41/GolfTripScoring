import { useState } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  doubleConfirm?: boolean;
  secondMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  doubleConfirm = false,
  secondMessage,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [step, setStep] = useState(1);

  const handleConfirm = () => {
    if (doubleConfirm && step === 1) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-sm mb-6">
          {step === 2 && secondMessage ? secondMessage : message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-slate-300
              font-medium text-sm active:bg-slate-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white
              font-medium text-sm active:bg-red-700 transition-colors"
          >
            {step === 2 ? 'Yes, I\'m sure' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

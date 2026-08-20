import React, { createContext, useContext, useState, useCallback } from 'react';

// ===== BUTTON =====
export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    isLoading?: boolean;
    size?: 'sm' | 'md';
  }
> = ({ variant = 'primary', isLoading, size = 'md', children, className = '', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Cargando...' : children}
    </button>
  );
};

// ===== INPUT =====
export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
> = ({ label, error, className = '', ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

// ===== SELECT =====
export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: { value: string; label: string }[];
  }
> = ({ label, options, className = '', ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ===== CHECKBOX =====
export const Checkbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

// ===== CARD =====
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`bg-white rounded-lg shadow p-6 ${className}`}>{children}</div>;

// ===== MODAL =====
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ===== CONFIRM MODAL =====
export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{message}</p>
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
        Confirmar
      </Button>
    </div>
  </Modal>
);

// ===== TOAST =====
interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const ToastContext = createContext<
  { addToast: (type: 'success' | 'error', message: string) => void } | undefined
>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow text-sm text-white ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};
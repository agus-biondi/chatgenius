import React, { memo, useCallback, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TerminalContainer } from './TerminalContainer';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const TerminalModalBase: React.FC<TerminalModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div ref={modalRef} className={`relative max-w-lg w-full mx-4 ${className}`}>
        <TerminalContainer>
          <div className="flex justify-between items-center mb-4">
            <h2 className="terminal-heading">{title}</h2>
            <button 
              onClick={onClose}
              className="text-[var(--terminal-gray)] hover:text-[var(--terminal-green)] transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {children}
          </div>
        </TerminalContainer>
      </div>
    </div>
  );
};

export const TerminalModal = memo(TerminalModalBase); 
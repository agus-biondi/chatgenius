import { useState, useCallback, useRef } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  // Store the callbacks in refs to ensure they're stable
  const callbacks = useRef({
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    toggleModal: () => setIsOpen(prev => !prev)
  }).current;

  return {
    isOpen,
    ...callbacks
  };
}; 
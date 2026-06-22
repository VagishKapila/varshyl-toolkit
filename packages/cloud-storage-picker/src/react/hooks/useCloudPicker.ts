import { useCallback, useState } from 'react';

export interface UseCloudPickerReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useCloudPicker(): UseCloudPickerReturn {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}

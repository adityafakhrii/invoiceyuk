import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Formats a number with dot thousand separators (Indonesian style)
 */
const formatWithDots = (num: number): string => {
  if (num === 0) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parses a dot-separated string back to a number
 */
const parseFromDots = (str: string): number => {
  const cleaned = str.replace(/\./g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className,
  disabled,
  id,
}) => {
  const [displayValue, setDisplayValue] = useState(() => formatWithDots(value));

  // Sync display when value changes externally
  useEffect(() => {
    setDisplayValue(formatWithDots(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and dots (dots are for formatting)
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    setDisplayValue(formatWithDots(num));
    onChange(num);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      className={cn('[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none', className)}
      disabled={disabled}
    />
  );
};

export default CurrencyInput;

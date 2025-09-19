'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface HoursInputProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

export default function HoursInput({ 
  value, 
  onChange, 
  placeholder = "اختر عدد الساعات", 
  className 
}: HoursInputProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customHours, setCustomHours] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Initialize state based on the value prop
  useEffect(() => {
    if (value === undefined || value === '') {
      setSelectedOption('');
      setCustomHours('');
      setShowCustomInput(false);
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (numValue >= 1 && numValue <= 10 && Number.isInteger(numValue)) {
        setSelectedOption(numValue.toString());
        setCustomHours('');
        setShowCustomInput(false);
      } else {
        setSelectedOption('more');
        setCustomHours(numValue.toString());
        setShowCustomInput(true);
      }
    }
  }, [value]);

  const handleSelectChange = (selectedValue: string) => {
    setSelectedOption(selectedValue);
    
    if (selectedValue === 'more') {
      setShowCustomInput(true);
      // Don't call onChange yet, wait for custom input
    } else {
      setShowCustomInput(false);
      setCustomHours('');
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomHours(inputValue);
    
    // Only call onChange if it's a valid number
    if (inputValue === '') {
      onChange('');
    } else {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue) && numValue > 0) {
        onChange(numValue);
      }
    }
  };

  const handleCustomInputBlur = () => {
    // Validate and clean up the input on blur
    if (customHours !== '') {
      const numValue = parseFloat(customHours);
      if (isNaN(numValue) || numValue <= 0) {
        setCustomHours('');
        onChange('');
      } else {
        setCustomHours(numValue.toString());
        onChange(numValue);
      }
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={selectedOption} onValueChange={handleSelectChange} dir="rtl">
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((hour) => (
            <SelectItem key={hour} value={hour.toString()}>
              {hour} ساعة
            </SelectItem>
          ))}
          <SelectItem value="more">أكثر...</SelectItem>
        </SelectContent>
      </Select>
      
      {showCustomInput && (
        <Input
          type="number"
          step="0.5"
          min="0.5"
          max="100"
          value={customHours}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          onBlur={handleCustomInputBlur}
          placeholder="عدد الساعات"
          className="flex-1"
        />
      )}
    </div>
  );
}

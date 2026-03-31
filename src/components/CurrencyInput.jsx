import React, { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onChange, placeholder, style, readOnly, disabled, required }) {
  const [displayValue, setDisplayValue] = useState('');

  // Convert raw number -> formatted string (e.g. 1500000 -> "1.500.000")
  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const numericStr = String(val).replace(/[^0-9]/g, '');
    if (!numericStr) return '';
    return parseInt(numericStr, 10).toLocaleString('vi-VN');
  };

  useEffect(() => {
    // Only update display state if it diverges from raw value (avoid cursor jumping)
    const currentNumericStr = displayValue.replace(/[^0-9]/g, '');
    const parentNumericStr = String(value || '').replace(/[^0-9]/g, '');
    
    if (currentNumericStr !== parentNumericStr) {
       setDisplayValue(formatCurrency(value));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    let inputVal = e.target.value;
    
    // Remove all non-digits
    let numericString = inputVal.replace(/[^0-9]/g, '');

    if (!numericString) {
      setDisplayValue('');
      onChange('');
      return;
    }

    const num = parseInt(numericString, 10);
    setDisplayValue(num.toLocaleString('vi-VN'));
    onChange(num); 
  };

  return (
    <input
      type="text"
      className="form-input"
      style={style}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      readOnly={readOnly}
      disabled={disabled}
      required={required}
    />
  );
}

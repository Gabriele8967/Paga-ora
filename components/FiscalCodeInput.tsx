'use client';

import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { validateFiscalCodeRealtime, formatFiscalCode } from '@/lib/fiscal-code-validator';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface FiscalCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
}

export function FiscalCodeInput({ value, onChange, name = 'fiscalCode', required = true }: FiscalCodeInputProps) {
  const [validation, setValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value) {
      const result = validateFiscalCodeRealtime(value);
      setValidation(result);
    } else {
      setValidation({ valid: true });
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFiscalCode(e.target.value);
    onChange(formatted);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const showValidation = touched && value.length > 0;

  return (
    <div>
      <Label htmlFor={name}>
        Codice Fiscale {required && '*'}
      </Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          placeholder="RSSMRA80A01H501Z"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={16}
          required={required}
          className={`pr-10 ${
            showValidation
              ? validation.valid
                ? 'border-green-500 focus:border-green-600 focus:ring-green-100'
                : 'border-red-500 focus:border-red-600 focus:ring-red-100'
              : ''
          }`}
        />
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validation.valid ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
        )}
      </div>
      {showValidation && validation.message && (
        <div className={`mt-2 flex items-start space-x-2 text-sm ${
          validation.valid ? 'text-green-700' : 'text-red-700'
        }`}>
          {validation.valid ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{validation.message}</span>
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Il codice fiscale verrà verificato con i tuoi dati anagrafici
      </p>
    </div>
  );
}

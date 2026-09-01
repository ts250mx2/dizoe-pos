'use client';

import { useEffect, useState } from 'react';
import styles from './CountryPhoneInput.module.css';

const COUNTRIES = [
  { iso: 'MX', name: 'México', flag: '🇲🇽', code: '+52' },
  { iso: 'US', name: 'Estados Unidos', flag: '🇺🇸', code: '+1' },
  { iso: 'CA', name: 'Canadá', flag: '🇨🇦', code: '+1' },
  { iso: 'GT', name: 'Guatemala', flag: '🇬🇹', code: '+502' },
  { iso: 'BZ', name: 'Belice', flag: '🇧🇿', code: '+501' },
  { iso: 'SV', name: 'El Salvador', flag: '🇸🇻', code: '+503' },
  { iso: 'HN', name: 'Honduras', flag: '🇭🇳', code: '+504' },
  { iso: 'NI', name: 'Nicaragua', flag: '🇳🇮', code: '+505' },
  { iso: 'CR', name: 'Costa Rica', flag: '🇨🇷', code: '+506' },
  { iso: 'PA', name: 'Panamá', flag: '🇵🇦', code: '+507' },
  { iso: 'CO', name: 'Colombia', flag: '🇨🇴', code: '+57' },
  { iso: 'VE', name: 'Venezuela', flag: '🇻🇪', code: '+58' },
  { iso: 'EC', name: 'Ecuador', flag: '🇪🇨', code: '+593' },
  { iso: 'PE', name: 'Perú', flag: '🇵🇪', code: '+51' },
  { iso: 'CL', name: 'Chile', flag: '🇨🇱', code: '+56' },
  { iso: 'AR', name: 'Argentina', flag: '🇦🇷', code: '+54' },
  { iso: 'BR', name: 'Brasil', flag: '🇧🇷', code: '+55' },
  { iso: 'ES', name: 'España', flag: '🇪🇸', code: '+34' },
] as const;

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  tone?: 'app' | 'light';
  className?: string;
}

function parseValue(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!value.trim().startsWith('+')) return { iso: 'MX', code: '+52', national: digits };
  const match = [...COUNTRIES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((country) => digits.startsWith(country.code.slice(1)));
  const country = match || COUNTRIES[0];
  return { iso: country.iso, code: country.code, national: digits.slice(country.code.length - 1) };
}

export default function CountryPhoneInput({ value, onChange, required, autoFocus, tone = 'app', className = '' }: Props) {
  const initial = parseValue(value);
  const [iso, setIso] = useState<string>(initial.iso);
  const [national, setNational] = useState(initial.national);

  useEffect(() => {
    const parsed = parseValue(value);
    const currentCountry = COUNTRIES.find((country) => country.iso === iso) || COUNTRIES[0];
    if (`${currentCountry.code}${national}` !== value) {
      setIso(parsed.iso);
      setNational(parsed.national);
    }
  }, [value, iso, national]);

  const country = COUNTRIES.find((item) => item.iso === iso) || COUNTRIES[0];
  const emit = (nextIso: string, nextNational: string) => {
    const nextCountry = COUNTRIES.find((item) => item.iso === nextIso) || COUNTRIES[0];
    onChange(nextNational ? `${nextCountry.code}${nextNational}` : '');
  };

  return (
    <div className={`${styles.field} ${tone === 'light' ? styles.light : ''} ${className}`}>
      <select
        value={iso}
        onChange={(event) => {
          const nextIso = event.target.value;
          setIso(nextIso);
          emit(nextIso, national);
        }}
        aria-label="Lada de país"
        title={`${country.name} ${country.code}`}
      >
        {COUNTRIES.map((item) => (
          <option key={item.iso} value={item.iso}>{item.flag} {item.code} · {item.name}</option>
        ))}
      </select>
      <span className={styles.code}>{country.flag} {country.code}</span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="Número de teléfono"
        value={national}
        onChange={(event) => {
          const nextNational = event.target.value.replace(/\D/g, '').slice(0, 15);
          setNational(nextNational);
          emit(iso, nextNational);
        }}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  );
}

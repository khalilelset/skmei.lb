'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
  type Country,
} from 'react-phone-number-input';
import { validatePhoneNumberLength } from 'libphonenumber-js/max';
import en from 'react-phone-number-input/locale/en.json';
import * as Flags from 'country-flag-icons/react/3x2';
import { ChevronDown, Search, Check, CheckCircle2, XCircle } from 'lucide-react';

const ALL_COUNTRIES = getCountries();
const POPULAR: Country[] = ['LB', 'AE', 'SA', 'SY', 'JO', 'EG', 'TR', 'US', 'GB', 'FR'];

function Flag({ country, className }: { country: Country; className?: string }) {
  const FlagSvg = Flags[country as keyof typeof Flags] as React.ComponentType<{ className?: string }> | undefined;
  if (!FlagSvg) return <span className="text-xs font-bold">{country}</span>;
  return <FlagSvg className={className ?? 'w-5 h-3.5'} />;
}

type InlineState = 'idle' | 'valid' | 'invalid' | 'too-short' | 'too-long';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  variant?: 'dark' | 'light';
  placeholder?: string;
  onBlur?: () => void;
  disabled?: boolean;
}

export default function PhoneInputField({
  value,
  onChange,
  error,
  variant = 'dark',
  placeholder,
  onBlur,
  disabled,
}: PhoneInputFieldProps) {
  const [country, setCountry] = useState<Country>('LB');
  const [localNum, setLocalNum] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [inlineState, setInlineState] = useState<InlineState>('idle');
  const [hasBlurred, setHasBlurred] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Track last value we internally produced so we can detect external changes
  const lastInternalValue = useRef<string>('');
  const dark = variant === 'dark';

  // Sync internal state when value prop changes externally (e.g. from lookupByPhone)
  useEffect(() => {
    if (!value || value === lastInternalValue.current) return;
    if (!value.startsWith('+')) return;
    try {
      const parsed = parsePhoneNumber(value);
      if (parsed?.country) setCountry(parsed.country);
      if (parsed?.nationalNumber) setLocalNum(parsed.nationalNumber);
      lastInternalValue.current = value;
    } catch { /* ignore */ }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const buildE164 = useCallback((c: Country, num: string) => {
    const digits = num.replace(/\D/g, '');
    return digits ? `+${getCountryCallingCode(c)}${digits}` : '';
  }, []);

  // Compute validation state for given country + local number
  // blurred = show all errors; !blurred = only show too-long and valid
  const computeInline = useCallback(
    (c: Country, num: string, blurred: boolean): InlineState => {
      const digits = num.replace(/\D/g, '');
      if (!digits) return 'idle';

      const e164 = `+${getCountryCallingCode(c)}${digits}`;
      const lengthResult = validatePhoneNumberLength(e164);

      if (lengthResult === 'TOO_LONG') return 'too-long';   // always show
      if (isValidPhoneNumber(e164)) return 'valid';          // always show

      // Below: only reveal after blur so we don't interrupt mid-typing
      if (!blurred) return 'idle';
      if (lengthResult === 'TOO_SHORT') return 'too-short';
      return 'invalid';
    },
    [],
  );

  const handleNumChange = (raw: string) => {
    // Strip letters — allow digits and basic formatting chars only
    const filtered = raw.replace(/[^\d\s\-().+]/g, '');
    setLocalNum(filtered);
    const e164 = buildE164(country, filtered);
    lastInternalValue.current = e164;
    onChange(e164);
    setInlineState(computeInline(country, filtered, hasBlurred));
  };

  const handleBlur = () => {
    setHasBlurred(true);
    setInlineState(computeInline(country, localNum, true));
    onBlur?.();
  };

  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch('');
    const e164 = buildE164(c, localNum);
    lastInternalValue.current = e164;
    onChange(e164);
    setInlineState(computeInline(c, localNum, hasBlurred));
  };

  // Filter + sort countries
  const q = search.trim().toLowerCase();
  const filtered = q
    ? ALL_COUNTRIES.filter((c) => {
        const name = (en as Record<string, string>)[c] ?? c;
        return name.toLowerCase().includes(q) || getCountryCallingCode(c).includes(q);
      })
    : ALL_COUNTRIES;

  const popularFiltered = POPULAR.filter((c) => filtered.includes(c));
  const restFiltered = filtered.filter((c) => !POPULAR.includes(c));
  const dialCode = getCountryCallingCode(country);
  const countryName = (en as Record<string, string>)[country] ?? country;

  // ── Inline message ────────────────────────────────────────────────────────
  const inlineMsg: string | null =
    inlineState === 'too-short' ? `Number too short for ${countryName}` :
    inlineState === 'too-long'  ? `Too many digits for ${countryName}` :
    inlineState === 'invalid'   ? `Invalid number for ${countryName}` :
    null;

  const hasError = inlineState === 'invalid' || inlineState === 'too-short' || inlineState === 'too-long';

  // ── Border colour ─────────────────────────────────────────────────────────
  const borderCls = error
    ? 'border-red-500'
    : inlineState === 'valid'
    ? (dark ? 'border-green-500/60' : 'border-green-500')
    : hasError
    ? 'border-orange-400'
    : dark
    ? 'border-white/12 focus-within:border-brand-red'
    : 'border-gray-200 focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/10';

  const wrapCls = `flex rounded-xl overflow-visible border transition-all ${borderCls}`;

  const triggerCls = [
    'flex items-center gap-2 px-3 py-3 cursor-pointer select-none shrink-0 border-r transition-colors rounded-l-xl',
    dark ? 'bg-white/8 border-white/10 hover:bg-white/14' : 'bg-gray-100 border-gray-200 hover:bg-gray-200',
    disabled ? 'pointer-events-none opacity-50' : '',
  ].join(' ');

  const inputCls = [
    'flex-1 px-3 py-3 focus:outline-none text-sm min-w-0 pr-9',
    dark ? 'bg-white/6 text-white placeholder-white/25' : 'bg-gray-50 text-brand-black placeholder:text-gray-400 focus:bg-white',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ');

  const dropdownCls = [
    'absolute top-full left-0 z-[999] mt-1.5 w-72 rounded-xl shadow-2xl border overflow-hidden',
    dark ? 'bg-[#1c1c1c] border-white/10' : 'bg-white border-gray-200 shadow-gray-200',
  ].join(' ');

  const searchWrapCls = `flex items-center gap-2 px-3 py-2.5 border-b ${dark ? 'border-white/10' : 'border-gray-100'}`;
  const sectionLabelCls = `px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-white/25' : 'text-gray-400'}`;
  const dividerCls = dark ? 'border-white/8' : 'border-gray-100';

  const optionCls = (c: Country) =>
    [
      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-sm',
      c === country
        ? dark ? 'bg-brand-red/15 text-white' : 'bg-brand-red/8 text-brand-red'
        : dark ? 'text-white/75 hover:bg-white/6' : 'text-brand-black hover:bg-gray-50',
    ].join(' ');

  const CountryOption = ({ c }: { c: Country }) => (
    <button type="button" className={optionCls(c)} onClick={() => handleCountrySelect(c)}>
      <Flag country={c} className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm" />
      <span className="flex-1 truncate">{(en as Record<string, string>)[c] ?? c}</span>
      <span className={`text-xs font-mono shrink-0 ${dark ? 'text-white/35' : 'text-gray-400'}`}>
        +{getCountryCallingCode(c)}
      </span>
      {c === country && <Check className="w-3.5 h-3.5 text-brand-red shrink-0" />}
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className={wrapCls}>
        {/* Country selector trigger */}
        <button
          type="button"
          onClick={() => !disabled && setOpen((p) => !p)}
          className={triggerCls}
          aria-label="Select country code"
        >
          <Flag country={country} className="w-5 h-3.5 rounded-sm shadow-sm shrink-0" />
          <span className={`text-xs font-bold tabular-nums leading-none ${dark ? 'text-white/65' : 'text-brand-black/70'}`}>
            +{dialCode}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${dark ? 'text-white/30' : 'text-gray-400'}`}
          />
        </button>

        {/* Number input + inline icon */}
        <div className="relative flex-1 flex items-center">
          <input
            type="tel"
            value={localNum}
            onChange={(e) => handleNumChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder ?? 'XX XXX XXX'}
            disabled={disabled}
            className={inputCls}
          />
          {inlineState === 'valid' && (
            <CheckCircle2 className="absolute right-3 w-4 h-4 text-green-500 pointer-events-none shrink-0" />
          )}
          {hasError && (
            <XCircle className="absolute right-3 w-4 h-4 text-orange-400 pointer-events-none shrink-0" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className={dropdownCls}>
          <div className={searchWrapCls}>
            <Search className={`w-4 h-4 shrink-0 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code…"
              className={`flex-1 text-sm bg-transparent focus:outline-none ${dark ? 'text-white placeholder-white/30' : 'text-brand-black placeholder:text-gray-400'}`}
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {!q && popularFiltered.length > 0 && (
              <>
                <p className={sectionLabelCls}>Popular</p>
                {popularFiltered.map((c) => <CountryOption key={c} c={c} />)}
                <div className={`border-t ${dividerCls}`} />
                <p className={sectionLabelCls}>All countries</p>
              </>
            )}
            {(q ? filtered : restFiltered).map((c) => <CountryOption key={c} c={c} />)}
            {filtered.length === 0 && (
              <p className={`px-4 py-6 text-sm text-center ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                No results for &ldquo;{search}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form error takes priority; inline message shown otherwise */}
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
      {!error && inlineMsg && (
        <p className="text-orange-400 text-xs mt-1.5 flex items-center gap-1">
          <XCircle className="w-3 h-3 shrink-0" />
          {inlineMsg}
        </p>
      )}
    </div>
  );
}

export { isValidPhoneNumber };

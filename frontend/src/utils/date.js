import { format, isValid, parse } from 'date-fns';

export const parseSaveWiseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === 'number') {
    const milliseconds = value > 9999999999 ? value : value * 1000;
    const parsedNumber = new Date(milliseconds);
    return isValid(parsedNumber) ? parsedNumber : null;
  }

  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === 'unknown' || lower === 'null') return null;

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsedNative = new Date(normalized);
  if (isValid(parsedNative)) return parsedNative;

  const formats = [
    'yyyy-MM-dd HH:mm:ss.SSS',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MMM d, yyyy',
    'MMM d, yyyy, HH:mm',
  ];

  for (const shape of formats) {
    const parsed = parse(raw, shape, new Date());
    if (isValid(parsed)) return parsed;
  }

  return null;
};

export const formatSaveWiseDate = (value, dateFormat = 'MMM d, yyyy', fallback = 'Not set') => {
  const parsed = parseSaveWiseDate(value);
  return parsed ? format(parsed, dateFormat) : fallback;
};

export const dateField = (item, snake, camel) => item?.[snake] ?? item?.[camel];

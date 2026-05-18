export const currencies = [
  {
    code: 'SAR',
    value: 'SAR',
    name: 'Saudi Riyal',
    noun: 'riyal',
    symbol: 'SAR',
    display: 'SAR — Saudi Riyal',
    shortDisplay: 'SAR',
    isSar: true,
  },
  {
    code: 'USD',
    value: 'USD',
    name: 'US Dollar',
    noun: 'dollar',
    symbol: '$',
    display: '$ USD',
    shortDisplay: '$ USD',
  },
  {
    code: 'EUR',
    value: 'EUR',
    name: 'Euro',
    noun: 'euro',
    symbol: '€',
    display: '€ EUR',
    shortDisplay: '€ EUR',
  },
  {
    code: 'GBP',
    value: 'GBP',
    name: 'British Pound',
    noun: 'pound',
    symbol: '£',
    display: '£ GBP',
    shortDisplay: '£ GBP',
  },
  {
    code: 'JPY',
    value: 'JPY',
    name: 'Japanese Yen',
    noun: 'yen',
    symbol: '¥',
    display: '¥ JPY',
    shortDisplay: '¥ JPY',
  },
  {
    code: 'CNY',
    value: 'CNY',
    name: 'Chinese Yuan',
    noun: 'yuan',
    symbol: '¥',
    display: '¥ CNY',
    shortDisplay: '¥ CNY',
  },
  {
    code: 'INR',
    value: 'INR',
    name: 'Indian Rupee',
    noun: 'rupee',
    symbol: '₹',
    display: '₹ INR',
    shortDisplay: '₹ INR',
  },
  {
    code: 'PKR',
    value: 'PKR',
    name: 'Pakistani Rupee',
    noun: 'rupee',
    symbol: 'Rs',
    display: 'Rs PKR',
    shortDisplay: 'Rs PKR',
  },
  {
    code: 'AED',
    value: 'AED',
    name: 'UAE Dirham',
    noun: 'dirham',
    symbol: 'د.إ',
    display: 'د.إ AED',
    shortDisplay: 'د.إ AED',
  },
  {
    code: 'TRY',
    value: 'TRY',
    name: 'Turkish Lira',
    noun: 'lira',
    symbol: '₺',
    display: '₺ TRY',
    shortDisplay: '₺ TRY',
  },
  {
    code: 'RUB',
    value: 'RUB',
    name: 'Russian Ruble',
    noun: 'ruble',
    symbol: '₽',
    display: '₽ RUB',
    shortDisplay: '₽ RUB',
  },
];

export function getCurrencyCode(currency = 'SAR') {
  if (typeof currency === 'string') return currency || 'SAR';
  return currency?.code || currency?.value || currency?.currency || 'SAR';
}

export function getCurrencyByCode(code = 'SAR') {
  const currencyCode = getCurrencyCode(code);
  return currencies.find((currency) => currency.code === currencyCode) || currencies[0];
}

export function getCurrencySymbol(currency = 'SAR') {
  return getCurrencyByCode(currency).symbol;
}

export function getCurrencyName(currency = 'SAR') {
  return getCurrencyByCode(currency).name;
}

export function getCurrencyNoun(currency = 'SAR') {
  return getCurrencyByCode(currency).noun || 'currency';
}

export function getCurrencyDisplay(currency = 'SAR') {
  return getCurrencyByCode(currency).display;
}

export function getCurrencyShortDisplay(currency = 'SAR') {
  return getCurrencyByCode(currency).shortDisplay;
}

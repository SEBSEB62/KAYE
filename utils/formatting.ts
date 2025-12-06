export function formatCurrency(value: number, decimals = 2, locale = 'fr-FR') {
  const num = Number(value) || 0;
  try {
    return num.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '€';
  } catch (e) {
    return num.toFixed(decimals) + '€';
  }
}

export function formatPercentage(value: number, decimals = 1) {
  const num = Number(value) || 0;
  return num.toFixed(decimals) + '%';
}

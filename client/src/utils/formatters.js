// Number formatting utilities

/**
 * Format number as currency with comma separators
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string (e.g., "2,000.00")
 */
export const formatCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

/**
 * Format number as currency with dollar sign
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string with $ (e.g., "$2,000.00")
 */
export const formatDollar = (amount, decimals = 2) => {
  return `$${formatCurrency(amount, decimals)}`;
};

/**
 * Format number with comma separators (no decimals by default)
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number (e.g., "2,000")
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Format percentage
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage (e.g., "15.5%")
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${formatNumber(value, decimals)}%`;
};

/**
 * Format large numbers with K, M, B suffix
 * @param {number} number - The number to format
 * @returns {string} Formatted number (e.g., "1.5K", "2.3M")
 */
export const formatCompact = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  const absNum = Math.abs(number);
  const sign = number < 0 ? '-' : '';

  if (absNum >= 1e9) {
    return `${sign}${formatNumber(absNum / 1e9, 1)}B`;
  }
  if (absNum >= 1e6) {
    return `${sign}${formatNumber(absNum / 1e6, 1)}M`;
  }
  if (absNum >= 1e3) {
    return `${sign}${formatNumber(absNum / 1e3, 1)}K`;
  }

  return `${sign}${formatNumber(absNum, 0)}`;
};

/**
 * Format date to readable format
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type ('short', 'long', 'numeric')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';

  const dateObj = new Date(date);

  const formats = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    numeric: { month: '2-digit', day: '2-digit', year: 'numeric' }
  };

  return dateObj.toLocaleDateString('en-US', formats[format] || formats.short);
};

/**
 * Format month-year (YYYY-MM to readable format)
 * @param {string} monthYear - Month-year string (e.g., "2024-03")
 * @returns {string} Formatted month-year (e.g., "March 2024")
 */
export const formatMonthYear = (monthYear) => {
  if (!monthYear) return '-';

  const [year, month] = monthYear.split('-');
  const date = new Date(year, parseInt(month) - 1);

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Format month-year to short format
 * @param {string} monthYear - Month-year string (e.g., "2024-03")
 * @returns {string} Formatted month-year (e.g., "Mar '24")
 */
export const formatMonthYearShort = (monthYear) => {
  if (!monthYear) return '-';

  const [year, month] = monthYear.split('-');
  const date = new Date(year, parseInt(month) - 1);

  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

/**
 * Get color for variance (positive = green, negative = red)
 * @param {number} variance - The variance value
 * @returns {string} CSS color variable
 */
export const getVarianceColor = (variance) => {
  if (variance > 0) return 'var(--danger-color)'; // Over target is bad (red)
  if (variance < 0) return 'var(--secondary-color)'; // Under target is good (green)
  return 'var(--text-primary)'; // Exactly on target
};

/**
 * Get variance text with +/- sign
 * @param {number} variance - The variance value
 * @param {boolean} invert - Invert the sign (for bills where negative is good)
 * @returns {string} Formatted variance with sign
 */
export const formatVariance = (variance, invert = false) => {
  if (variance === 0) return '0.00';

  const sign = (variance > 0) !== invert ? '+' : '';
  return `${sign}${formatCurrency(variance)}`;
};

export default {
  formatCurrency,
  formatDollar,
  formatNumber,
  formatPercent,
  formatCompact,
  formatDate,
  formatMonthYear,
  formatMonthYearShort,
  getVarianceColor,
  formatVariance
};

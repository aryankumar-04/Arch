/**
 * Lightweight Input Validation & Sanitization Utility
 * Hardens payload security, null safety, and prevents malformed data, oversized payloads, and empty values.
 */

/**
 * Sanitizes input string: trims whitespace, removes control characters, caps max length.
 */
export const sanitizeString = (str, maxLength = 1000, fallback = '') => {
  if (typeof str !== 'string') return fallback;
  const cleaned = str.replace(/[^\x20-\x7E\u00A0-\u00FF\n\r\t]/g, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

/**
 * Validates and returns a safe number within bounds.
 */
export const sanitizeNumber = (val, fallback = 0, min = -Infinity, max = Infinity) => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
};

/**
 * Validates ISO / YYYY-MM-DD date format string.
 */
export const sanitizeDateString = (dateStr, fallback = null) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return fallback || new Date().toISOString().split('T')[0];
  }
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || !isNaN(Date.parse(trimmed))) {
    return trimmed;
  }
  return fallback || new Date().toISOString().split('T')[0];
};

/**
 * Validates a task payload object.
 */
export const validateTaskPayload = (title, priority = 'medium') => {
  const cleanTitle = sanitizeString(title, 200, '');
  const validPriorities = ['high', 'medium', 'low'];
  const cleanPriority = validPriorities.includes(priority) ? priority : 'medium';
  return {
    title: cleanTitle || 'Untitled Task',
    priority: cleanPriority
  };
};

/**
 * Validates an expense payload object.
 */
export const validateExpensePayload = (data = {}) => {
  const title = sanitizeString(data.title || data.description, 200, 'Expense');
  const amount = sanitizeNumber(data.amount, 0, 0, 1000000);
  const category = sanitizeString(data.category, 50, 'General');
  const type = data.type === 'income' ? 'income' : 'expense';
  const date = sanitizeDateString(data.date);

  return { title, amount, category, type, date };
};

/**
 * Validates a goal payload object.
 */
export const validateGoalPayload = (data = {}) => {
  const title = sanitizeString(data.title, 200, 'Untitled Goal');
  const description = sanitizeString(data.description, 1000, '');
  const category = sanitizeString(data.category, 50, 'Short Term');
  const progress = sanitizeNumber(data.progress, 0, 0, 100);
  const targetDate = data.targetDate ? sanitizeDateString(data.targetDate, '') : '';
  const status = ['completed', 'in_progress'].includes(data.status) ? data.status : 'in_progress';

  return { title, description, category, progress, targetDate, status };
};

/**
 * Validates a movie payload object.
 */
export const validateMoviePayload = (data = {}) => {
  const title = sanitizeString(data.title, 200, 'Untitled Movie');
  const year = sanitizeString(data.year, 20, '');
  const genre = sanitizeString(data.genre, 100, '');
  const director = sanitizeString(data.director, 100, '');
  const plot = sanitizeString(data.plot, 2000, '');
  const imdbRating = sanitizeString(data.imdbRating, 10, '7.0');
  const userRating = sanitizeNumber(data.userRating, 0, 0, 10);
  const status = ['watched', 'watchlist'].includes(data.status) ? data.status : 'watchlist';

  return {
    title,
    year,
    genre,
    director,
    plot,
    imdbRating,
    userRating,
    status,
    poster: data.poster || null,
    imdbID: data.imdbID || null
  };
};

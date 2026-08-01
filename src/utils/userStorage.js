/**
 * User-Scoped Storage Utility
 * Ensures LocalStorage caching is strictly isolated per user UID to prevent data leakage between user accounts.
 */

export const getUserStorageKey = (moduleName, userId) => {
  const safeUid = userId || 'guest';
  return `archos_${moduleName}_${safeUid}`;
};

export const getLocalUserBackup = (moduleName, userId, defaultValue = []) => {
  try {
    const key = getUserStorageKey(moduleName, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.error(`Error reading local backup for ${moduleName}:`, err);
    return defaultValue;
  }
};

export const saveLocalUserBackup = (moduleName, userId, data) => {
  try {
    const key = getUserStorageKey(moduleName, userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving local backup for ${moduleName}:`, err);
  }
};

export const clearLocalUserBackup = (moduleName, userId) => {
  try {
    const key = getUserStorageKey(moduleName, userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error clearing local backup for ${moduleName}:`, err);
  }
};

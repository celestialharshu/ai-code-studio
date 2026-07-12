const KEY = 'token';

/**
 * The JWT lives in localStorage, and every request reads it from here rather
 * than passing it down through props. One place to look when something is
 * unauthorised.
 */
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (token) => localStorage.setItem(KEY, token);
export const clearToken = () => localStorage.removeItem(KEY);

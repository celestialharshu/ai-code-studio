import { getToken } from './token.js';

// Empty in development: Vite proxies /api to the Express server (vite.config.js).
// In production this is the Render URL, set as VITE_API_URL on Vercel.
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Every JSON call goes through here, so the auth header can't be forgotten on
 * one route and remembered on another.
 */
async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}`);
  }

  return data;
}

export const getHealth = () => request('/api/health');

// ------------------------------------------------------------------- accounts

export const registerAccount = (details) => request('/api/auth/register', { method: 'POST', body: details });
export const loginAccount = (credentials) => request('/api/auth/login', { method: 'POST', body: credentials });
export const fetchMe = () => request('/api/auth/me');

// ---------------------------------------------------------------------- rooms

export const createRoom = () => request('/api/rooms', { method: 'POST' });
export const listRooms = () => request('/api/rooms');
export const fetchRoom = (roomId) => request(`/api/rooms/${roomId}`);

export const inviteMember = (roomId, identifier) =>
  request(`/api/rooms/${roomId}/members`, { method: 'POST', body: { identifier } });

export const removeMember = (roomId, userId) =>
  request(`/api/rooms/${roomId}/members/${userId}`, { method: 'DELETE' });

export const setRoomAccess = (roomId, access) =>
  request(`/api/rooms/${roomId}/access`, { method: 'PATCH', body: { access } });

// ------------------------------------------------------------------- AI chat

/**
 * Sends the conversation to the backend and calls onToken for every token the
 * model produces.
 *
 * This one can't use request() above, because it doesn't want the parsed JSON —
 * it wants the raw body stream. EventSource would be the obvious tool for
 * Server-Sent Events, but it can only issue GET requests and we need to POST the
 * conversation and the file. So: a normal fetch, read the stream by hand.
 */
export async function streamChat({ messages, code, language, onToken, signal }) {
  const token = getToken();

  const response = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, code, language }),
    signal,
  });

  // Failures *before* streaming starts (unauthorised, rate limited) arrive as
  // ordinary JSON with a non-2xx status.
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    // Network chunks don't line up with SSE events, so buffer and only handle
    // events that are definitely complete (they're separated by a blank line).
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const dataLine = event.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const payload = JSON.parse(dataLine.slice(5).trim());
      if (payload.type === 'token') onToken(payload.value);

      // Failures *during* streaming can't use a status code — the 200 is already
      // on the wire — so the server puts them inside the stream instead.
      if (payload.type === 'error') throw new Error(payload.message);
    }
  }
}

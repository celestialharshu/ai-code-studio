/**
 * A room lives entirely in the URL: ?room=k3f9x2
 *
 * That means sharing a session is just sharing a link, there's nothing to sign
 * up for, and a reload drops you back into the same room.
 */
export function readRoomFromUrl() {
  return new URLSearchParams(window.location.search).get('room');
}

export function writeRoomToUrl(roomId) {
  const url = new URL(window.location.href);

  if (roomId) url.searchParams.set('room', roomId);
  else url.searchParams.delete('room');

  // replaceState, not pushState: joining a room isn't a page you want to go
  // "back" out of one press at a time.
  window.history.replaceState({}, '', url);
}

export function createRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export function inviteLink(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  return url.toString();
}

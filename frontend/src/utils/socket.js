import { io } from 'socket.io-client';
import { session } from '../services/apiClient';

let instance = null;
let instanceToken = null;

/**
 * Returns a shared Socket.IO client instance for the current authenticated session.
 * Reconnects cleanly whenever the authentication token changes.
 */
export function getSocket() {
  const token = session.token;
  if (!token) return null;
  if (instance && instanceToken === token) return instance;

  if (instance) {
    instance.disconnect();
  }

  instance = io({
    auth: { token },
    transports: [ 'websocket', 'polling' ],
  });

  instanceToken = token;
  return instance;
}

export function disconnectSocket() {
  if (instance) {
    instance.disconnect();
  }
  instance = null;
  instanceToken = null;
}

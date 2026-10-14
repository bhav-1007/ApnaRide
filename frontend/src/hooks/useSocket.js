import { useEffect, useRef } from 'react';
import { getSocket } from '../utils/socket';

/**
 * Subscribe to a Socket.IO room while `room` is defined,
 * and attach listeners for events specified in `handlers` ({ [eventName]: callbackFn }).
 */
export default function useSocket(room, handlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!room) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    socket.emit('join', room);

    const events = Object.keys(handlersRef.current);
    const bound = events.map((event) => {
      const fn = (payload) => handlersRef.current[ event ]?.(payload);
      socket.on(event, fn);
      return [ event, fn ];
    });

    return () => {
      bound.forEach(([ event, fn ]) => socket.off(event, fn));
      socket.emit('leave', room);
    };
  }, [ room ]);
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService as auth, session, UNAUTHORIZED_EVENT } from '../services';
import { disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ account, setAccount ] = useState(null);
  const [ role, setRole ] = useState(session.role);
  const [ loading, setLoading ] = useState(Boolean(session.token && session.role));

  const clear = useCallback(() => {
    session.clear();
    disconnectSocket();
    setAccount(null);
    setRole(null);
  }, []);

  // Restore session on initial page load
  useEffect(() => {
    if (!session.token || !session.role) return;
    auth.profile(session.role)
      .then(setAccount)
      .catch(clear)
      .finally(() => setLoading(false));
  }, [ clear ]);

  // Listen for 401 unauthorized events to automatically reset session state
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clear);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clear);
  }, [ clear ]);

  const signIn = useCallback(async (nextRole, mode, body) => {
    const result = await auth[ mode ](nextRole, body);
    session.save(result.token, nextRole);
    setRole(nextRole);
    setAccount(result[ nextRole ]);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await auth.logout(session.role);
    } catch {
      // Clear locally even if server logout request fails
    }
    clear();
  }, [ clear ]);

  const value = useMemo(
    () => ({ account, role, loading, signIn, signOut, setAccount }),
    [ account, role, loading, signIn, signOut ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

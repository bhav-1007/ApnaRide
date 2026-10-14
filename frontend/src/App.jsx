import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Shell from './layouts/Shell';
import { PageSpinner } from './components/ui';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import History from './pages/History';
import Book from './pages/rider/Book';
import Dashboard from './pages/captain/Dashboard';

const homeFor = (role) => (role === 'captain' ? '/captain' : '/ride');

// Signed-out visitors go to the right login page; the wrong account type is sent to its own home.
function RequireRole({ role, children }) {
  const { account, role: current, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!account) return <Navigate to={role === 'captain' ? '/captain/login' : '/rider/login'} replace />;
  if (current !== role) return <Navigate to={homeFor(current)} replace />;
  return <Shell>{children}</Shell>;
}

// Signed-in users skip the public pages.
function PublicOnly({ children }) {
  const { account, role, loading } = useAuth();
  if (loading) return <PageSpinner />;
  return account ? <Navigate to={homeFor(role)} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />

      <Route path="/rider/login" element={<PublicOnly><AuthPage role="user" mode="login" /></PublicOnly>} />
      <Route path="/rider/signup" element={<PublicOnly><AuthPage role="user" mode="register" /></PublicOnly>} />
      <Route path="/rider/forgot-password" element={<PublicOnly><ForgotPassword role="user" /></PublicOnly>} />
      <Route path="/captain/login" element={<PublicOnly><AuthPage role="captain" mode="login" /></PublicOnly>} />
      <Route path="/captain/signup" element={<PublicOnly><AuthPage role="captain" mode="register" /></PublicOnly>} />
      <Route path="/captain/forgot-password" element={<PublicOnly><ForgotPassword role="captain" /></PublicOnly>} />

      <Route path="/ride" element={<RequireRole role="user"><Book /></RequireRole>} />
      <Route path="/ride/history" element={<RequireRole role="user"><History role="user" /></RequireRole>} />
      <Route path="/captain" element={<RequireRole role="captain"><Dashboard /></RequireRole>} />
      <Route path="/captain/history" element={<RequireRole role="captain"><History role="captain" /></RequireRole>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

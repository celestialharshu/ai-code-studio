import { Braces } from 'lucide-react';

import AuthPage from './auth/AuthPage.jsx';
import Workspace from './Workspace.jsx';
import { useAuth } from './auth/AuthProvider.jsx';

/**
 * The gate. Everything past this point can assume there is a signed-in user, so
 * no component below ever has to check.
 */
export default function App() {
  const { user, loading } = useAuth();

  // Held while we ask the server whether the stored token is still good. Without
  // this the sign-in page would flash for a moment on every reload.
  if (loading) return <Splash />;
  if (!user) return <AuthPage />;

  return <Workspace />;
}

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
        <Braces size={20} strokeWidth={2.5} className="text-accent-fg" />
      </div>
    </div>
  );
}

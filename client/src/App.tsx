import React, { useState } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import HiderPage from './components/HiderPage';
import OniPage from './components/OniPage';

type UserRole = 'admin' | 'oni' | 'hider' | null;

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [token, setToken] = useState<string>('');

  const handleLoginSuccess = (newToken: string, role: string) => {
    setToken(newToken);
    setUserRole(role as UserRole);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {userRole === 'admin' && <AdminDashboard token={token} onLogout={handleLogout} />}
      {userRole === 'hider' && <HiderPage token={token} onLogout={handleLogout} />}
      {userRole === 'oni' && <OniPage token={token} onLogout={handleLogout} />}
    </>
  );
};

export default App;

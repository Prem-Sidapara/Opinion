import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { UserCircle } from 'lucide-react';

import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono font-bold">LOADING...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.username !== 'prem') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const NavBar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#D25353] backdrop-blur-sm border-b border-black/10 h-12">
      <div className="max-w-3xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="font-black text-xl tracking-tighter text-black uppercase hover:underline">
          Opinions
        </Link>
        <div className="flex items-center gap-4">
          {user && user.username === 'prem' && (
            <Link to="/admin" className="text-xs font-bold uppercase text-red-600 hover:underline">
              Admin
            </Link>
          )}
          {user ? (
            <Link to="/profile" className="p-2 border border-black hover:bg-black hover:text-white transition-colors">
              <UserCircle size={24} />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-xs font-bold uppercase hover:underline">
                Log In
              </Link>
              <Link to="/register" className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-800 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen ">
          <NavBar />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Feed />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

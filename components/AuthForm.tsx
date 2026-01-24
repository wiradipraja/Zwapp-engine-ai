import React, { useState } from 'react';
import { signIn, signUp } from '../services/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface AuthFormProps {
  onAuthSuccess: () => void;
  onBackToHome?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, onBackToHome }) => {
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        await signIn(email, password);
        onAuthSuccess();
      } else {
        await signUp(email, password);
        setMessage("Registration successful! Check your email to confirm (if enabled), or login now.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
      {/* Background Gradient */}
      <div className={`fixed inset-0 ${isDark ? 'bg-gradient-to-br from-orange-950/20 via-zinc-950 to-zinc-950' : 'bg-gradient-to-br from-orange-100/50 via-white to-zinc-100'}`} />
      
      {/* Theme Toggle - Fixed Position */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-lg ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-600'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} transition-colors z-50`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Auth Card */}
      <div className={`relative w-full max-w-md z-10 ${isDark ? 'bg-zinc-900' : 'bg-white'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} shadow-2xl`}>
        {/* Back to Home */}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className={`absolute -top-12 left-0 flex items-center gap-2 text-sm font-mono ${isDark ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-600 hover:text-orange-600'} transition-colors`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO HOME
          </button>
        )}

        {/* Card Header */}
        <div className={`px-8 pt-8 pb-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h2 className={`text-2xl font-bold tracking-widest text-center ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            DIRECTOR ACCESS
          </h2>
          <p className="text-center text-orange-500 text-xs font-mono tracking-wider mt-2">
            AUTHORIZED PERSONNEL ONLY
          </p>
        </div>

        {/* Card Body */}
        <div className="p-8">
          {error && (
            <div className={`mb-6 p-3 border ${isDark ? 'border-red-900 bg-red-900/20' : 'border-red-200 bg-red-50'} text-red-500 text-xs font-mono`}>
              [ERROR]: {error}
            </div>
          )}

          {message && (
            <div className={`mb-6 p-3 border ${isDark ? 'border-green-900 bg-green-900/20' : 'border-green-200 bg-green-50'} text-green-500 text-xs font-mono`}>
              [SUCCESS]: {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-xs font-mono tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border font-mono text-sm transition-all focus:outline-none focus:border-orange-500 ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                  placeholder="director@zwapp.id"
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-mono tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                PASSWORD
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border font-mono text-sm transition-all focus:outline-none focus:border-orange-500 ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-zinc-950 text-white font-bold tracking-widest text-sm transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'border border-zinc-800' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  AUTHENTICATING...
                </span>
              ) : isLogin ? 'ENTER ENGINE' : 'REGISTER IDENTITY'}
            </button>
          </form>

          {/* Registration Closed Notice */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} text-center`}>
            <div className={`inline-flex items-center gap-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-mono tracking-wider">
                PUBLIC REGISTRATION CLOSED
              </span>
            </div>
            <p className={`text-xs font-mono mt-2 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
              This system is locked. Please contact the System<br />
              Administrator to request access credentials.
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className={`text-xs font-mono tracking-wider transition-colors ${isDark ? 'text-zinc-500 hover:text-orange-500' : 'text-zinc-600 hover:text-orange-600'}`}
            >
              {isLogin ? '[ CREATE NEW ACCOUNT ]' : '[ RETURN TO LOGIN ]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
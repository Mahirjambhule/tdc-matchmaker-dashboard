import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import heroImage from '/src/assets/hero.jpg';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'matchmaker' && password === 'tdc2026') {
      onLoginSuccess();
    } else {
      setError('Invalid matchmaker credentials. Try: matchmaker / tdc2026');
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white overflow-x-hidden m-0 p-0">

      <div className="hidden md:flex relative w-full h-full bg-tdc-dark items-center justify-center">
        <img src={heroImage} alt="The Date Crew Hero" className="w-full h-full object-cover opacity-90" />
      </div>

      <div className="w-full min-h-screen md:min-h-0 flex flex-col items-center justify-center bg-white p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-sm space-y-6">

          <div className="text-center md:text-left flex flex-col items-center md:items-start justify-center">
            <div className="w-12 h-12 rounded-full bg-tdc-logo-gold flex items-center justify-center font-serif text-white font-bold text-base tracking-tighter mb-4 shadow-xs">
              tdc
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-tdc-dark">
              The Date Crew
            </h1>
            <p className="text-tdc-logo-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
              Internal Matchmaker Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center font-semibold border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Matchmaker ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter workspace identity"
                  className="w-full bg-gray-50 text-xs text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-tdc-logo-gold focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Secure Credentials
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter operational token"
                  className="w-full bg-gray-50 text-xs text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-tdc-logo-gold focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-tdc-green text-white text-xs font-semibold py-3 rounded-xl transition-all tracking-wide cursor-pointer mt-2 active:scale-98"
            >
              Authenticate Portal Session
            </button>

            <div className="text-center md:text-left pt-1">
              <span className="text-[10px] text-gray-400 font-medium">
                Portal Access: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">matchmaker / tdc2026</code>
              </span>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
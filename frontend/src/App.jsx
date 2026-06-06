import React, { useState, useEffect } from 'react';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DetailedMatchView from './views/DetailedMatchView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('tdc_session_active') === 'true';
  });
  
  const [currentView, setCurrentView] = useState('list'); 
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [savedScrollY, setSavedScrollY] = useState(0);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('tdc_session_active', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedCustomerId(null);
    setCurrentView('list');
    setSavedScrollY(0);
    localStorage.removeItem('tdc_session_active');
  };

  const navigateToDetail = (id) => {
    setSavedScrollY(window.scrollY);
    setSelectedCustomerId(id);
    setCurrentView('detail');
    window.scrollTo(0, 0);
  };

  const navigateToList = () => {
    setCurrentView('list');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (currentView === 'list' && savedScrollY > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, savedScrollY);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [currentView, savedScrollY]);

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-tdc-cream text-tdc-dark">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={navigateToList}>
            <div className="w-8 h-8 rounded-full bg-tdc-logo-gold flex items-center justify-center font-serif text-white font-bold text-xs tracking-tighter">
              tdc
            </div>
            <span className="font-serif text-xl font-bold tracking-wide text-tdc-dark">The Date Crew</span>
            <span className="bg-tdc-cream/40 text-tdc-logo-gold text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-gray-200">
              Matchmaker Desk
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">Welcome, Agent Alpha</p>
              <p className="text-xs text-gray-400">Senior Matchmaker</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className={currentView === 'list' ? 'block space-y-4 animate-fadeIn' : 'hidden'}>
          <div>
            <h2 className="font-serif text-2xl font-bold text-tdc-dark">Assigned Client Directory</h2>
            <p className="text-gray-500 text-sm">Select a member profile to initiate candidate matrix pairing computations and log internal consultation updates.</p>
          </div>
          <DashboardView onSelectCustomer={navigateToDetail} refreshTrigger={refreshTrigger} />
        </div>

        {currentView === 'detail' && (
          <div className="space-y-4 animate-fadeIn">
            <button 
              onClick={navigateToList} 
              className="text-xs bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-xl border border-gray-200 shadow-2xs transition-all inline-block"
            >
              ← Return to Client Directory
            </button>
            <DetailedMatchView key={selectedCustomerId} customerId={selectedCustomerId} onBack={navigateToList} />
          </div>
        )}
        
      </main>
    </div>
  );
}
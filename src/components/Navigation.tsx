import React, { useState } from 'react';
import { TabType } from '../types/physics';
import { Zap, GitCommit, Split, Cpu, Flame, Trophy, Home, Menu, X } from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'ohms-law',
      label: "Ohm's Law",
      icon: <Zap className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'wire-resistance',
      label: 'Resistance in Wire',
      icon: <GitCommit className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'series-parallel',
      label: 'Series & Parallel',
      icon: <Split className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'circuit-builder',
      label: 'DC Circuit Lab',
      icon: <Cpu className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'joules-law',
      label: "Joule's Heating & Power",
      icon: <Flame className="w-4 h-4 text-red-500" />,
    },
    {
      id: 'challenges',
      label: 'Lab Challenges & Quiz',
      icon: <Trophy className="w-4 h-4 text-yellow-500" />,
    },
  ];

  const handleTabClick = (id: TabType) => {
    setActiveTab(id);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Circuit<span className="text-blue-600">Lab</span>
            </span>
          </div>

          {/* Desktop Nav Tabs (lg and up) */}
          <nav className="hidden lg:flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isHome = tab.id === 'home';
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive && !isHome
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isActive && isHome
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Hamburger (below lg) */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-2 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isHome = tab.id === 'home';
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive && !isHome
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isActive && isHome
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

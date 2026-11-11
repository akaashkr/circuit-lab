import React, { useState } from 'react';
import { TabType } from '../types/physics';
import { 
  Zap, GitCommit, Split, Cpu, Activity, Flame, Trophy, 
  Home, Menu, X, ArrowLeft
} from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'ohms-law',
      label: "Ohm's Law",
      icon: <Zap className="w-4 h-4 text-amber-500" />
    },
    {
      id: 'wire-resistance',
      label: 'Resistance in Wire',
      icon: <GitCommit className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'circuit-builder',
      label: 'DC Circuit Kit',
      icon: <Cpu className="w-4 h-4 text-orange-500" />
    },
    {
      id: 'circuit-builder-ac',
      label: 'AC Circuit Kit',
      icon: <Activity className="w-4 h-4 text-sky-500" />
    },
    {
      id: 'series-parallel',
      label: 'Series & Parallel',
      icon: <Split className="w-4 h-4 text-purple-500" />
    },
    {
      id: 'joules-law',
      label: "Joule's Heating",
      icon: <Flame className="w-4 h-4 text-red-500" />
    },
    {
      id: 'challenges',
      label: 'Challenges & Quiz',
      icon: <Trophy className="w-4 h-4 text-yellow-500" />
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center space-x-2 focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Circuit<span className="text-blue-600">Lab</span>
                </span>
                <span className="hidden md:block text-[10px] text-slate-500 font-medium">
                  Electricity Physics Simulations
                </span>
              </div>
            </button>

            {/* If in simulation, show "Back to Home" pill button */}
            {activeTab !== 'home' && (
              <button
                onClick={() => setActiveTab('home')}
                className="hidden sm:flex items-center space-x-1 ml-4 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Simulations</span>
              </button>
            )}
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex space-x-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center space-x-2">
            {activeTab !== 'home' && (
              <button
                onClick={() => setActiveTab('home')}
                className="p-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg flex items-center space-x-1"
              >
                <Home className="w-4 h-4" />
                <span className="text-[11px]">Home</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-3 py-2 space-y-1 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

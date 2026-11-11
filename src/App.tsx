import React, { useState } from 'react';
import { TabType } from './types/physics';
import { Navigation } from './components/Navigation';
import { HomeScreen } from './components/HomeScreen';
import { OhmsLawSim } from './simulations/OhmsLaw/OhmsLawSim';
import { WireResistanceSim } from './simulations/WireResistance/WireResistanceSim';
import { SeriesParallelSim } from './simulations/SeriesParallel/SeriesParallelSim';
import { CircuitBuilderSim } from './simulations/CircuitBuilder/CircuitBuilderSim';
import { JoulesHeatingSim } from './simulations/JoulesHeating/JoulesHeatingSim';
import { ChallengesHub } from './simulations/Challenges/ChallengesHub';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  return (
    <div className="min-h-screen bg-[#fbfbf2] flex flex-col justify-between text-slate-800">
      {/* Sticky Top Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Simulation Viewport */}
      <main className="flex-grow">
        {activeTab === 'home' && <HomeScreen onSelectSim={setActiveTab} />}
        {activeTab === 'ohms-law' && <OhmsLawSim />}
        {activeTab === 'wire-resistance' && <WireResistanceSim />}
        {activeTab === 'series-parallel' && <SeriesParallelSim />}
        {activeTab === 'circuit-builder' && <CircuitBuilderSim />}
        {activeTab === 'joules-law' && <JoulesHeatingSim />}
        {activeTab === 'challenges' && (
          <ChallengesHub onNavigateToSim={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800">Circuit Lab</span>
            <span>•</span>
            <span>Interactive Electricity Simulations</span>
          </div>

          <div className="flex items-center">
            <span className="text-slate-400">Made with ⚡ by Circuit Lab</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

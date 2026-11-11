import React from 'react';
import { TabType } from '../types/physics';
import { Zap, GitCommit, Split, Cpu, Flame, Trophy } from 'lucide-react';

interface HomeScreenProps {
  onSelectSim: (tab: TabType) => void;
}

const simulations: {
  id: TabType;
  title: string;
  description: string;
  formula: string;
  icon: React.ReactNode;
  accent: string;
  hoverShadow: string;
  accentBg: string;
}[] = [
  {
    id: 'ohms-law',
    title: "Ohm's Law",
    description: 'Explore the relationship between voltage, current, and resistance.',
    formula: 'V = I × R',
    icon: <Zap className="w-7 h-7" />,
    accent: 'bg-amber-400',
    hoverShadow: 'hover:shadow-amber-200/60',
    accentBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'wire-resistance',
    title: 'Wire Resistance',
    description: 'See how material, length, and area affect resistance.',
    formula: 'R = ρL/A',
    icon: <GitCommit className="w-7 h-7" />,
    accent: 'bg-blue-400',
    hoverShadow: 'hover:shadow-blue-200/60',
    accentBg: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'series-parallel',
    title: 'Series & Parallel',
    description: 'Compare resistor combinations and their effects on circuits.',
    formula: 'Resistor Combinations',
    icon: <Split className="w-7 h-7" />,
    accent: 'bg-emerald-400',
    hoverShadow: 'hover:shadow-emerald-200/60',
    accentBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'circuit-builder',
    title: 'DC Circuit Lab',
    description: 'Build your own circuits and measure voltage, current, and more.',
    formula: 'Build & Measure Circuits',
    icon: <Cpu className="w-7 h-7" />,
    accent: 'bg-purple-400',
    hoverShadow: 'hover:shadow-purple-200/60',
    accentBg: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'joules-law',
    title: "Joule's Heating",
    description: 'Discover how current generates heat in conductors.',
    formula: 'H = I²Rt',
    icon: <Flame className="w-7 h-7" />,
    accent: 'bg-red-400',
    hoverShadow: 'hover:shadow-red-200/60',
    accentBg: 'bg-red-50 text-red-600',
  },
  {
    id: 'challenges',
    title: 'Concept Challenges',
    description: 'Test your understanding with interactive quizzes and problems.',
    formula: 'Test Your Knowledge',
    icon: <Trophy className="w-7 h-7" />,
    accent: 'bg-yellow-400',
    hoverShadow: 'hover:shadow-yellow-200/60',
    accentBg: 'bg-yellow-50 text-yellow-600',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectSim }) => {
  return (
    <div className="bg-[#fbfbf2] min-h-[80vh]">
      {/* Hero Section */}
      <section className="text-center pt-16 pb-12 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 shadow-xl shadow-blue-500/25 mb-6">
          <Zap className="w-10 h-10 text-white fill-current" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Circuit<span className="text-blue-600">Lab</span>
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-slate-500 font-medium max-w-md mx-auto">
          Interactive Electricity Simulations
        </p>
      </section>

      {/* Simulation Cards Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {simulations.map((sim) => (
            <button
              key={sim.id}
              onClick={() => onSelectSim(sim.id)}
              className={`group relative bg-white rounded-2xl overflow-hidden text-left transition-all duration-200 shadow-sm hover:shadow-xl ${sim.hoverShadow} border border-slate-100 hover:border-slate-200 cursor-pointer`}
            >
              {/* Accent strip */}
              <div className={`h-1.5 ${sim.accent}`} />

              <div className="p-5">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${sim.accentBg} mb-4`}>
                  {sim.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {sim.title}
                </h3>

                {/* Formula tag */}
                <span className="inline-block mt-1 text-xs font-mono font-semibold text-slate-400">
                  {sim.formula}
                </span>

                {/* Description */}
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {sim.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;

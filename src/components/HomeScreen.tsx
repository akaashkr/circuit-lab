import React from 'react';
import { TabType } from '../types/physics';
import { 
  Zap, GitCommit, Cpu, Activity, Split, Flame, Trophy, 
  ArrowRight, Sparkles, CheckCircle2, Play
} from 'lucide-react';

interface HomeScreenProps {
  onSelectSim: (tab: TabType) => void;
}

interface SimCardData {
  id: TabType;
  title: string;
  badge: string;
  badgeColor: string;
  formula: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectSim }) => {
  const simulations: SimCardData[] = [
    {
      id: 'ohms-law',
      title: "Ohm's Law",
      badge: 'Core Law',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      formula: 'V = I · R',
      description: 'See how voltage, current, and resistance interact with giant letters that scale dynamically in real time.',
      features: ['Dynamic letter scaling', 'Real-time battery stacking', 'Microscopic scattering dots', 'Current direction arrows'],
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      gradient: 'from-blue-600 to-indigo-700'
    },
    {
      id: 'wire-resistance',
      title: 'Resistance in a Wire',
      badge: 'Conductor Physics',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      formula: 'R = (ρ · L) / A',
      description: 'Stretch the wire length, change cross-sectional thickness, and test real materials like Copper, Aluminum, and Nichrome.',
      features: ['3D conductor stretching', 'Material resistivity presets', 'Impurity collision density', 'Electron drift arrow'],
      icon: <GitCommit className="w-6 h-6 text-emerald-500" />,
      gradient: 'from-emerald-600 to-teal-700'
    },
    {
      id: 'circuit-builder',
      title: 'Circuit Construction Kit: DC',
      badge: 'DC Workbench',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      formula: 'I = V / R',
      description: 'Build complete DC circuits with batteries, light bulbs, resistors, and knife switches. Measure with realistic multimeter probes.',
      features: ['Drag & drop components', 'Dual-lead Voltmeter & Ammeter', 'Electrons vs Conventional flow', 'Realistic & schematic views'],
      icon: <Cpu className="w-6 h-6 text-orange-500" />,
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      id: 'circuit-builder-ac',
      title: 'Circuit Construction Kit: AC',
      badge: 'AC Electronics',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      formula: 'v(t) = V₀ · sin(2πft)',
      description: 'Explore alternating current circuits with AC voltage generators, capacitors, frequency controls, and a live oscilloscope waveform chart.',
      features: ['AC sine wave generator', 'Variable frequency slider', 'Live oscilloscope chart', 'Capacitive response'],
      icon: <Activity className="w-6 h-6 text-sky-500" />,
      gradient: 'from-sky-600 to-blue-700'
    },
    {
      id: 'series-parallel',
      title: 'Series & Parallel Circuits',
      badge: 'Circuit Analysis',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      formula: 'Req = R₁ + R₂  |  1/Req = 1/R₁ + 1/R₂',
      description: 'Compare series loops and parallel branches. Test glowing incandescent bulbs and flip branch switches to see why homes use parallel wiring.',
      features: ['Interactive light bulb glowing', 'Branch disconnect switches', 'Equivalent resistance solver', 'Power distribution analysis'],
      icon: <Split className="w-6 h-6 text-purple-500" />,
      gradient: 'from-purple-600 to-indigo-700'
    },
    {
      id: 'joules-law',
      title: "Joule's Heating & Power",
      badge: 'Thermal Energy',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      formula: 'H = I² · R · t  &  P = V · I',
      description: 'Power an immersion heating coil in a water calorimeter. Track heating power, boiling point, and live temperature curves over time.',
      features: ['Water calorimeter model', 'Real-time Temperature vs Time graph', 'Boiling bubbles animation', 'Power calculation gauge'],
      icon: <Flame className="w-6 h-6 text-red-500" />,
      gradient: 'from-red-600 to-rose-700'
    },
    {
      id: 'challenges',
      title: 'Electricity Challenges & Quiz',
      badge: 'Interactive Practice',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      formula: 'Concept Mastery',
      description: 'Test your physics knowledge with interactive circuit challenges, numerical calculations, and instant conceptual feedback.',
      features: ['Curriculum-aligned questions', 'Instant answer verification', 'Step-by-step explanations', 'Live score tracking'],
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      gradient: 'from-amber-600 to-yellow-600'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive Electricity Physics Suite</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Circuit<span className="text-blue-400">Lab</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Select an interactive laboratory simulation below to explore electric circuits, Ohm's law, wire resistance, AC waveforms, and electrical heating with real-time instruments.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Grid of Simulation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {simulations.map((sim) => (
          <div
            key={sim.id}
            onClick={() => onSelectSim(sim.id)}
            className="group cursor-pointer bg-white rounded-2xl border-2 border-slate-200/80 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 p-6 flex flex-col justify-between space-y-4 hover:-translate-y-1"
          >
            {/* Card Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  {sim.icon}
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${sim.badgeColor}`}>
                  {sim.badge}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {sim.title}
                </h3>
                {/* Clean Math Formula (No raw code) */}
                <div className="inline-block mt-1 font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  {sim.formula}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {sim.description}
              </p>

              {/* Feature bullet tags */}
              <div className="space-y-1 pt-1">
                {sim.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSim(sim.id);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 group-hover:bg-blue-600 text-slate-800 group-hover:text-white rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Simulation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

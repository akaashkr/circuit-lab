import React, { useState } from 'react';
import { TabType } from '../../types/physics';
import { CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';

interface Question {
  id: number;
  level: 'Fundamental' | 'Advanced';
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  simTarget: TabType;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    level: 'Fundamental',
    topic: "Ohm's Law",
    question: "If a circuit operates at a voltage of 6.0 V across a 300 Ω resistor, what is the electric current flowing through it?",
    options: ["2.0 mA", "20.0 mA", "50.0 mA", "1.8 A"],
    correctIndex: 1,
    explanation: "According to Ohm's Law: I = V / R = 6.0 V / 300 Ω = 0.02 A = 20.0 mA.",
    simTarget: 'ohms-law'
  },
  {
    id: 2,
    level: 'Fundamental',
    topic: "Resistance in a Wire",
    question: "A cylindrical copper wire has resistance R. If its length is doubled and its cross-sectional area is halved, its new resistance will be:",
    options: ["R (unchanged)", "2R", "4R", "R / 4"],
    correctIndex: 2,
    explanation: "R = (ρ · L) / A. When L becomes 2L and A becomes A/2, R' = ρ · (2L) / (A/2) = 4 · (ρ · L / A) = 4R.",
    simTarget: 'wire-resistance'
  },
  {
    id: 3,
    level: 'Fundamental',
    topic: "Series vs Parallel",
    question: "In a domestic household circuit, why are electrical appliances always connected in parallel rather than in series?",
    options: [
      "Because parallel connection saves electrical energy",
      "Because each appliance gets the full supply voltage and works independently",
      "Because current is greater in series connection",
      "Because parallel circuits require no switches"
    ],
    correctIndex: 1,
    explanation: "In parallel circuits, every appliance receives the full mains voltage (e.g. 120V or 230V) and turning off or removing one device does not break the circuit for others.",
    simTarget: 'series-parallel'
  },
  {
    id: 4,
    level: 'Advanced',
    topic: "Equivalent Resistance",
    question: "Three resistors of 20 Ω, 30 Ω, and 60 Ω are connected in parallel. What is their effective equivalent resistance?",
    options: ["110 Ω", "10 Ω", "36.6 Ω", "5 Ω"],
    correctIndex: 1,
    explanation: "1/Req = 1/20 + 1/30 + 1/60 = (3 + 2 + 1)/60 = 6/60 = 1/10. Therefore Req = 10 Ω.",
    simTarget: 'series-parallel'
  },
  {
    id: 5,
    level: 'Advanced',
    topic: "Joule's Heating Law",
    question: "An electric heater rated 1000 W operates on a 200 V supply line. What is the electrical resistance of the heater element?",
    options: ["40 Ω", "0.2 Ω", "200 Ω", "5 Ω"],
    correctIndex: 0,
    explanation: "Power P = V² / R  =>  R = V² / P = (200)² / 1000 = 40,000 / 1000 = 40 Ω.",
    simTarget: 'joules-law'
  },
  {
    id: 6,
    level: 'Advanced',
    topic: "Electric Circuits & Internal Resistance",
    question: "When the current drawn from a real battery increases, the terminal potential difference across the battery terminals:",
    options: [
      "Remains constant",
      "Increases linearly",
      "Decreases because of internal resistance (V = E - I · r)",
      "Becomes zero immediately"
    ],
    correctIndex: 2,
    explanation: "Terminal voltage V = E - I · r. As load current I increases, the internal potential drop (I · r) increases, reducing the terminal voltage.",
    simTarget: 'circuit-builder'
  }
];

interface ChallengesHubProps {
  onNavigateToSim: (tab: TabType) => void;
}

export const ChallengesHub: React.FC<ChallengesHubProps> = ({ onNavigateToSim }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState<{ [key: number]: boolean }>({});
  const [filterLevel, setFilterLevel] = useState<'all' | 'Fundamental' | 'Advanced'>('all');

  const handleSelect = (questionId: number, optionIdx: number) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = (questionId: number) => {
    if (selectedAnswers[questionId] !== undefined) {
      setSubmitted((prev) => ({ ...prev, [questionId]: true }));
    }
  };

  const filteredQuestions = QUESTIONS.filter(
    (q) => filterLevel === 'all' || q.level === filterLevel
  );

  const totalAnswered = Object.keys(submitted).length;
  const correctCount = Object.keys(submitted).filter(
    (id) => selectedAnswers[Number(id)] === QUESTIONS.find((q) => q.id === Number(id))?.correctIndex
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white tracking-wider">
              Concept Mastery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Electricity Practice Challenges & Quizzes
          </h1>
          <p className="text-sm text-blue-100">
            Apply your simulation findings to solve circuit calculations and test your understanding.
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[140px]">
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block">
            Your Score
          </span>
          <div className="text-3xl font-mono font-bold mt-1">
            {correctCount} / {QUESTIONS.length}
          </div>
          <span className="text-[11px] text-blue-200">
            {totalAnswered} Answered
          </span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
        {(['all', 'Fundamental', 'Advanced'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterLevel(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterLevel === filter
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter === 'all' ? 'All Questions' : filter}
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => {
          const isAnswered = submitted[q.id];
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {q.level}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {q.topic}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToSim(q.simTarget)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>Open Interactive Sim</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {q.id}. {q.question}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {q.options.map((opt, optIdx) => {
                  let optStyle = 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-800';
                  if (selected === optIdx) {
                    optStyle = 'border-blue-600 bg-blue-50/60 text-blue-900 font-semibold';
                  }
                  if (isAnswered) {
                    if (optIdx === q.correctIndex) {
                      optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    } else if (selected === optIdx && !isCorrect) {
                      optStyle = 'border-red-500 bg-red-50 text-red-900 line-through';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-start space-x-3 text-sm ${optStyle}`}
                    >
                      <span className="w-6 h-6 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-grow">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit / Verification Result */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                {!isAnswered ? (
                  <button
                    disabled={selected === undefined}
                    onClick={() => handleSubmit(q.id)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-emerald-700">Correct! Excellent understanding.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700">Incorrect. Check the explanation below:</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-7">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

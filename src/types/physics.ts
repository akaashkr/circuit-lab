export type TabType = 
  | 'home'
  | 'ohms-law' 
  | 'wire-resistance' 
  | 'circuit-builder' 
  | 'circuit-builder-ac'
  | 'series-parallel' 
  | 'joules-law'
  | 'challenges';

export interface ChallengeItem {
  id: string;
  title: string;
  topic: 'Ohm\'s Law' | 'Resistance in Wire' | 'Series/Parallel' | 'Heating Effect';
  description: string;
  question: string;
  hint: string;
  targetValue: number;
  tolerance: number;
  unit: string;
  simulationTab: TabType;
  checkFn: (state: any) => boolean;
}

import React, { useState, useEffect, useRef } from 'react';
import { ResetButton } from '../../components/ResetButton';
import { Flame, Play, Pause, RotateCcw, Thermometer, Zap, Info } from 'lucide-react';

export const JoulesHeatingSim: React.FC = () => {
  const [voltage, setVoltage] = useState<number>(24); // Volts
  const [resistance, setResistance] = useState<number>(12); // Ohms
  const [waterMass, setWaterMass] = useState<number>(200); // grams
  const [initialTemp] = useState<number>(20); // Celsius
  const [currentTemp, setCurrentTemp] = useState<number>(20);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Temperature history for live graph
  const [tempHistory, setTempHistory] = useState<{ time: number; temp: number }[]>([
    { time: 0, temp: 20 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics calculation
  const current = resistance > 0 ? voltage / resistance : 0; // Amperes
  const powerWatts = voltage * current; // Joules per second (Watts)
  const heatCapacityWater = 4.184; // J / (g * °C)

  // Simulation loop for heating
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedTime((prevTime) => {
        const nextTime = prevTime + 0.2;

        setCurrentTemp((prevTemp) => {
          if (prevTemp >= 100) return 100; // Boiling limit
          // dT = (P * dt) / (m * c)
          const dt = 0.2; // seconds
          const deltaT = (powerWatts * dt) / (waterMass * heatCapacityWater);
          const nextTemp = Math.min(100, prevTemp + deltaT);
          
          setTempHistory((prevHist) => {
            const updated = [...prevHist, { time: Math.round(nextTime * 10) / 10, temp: nextTemp }];
            return updated.slice(-120); // keep recent 120 points
          });

          return nextTemp;
        });

        return nextTime;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, powerWatts, waterMass]);

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    setVoltage(24);
    setResistance(12);
    setWaterMass(200);
    setCurrentTemp(20);
    setElapsedTime(0);
    setTempHistory([{ time: 0, temp: 20 }]);
  };

  // Render Calorimeter Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Glass Beaker
    const beakerX = 140;
    const beakerY = 70;
    const beakerW = 180;
    const beakerH = 200;

    // Water level
    const waterHeight = Math.min(beakerH * 0.8, (waterMass / 300) * (beakerH * 0.75) + 30);
    const waterY = beakerY + beakerH - waterHeight;

    // Water body
    const waterGrad = ctx.createLinearGradient(beakerX, waterY, beakerX, beakerY + beakerH);
    if (currentTemp > 80) {
      waterGrad.addColorStop(0, '#fdba74'); // Warm reddish water
      waterGrad.addColorStop(1, '#f97316');
    } else {
      waterGrad.addColorStop(0, '#93c5fd'); // Cool blue water
      waterGrad.addColorStop(1, '#3b82f6');
    }

    ctx.fillStyle = waterGrad;
    ctx.fillRect(beakerX + 4, waterY, beakerW - 8, waterHeight - 4);

    // Beaker outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(beakerX, beakerY);
    ctx.lineTo(beakerX, beakerY + beakerH);
    ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
    ctx.lineTo(beakerX + beakerW, beakerY);
    ctx.stroke();

    // Heating Element Coil (Submerged)
    const coilX = beakerX + beakerW / 2;
    const coilStartY = beakerY - 20;
    const coilBottomY = beakerY + beakerH - 30;

    // Coil Lead wires
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(coilX - 18, coilStartY);
    ctx.lineTo(coilX - 18, coilBottomY - 40);
    ctx.moveTo(coilX + 18, coilStartY);
    ctx.lineTo(coilX + 18, coilBottomY - 40);
    ctx.stroke();

    // Red-hot coil loops
    const coilGlow = isRunning && powerWatts > 10;
    ctx.lineWidth = 4;
    ctx.strokeStyle = coilGlow
      ? currentTemp > 60 ? '#ef4444' : '#f97316'
      : '#64748b';

    ctx.beginPath();
    for (let y = coilBottomY - 40; y <= coilBottomY; y += 8) {
      ctx.ellipse(coilX, y, 22, 6, 0, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Boiling Bubbles animation if temp > 80°C
    if (isRunning && currentTemp > 75) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 12; i++) {
        const bx = beakerX + 20 + ((i * 37 + (elapsedTime * 60)) % (beakerW - 40));
        const by = beakerY + beakerH - 20 - ((i * 47 + (elapsedTime * 80)) % waterHeight);
        ctx.beginPath();
        ctx.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Thermometer on the right side
    const thermX = beakerX + beakerW + 40;
    const thermY = beakerY + 10;
    const thermH = 180;
    const thermW = 12;

    // Glass tube
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(thermX, thermY, thermW, thermH, 6);
    ctx.fill();
    ctx.stroke();

    // Red Mercury column
    const mercuryHeight = ((currentTemp) / 100) * (thermH - 20);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(
      thermX + 2,
      thermY + thermH - 10 - mercuryHeight,
      thermW - 4,
      mercuryHeight,
      2
    );
    ctx.fill();

    // Bulb at bottom
    ctx.beginPath();
    ctx.arc(thermX + thermW / 2, thermY + thermH + 6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Temp graduation text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px font-mono';
    ctx.textAlign = 'left';
    ctx.fillText(`${currentTemp.toFixed(1)} °C`, thermX + 24, thermY + thermH - mercuryHeight);

  }, [currentTemp, waterMass, isRunning, powerWatts, elapsedTime]);

  // Render Temperature Graph
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Padding
    const pLeft = 40;
    const pRight = 20;
    const pTop = 20;
    const pBottom = 30;

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    for (let temp = 20; temp <= 100; temp += 20) {
      const y = pTop + ((100 - temp) / 80) * (height - pTop - pBottom);
      ctx.beginPath();
      ctx.moveTo(pLeft, y);
      ctx.lineTo(width - pRight, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px font-mono';
      ctx.textAlign = 'right';
      ctx.fillText(`${temp}°C`, pLeft - 6, y + 3);
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pLeft, pTop);
    ctx.lineTo(pLeft, height - pBottom);
    ctx.lineTo(width - pRight, height - pBottom);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time (seconds)', width / 2, height - 8);

    // Plot line
    if (tempHistory.length > 1) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const maxTime = Math.max(30, tempHistory[tempHistory.length - 1].time);

      tempHistory.forEach((pt, idx) => {
        const x = pLeft + (pt.time / maxTime) * (width - pLeft - pRight);
        const y = pTop + ((100 - pt.temp) / 80) * (height - pTop - pBottom);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [tempHistory]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-md bg-red-100 text-red-800 tracking-wider">
            Thermal Electricity
          </span>
          <span className="text-sm font-semibold text-slate-700">
            Joule's Heating Law (H = I² · R · t) & Electrical Power (P = V · I)
          </span>
        </div>

        {/* Start / Pause Heater button */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center space-x-2 px-5 py-2 rounded-xl font-bold shadow-md transition-all ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{isRunning ? 'Pause Heating' : 'Turn On Heater'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow">
        
        {/* Left 8 Cols: Visual Calorimeter + Graph */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Heating Power (P)</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-red-600">{powerWatts.toFixed(1)} W</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current (I)</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-blue-700">{current.toFixed(2)} A</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Water Temp (T)</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-amber-600">{currentTemp.toFixed(1)} °C</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Heat (H)</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-600">{(powerWatts * elapsedTime).toFixed(0)} J</span>
            </div>
          </div>

          {/* Stage: Canvas + Real-time Plot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Water Calorimeter Canvas */}
            <div className="bg-amber-50/40 rounded-2xl border-2 border-slate-300 shadow-sm p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-600 mb-2">Water Calorimeter with Heating Coil</span>
              <canvas
                ref={canvasRef}
                width={400}
                height={280}
                className="w-full max-w-[400px] h-auto block"
              />
            </div>

            {/* Temperature vs Time Live Graph */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-600 mb-2">Live Temperature vs Time Graph</span>
              <canvas
                ref={graphCanvasRef}
                width={400}
                height={280}
                className="w-full max-w-[400px] h-auto block"
              />
            </div>

          </div>

          {/* Formula Callout */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs sm:text-sm text-slate-600 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Physics Principles:</p>
              <p>
                • <strong>Joule's Heating Law</strong>: Heat produced in a conductor is proportional to the square of current (H ∝ I²), resistance (H ∝ R), and heating time (H ∝ t).
              </p>
              <p>
                • <strong>Specific Heat Formula</strong>: The temperature rise ΔT = H / (m · c), where water has a high specific heat capacity of 4.184 J/(g·°C).
              </p>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Sliders */}
        <div className="lg:col-span-4 bg-white rounded-2xl border-2 border-slate-800 shadow-xl p-6 flex flex-col justify-between space-y-6">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span>Calorimeter Controls</span>
          </h3>

          {/* Voltage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Heater Voltage (V)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {voltage} V
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="48"
              step="2"
              value={voltage}
              onChange={(e) => setVoltage(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Coil Resistance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Coil Resistance (R)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {resistance} Ω
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="2"
              value={resistance}
              onChange={(e) => setResistance(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Water Mass */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Water Volume (m)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {waterMass} g (mL)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={waterMass}
              onChange={(e) => setWaterMass(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Quick Presets */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Heating Scenarios
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => { setVoltage(48); setResistance(6); setWaterMass(100); }}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-center"
              >
                Fast Boil (High Power)
              </button>
              <button
                onClick={() => { setVoltage(12); setResistance(24); setWaterMass(300); }}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-center"
              >
                Gentle Simmer (Low P)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Reset Button */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
        <ResetButton onReset={handleReset} />
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ResetButton } from '../../components/ResetButton';
import { Info, Lightbulb, Zap, ToggleLeft, ToggleRight } from 'lucide-react';

export const SeriesParallelSim: React.FC = () => {
  const [circuitType, setCircuitType] = useState<'series' | 'parallel'>('series');
  const [voltage, setVoltage] = useState<number>(12); // Volts
  const [r1, setR1] = useState<number>(20); // Ohms
  const [r2, setR2] = useState<number>(30); // Ohms
  const [r3, setR3] = useState<number>(60); // Ohms

  // Switches for each component (true = closed/connected, false = open/broken)
  const [switch1, setSwitch1] = useState<boolean>(true);
  const [switch2, setSwitch2] = useState<boolean>(true);
  const [switch3, setSwitch3] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const flowOffset = useRef<number>(0);

  // Reset handler
  const handleReset = () => {
    setCircuitType('series');
    setVoltage(12);
    setR1(20);
    setR2(30);
    setR3(60);
    setSwitch1(true);
    setSwitch2(true);
    setSwitch3(true);
  };

  // Physics Calculations
  let req = 0;
  let iTotal = 0;
  let v1 = 0, v2 = 0, v3 = 0;
  let i1 = 0, i2 = 0, i3 = 0;
  let p1 = 0, p2 = 0, p3 = 0;

  if (circuitType === 'series') {
    // In series: all switches must be closed for circuit to be complete
    const isCircuitClosed = switch1 && switch2 && switch3;
    if (isCircuitClosed) {
      req = r1 + r2 + r3;
      iTotal = req > 0 ? voltage / req : 0;
      i1 = iTotal;
      i2 = iTotal;
      i3 = iTotal;
      v1 = i1 * r1;
      v2 = i2 * r2;
      v3 = i3 * r3;
      p1 = v1 * i1;
      p2 = v2 * i2;
      p3 = v3 * i3;
    } else {
      req = (switch1 ? r1 : 0) + (switch2 ? r2 : 0) + (switch3 ? r3 : 0);
      iTotal = 0;
      i1 = 0; i2 = 0; i3 = 0;
      v1 = 0; v2 = 0; v3 = 0;
      p1 = 0; p2 = 0; p3 = 0;
    }
  } else {
    // In parallel: each branch is independent across the same voltage
    let invReq = 0;
    if (switch1 && r1 > 0) {
      invReq += 1 / r1;
      v1 = voltage;
      i1 = voltage / r1;
      p1 = v1 * i1;
    }
    if (switch2 && r2 > 0) {
      invReq += 1 / r2;
      v2 = voltage;
      i2 = voltage / r2;
      p2 = v2 * i2;
    }
    if (switch3 && r3 > 0) {
      invReq += 1 / r3;
      v3 = voltage;
      i3 = voltage / r3;
      p3 = v3 * i3;
    }

    req = invReq > 0 ? 1 / invReq : 0;
    iTotal = i1 + i2 + i3;
  }

  // Canvas drawing for realistic schematic & glowing bulbs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Speed of electron drift
      const speed = Math.min(Math.max(iTotal * 2, 0.4), 6);
      flowOffset.current = (flowOffset.current + speed) % 24;

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1e293b';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (circuitType === 'series') {
        // --- SERIES CIRCUIT DIAGRAM ---
        const topY = 70;
        const botY = height - 70;
        const leftX = 70;
        const rightX = width - 70;

        // Left vertical wire (Battery side)
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, height / 2 - 30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftX, height / 2 + 30);
        ctx.lineTo(leftX, botY);
        ctx.stroke();

        // Battery symbol at (leftX, height / 2)
        // Long line (+)
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(leftX - 22, height / 2 - 12);
        ctx.lineTo(leftX + 22, height / 2 - 12);
        ctx.stroke();
        // Short line (-)
        ctx.lineWidth = 5;
        ctx.moveTo(leftX - 12, height / 2 + 12);
        ctx.lineTo(leftX + 12, height / 2 + 12);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+ ${voltage}V -`, leftX - 44, height / 2 + 4);

        // Right return wire
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(rightX, topY);
        ctx.lineTo(rightX, botY);
        ctx.stroke();

        // Bottom return wire
        ctx.beginPath();
        ctx.moveTo(leftX, botY);
        ctx.lineTo(rightX, botY);
        ctx.stroke();

        // Top wire with 3 bulbs spaced evenly
        const bulbX1 = leftX + (rightX - leftX) * 0.22;
        const bulbX2 = leftX + (rightX - leftX) * 0.50;
        const bulbX3 = leftX + (rightX - leftX) * 0.78;

        const drawBulb = (bx: number, by: number, power: number, isClosed: boolean, label: string, resistanceVal: number) => {
          // Connecting wires to bulb
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#1e293b';
          ctx.beginPath();
          ctx.moveTo(bx - 36, by);
          ctx.lineTo(bx - 16, by);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(bx + 16, by);
          ctx.lineTo(bx + 36, by);
          ctx.stroke();

          // Bulb Glow Aura if lit
          if (isClosed && power > 0) {
            const glowRadius = Math.min(18 + Math.sqrt(power) * 10, 50);
            const glow = ctx.createRadialGradient(bx, by, 6, bx, by, glowRadius);
            glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            glow.addColorStop(0.4, 'rgba(250, 204, 21, 0.6)');
            glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(bx, by, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Glass Bulb circle
          ctx.fillStyle = isClosed && power > 0 ? '#fef08a' : '#f1f5f9';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(bx, by, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Internal filament
          ctx.strokeStyle = isClosed && power > 0 ? '#ea580c' : '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx - 8, by + 10);
          ctx.lineTo(bx - 4, by - 6);
          ctx.lineTo(bx + 4, by - 6);
          ctx.lineTo(bx + 8, by + 10);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${label} (${resistanceVal}Ω)`, bx, by - 26);
          ctx.font = '11px font-mono';
          ctx.fillStyle = isClosed && power > 0 ? '#16a34a' : '#64748b';
          ctx.fillText(`${power.toFixed(2)} W`, bx, by + 34);
        };

        // Wire segments between bulbs
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(bulbX1 - 36, topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bulbX1 + 36, topY);
        ctx.lineTo(bulbX2 - 36, topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bulbX2 + 36, topY);
        ctx.lineTo(bulbX3 - 36, topY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bulbX3 + 36, topY);
        ctx.lineTo(rightX, topY);
        ctx.stroke();

        // Draw the 3 bulbs
        drawBulb(bulbX1, topY, p1, switch1, 'Bulb 1', r1);
        drawBulb(bulbX2, topY, p2, switch2, 'Bulb 2', r2);
        drawBulb(bulbX3, topY, p3, switch3, 'Bulb 3', r3);

      } else {
        // --- PARALLEL CIRCUIT DIAGRAM ---
        const leftX = 70;
        const branchX1 = 190;
        const branchX2 = 330;
        const branchX3 = 470;
        const topY = 60;
        const botY = height - 60;

        // Battery on left branch
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, height / 2 - 30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftX, height / 2 + 30);
        ctx.lineTo(leftX, botY);
        ctx.stroke();

        // Battery Symbol
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(leftX - 20, height / 2 - 12);
        ctx.lineTo(leftX + 20, height / 2 - 12);
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.moveTo(leftX - 10, height / 2 + 12);
        ctx.lineTo(leftX + 10, height / 2 + 12);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+ ${voltage}V -`, leftX - 44, height / 2 + 4);

        // Top busbar wire
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(branchX3, topY);
        ctx.stroke();

        // Bottom busbar wire
        ctx.beginPath();
        ctx.moveTo(leftX, botY);
        ctx.lineTo(branchX3, botY);
        ctx.stroke();

        const drawParallelBranch = (bx: number, power: number, isClosed: boolean, label: string, resVal: number, currentVal: number) => {
          // Upper wire down to bulb
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#1e293b';
          ctx.beginPath();
          ctx.moveTo(bx, topY);
          ctx.lineTo(bx, height / 2 - 24);
          ctx.stroke();

          // Lower wire up from bulb
          ctx.beginPath();
          ctx.moveTo(bx, height / 2 + 24);
          ctx.lineTo(bx, botY);
          ctx.stroke();

          // Junction nodes
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(bx, topY, 4, 0, Math.PI * 2);
          ctx.arc(bx, botY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Bulb Glow Aura
          if (isClosed && power > 0) {
            const glowRadius = Math.min(18 + Math.sqrt(power) * 10, 48);
            const glow = ctx.createRadialGradient(bx, height / 2, 6, bx, height / 2, glowRadius);
            glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            glow.addColorStop(0.4, 'rgba(250, 204, 21, 0.6)');
            glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(bx, height / 2, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Glass Bulb
          ctx.fillStyle = isClosed && power > 0 ? '#fef08a' : '#f1f5f9';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(bx, height / 2, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Filament
          ctx.strokeStyle = isClosed && power > 0 ? '#ea580c' : '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx - 6, height / 2 + 10);
          ctx.lineTo(bx - 3, height / 2 - 5);
          ctx.lineTo(bx + 3, height / 2 - 5);
          ctx.lineTo(bx + 6, height / 2 + 10);
          ctx.stroke();

          // Branch stats
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${label} (${resVal}Ω)`, bx, height / 2 - 30);

          ctx.font = 'bold 11px font-mono';
          ctx.fillStyle = isClosed && power > 0 ? '#ea580c' : '#94a3b8';
          ctx.fillText(`I = ${currentVal.toFixed(2)}A`, bx, height / 2 + 36);

          ctx.font = '10px font-mono';
          ctx.fillStyle = isClosed && power > 0 ? '#16a34a' : '#94a3b8';
          ctx.fillText(`P = ${power.toFixed(1)}W`, bx, height / 2 + 49);
        };

        drawParallelBranch(branchX1, p1, switch1, 'Branch 1', r1, i1);
        drawParallelBranch(branchX2, p2, switch2, 'Branch 2', r2, i2);
        drawParallelBranch(branchX3, p3, switch3, 'Branch 3', r3, i3);
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [circuitType, voltage, r1, r2, r3, switch1, switch2, switch3, iTotal, p1, p2, p3]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 tracking-wider">
            Circuit Combinations
          </span>
          <span className="text-sm font-semibold text-slate-600">
            Series & Parallel Resistors Combination & Kirchhoff's Rules
          </span>
        </div>

        {/* Mode Selector Toggle */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center shadow-inner">
          <button
            onClick={() => setCircuitType('series')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              circuitType === 'series'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Series Circuit
          </button>
          <button
            onClick={() => setCircuitType('parallel')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              circuitType === 'parallel'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parallel Circuit
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow">
        
        {/* Left 8 Cols: Live Interactive Schematic + Readout Cards */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Real-time Equivalent Resistance Formula Banner */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Equivalent Resistance (Req)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 flex items-baseline space-x-2">
                <span>{req > 0 ? req.toFixed(2) : 'Open Circuit (∞)'}</span>
                <span className="text-lg font-sans font-bold text-slate-500">Ω</span>
              </div>
            </div>

            {/* Formula breakdown */}
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-700">
              {circuitType === 'series' ? (
                <span>
                  Req = R₁ + R₂ + R₃ = {r1} + {r2} + {r3} = {r1 + r2 + r3} Ω
                </span>
              ) : (
                <span>
                  1/Req = 1/{r1} + 1/{r2} + 1/{r3} → Req = {req.toFixed(2)} Ω
                </span>
              )}
            </div>

            {/* Total Current */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Total Battery Current (Itotal)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-orange-600">
                {iTotal.toFixed(2)} A
              </div>
            </div>
          </div>

          {/* Interactive Schematic Canvas */}
          <div className="relative bg-amber-50/40 rounded-2xl border-2 border-slate-300 shadow-sm p-4 flex flex-col items-center justify-center">
            <canvas
              ref={canvasRef}
              width={560}
              height={320}
              className="w-full max-w-[560px] h-auto block"
            />

            {/* Switch Toggles underneath schematic */}
            <div className="w-full mt-2 pt-3 border-t border-amber-200/60 flex items-center justify-around text-xs">
              <button
                onClick={() => setSwitch1(!switch1)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  switch1
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300 line-through'
                }`}
              >
                <span>Bulb 1: {switch1 ? 'Connected' : 'Broken'}</span>
              </button>
              <button
                onClick={() => setSwitch2(!switch2)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  switch2
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300 line-through'
                }`}
              >
                <span>Bulb 2: {switch2 ? 'Connected' : 'Broken'}</span>
              </button>
              <button
                onClick={() => setSwitch3(!switch3)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  switch3
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300 line-through'
                }`}
              >
                <span>Bulb 3: {switch3 ? 'Connected' : 'Broken'}</span>
              </button>
            </div>
          </div>

          {/* Key Rule Callout */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs sm:text-sm text-slate-600 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">
                {circuitType === 'series'
                  ? 'Series Circuit Properties:'
                  : 'Parallel Circuit Properties:'}
              </p>
              {circuitType === 'series' ? (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Current is <strong>identical</strong> everywhere in a series loop (I = I₁ = I₂ = I₃).</li>
                  <li>Total voltage splits across resistors (V = V₁ + V₂ + V₃).</li>
                  <li>If any single bulb is removed/broken, the entire circuit is broken!</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Voltage is <strong>equal</strong> across each parallel branch (V = V₁ = V₂ = V₃).</li>
                  <li>Total current is the sum of branch currents (Itotal = I₁ + I₂ + I₃).</li>
                  <li>If one branch is disconnected, the other bulbs stay lit with unaffected brightness!</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Parameter Control Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border-2 border-slate-800 shadow-xl p-6 flex flex-col justify-between space-y-6">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Circuit Parameters</span>
          </h3>

          {/* Battery Voltage Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Source Voltage (V)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {voltage} V
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="48"
              step="1"
              value={voltage}
              onChange={(e) => setVoltage(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Resistor 1 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Resistor 1 (R₁)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {r1} Ω
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={r1}
              onChange={(e) => setR1(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Resistor 2 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Resistor 2 (R₂)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {r2} Ω
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={r2}
              onChange={(e) => setR2(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Resistor 3 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Resistor 3 (R₃)</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {r3} Ω
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={r3}
              onChange={(e) => setR3(parseInt(e.target.value, 10))}
              className="w-full accent-blue-700"
            />
          </div>

          {/* Quick Presets */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Preset Configurations
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => { setR1(30); setR2(30); setR3(30); setVoltage(18); }}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-center"
              >
                Identical Bulbs (30Ω)
              </button>
              <button
                onClick={() => { setR1(10); setR2(50); setR3(100); setVoltage(24); }}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-center"
              >
                Stepped Resistors
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

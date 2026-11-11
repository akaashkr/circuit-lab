import React, { useState, useEffect, useRef } from 'react';
import { ResetButton } from '../../components/ResetButton';
import { Info, Layers } from 'lucide-react';

// Preset real-world materials for Grade 10-12 physics
const MATERIAL_PRESETS = [
  { name: 'Silver', rho: 0.16, color: '#e2e8f0', desc: 'Best electrical conductor' },
  { name: 'Copper', rho: 0.17, color: '#f97316', desc: 'Standard household wiring' },
  { name: 'Gold', rho: 0.24, color: '#eab308', desc: 'Corrosion resistant connectors' },
  { name: 'Aluminum', rho: 0.28, color: '#cbd5e1', desc: 'High-voltage overhead lines' },
  { name: 'Tungsten', rho: 0.56, color: '#94a3b8', desc: 'Incandescent bulb filament' },
  { name: 'Iron', rho: 1.00, color: '#64748b', desc: 'High magnetic permeability' },
  { name: 'Nichrome', rho: 10.0, color: '#78716c', desc: 'Heating elements in toasters/heaters' },
  { name: 'Carbon/Graphite', rho: 35.0, color: '#334155', desc: 'Resistor cores & brushes' },
];

export const WireResistanceSim: React.FC = () => {
  // Resistivity ρ in Ω·cm (range 0.10 to 2.00, default 0.66)
  const [rho, setRho] = useState<number>(0.66);
  // Length L in cm (range 1.00 to 20.00, default 8.75)
  const [length, setLength] = useState<number>(8.75);
  // Area A in cm² (range 1.00 to 15.00, default 7.50)
  const [area, setArea] = useState<number>(7.50);

  // Active material preset if any
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Custom');

  // Calculate Resistance R = (rho * L) / A
  const resistance = (rho * length) / area;

  // Reset to screenshot defaults
  const handleReset = () => {
    setRho(0.66);
    setLength(8.75);
    setArea(7.50);
    setSelectedMaterial('Custom');
  };

  // Dynamic letter sizing
  // R: at 0.770 base ~68px, min 28px, max 130px
  const rScale = Math.min(Math.max((resistance / 0.77) * 64, 28), 130);
  // ρ: base ~48px
  const rhoScale = Math.min(Math.max((rho / 0.66) * 54, 24), 100);
  // L: base ~48px
  const lScale = Math.min(Math.max((length / 8.75) * 54, 24), 100);
  // A: base ~48px
  const aScale = Math.min(Math.max((area / 7.5) * 54, 24), 100);

  // Canvas for 3D Cylinder rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Compute visual geometry of the cylinder
    // Length: mapping length (1 to 20 cm) to pixels (e.g. 80px to 380px)
    const visualLength = 80 + (length / 20) * 300;
    // Area: mapping area (1 to 15 cm²) to diameter (24px to 110px)
    // D ~ 2 * sqrt(A / pi)
    const visualRadius = 18 + Math.sqrt(area / 15) * 44;
    const visualDiameter = visualRadius * 2;

    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const startX = centerX - visualLength / 2;
    const endX = centerX + visualLength / 2;
    const topY = centerY - visualRadius;
    const botY = centerY + visualRadius;

    const rx = 14; // ellipse horizontal radius for perspective
    const ry = visualRadius; // ellipse vertical radius

    // Material surface color gradient
    const grad = ctx.createLinearGradient(startX, topY, startX, botY);
    grad.addColorStop(0, '#d97736');
    grad.addColorStop(0.25, '#fdba74');
    grad.addColorStop(0.65, '#ea580c');
    grad.addColorStop(1, '#9a3412');

    // 1. Draw main cylinder body
    ctx.save();
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(startX, topY);
    ctx.lineTo(endX, topY);
    ctx.ellipse(endX, centerY, rx, ry, 0, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(startX, botY);
    ctx.ellipse(startX, centerY, rx, ry, 0, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Right endcap ellipse
    ctx.beginPath();
    ctx.ellipse(endX, centerY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    ctx.stroke();

    // 3. Left endcap ellipse
    ctx.beginPath();
    ctx.ellipse(startX, centerY, rx, ry, 0, 0, Math.PI * 2);
    const leftCapGrad = ctx.createRadialGradient(
      startX - 4,
      centerY - 4,
      4,
      startX,
      centerY,
      ry
    );
    leftCapGrad.addColorStop(0, '#fed7aa');
    leftCapGrad.addColorStop(0.8, '#c2410c');
    leftCapGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = leftCapGrad;
    ctx.fill();
    ctx.stroke();

    // 4. Draw impurity scattering dots based on resistivity rho
    // Density is proportional to rho
    const numDots = Math.floor(rho * 120) + 12;
    ctx.fillStyle = '#18181b';

    // Clip to cylinder interior so dots don't spill out
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, topY, visualLength, visualDiameter);
    ctx.clip();

    for (let i = 0; i < numDots; i++) {
      // Deterministic pseudorandom distribution
      const px = startX + ((i * 73 + 19) % 997) / 997 * visualLength;
      const py = topY + 4 + ((i * 137 + 41) % 991) / 991 * (visualDiameter - 8);
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();

    // 5. Draw electron flow drift arrow underneath (as seen in screenshot)
    const arrowY = botY + 28;
    const arrowW = Math.min(100, visualLength * 0.6);
    const arrowX = centerX - arrowW / 2;

    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.fillStyle = '#f8fafc';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    // Arrow shaft
    ctx.moveTo(arrowX, arrowY - 5);
    ctx.lineTo(arrowX + arrowW - 14, arrowY - 5);
    ctx.lineTo(arrowX + arrowW - 14, arrowY - 10);
    // Arrow point
    ctx.lineTo(arrowX + arrowW, arrowY);
    ctx.lineTo(arrowX + arrowW - 14, arrowY + 10);
    ctx.lineTo(arrowX + arrowW - 14, arrowY + 5);
    ctx.lineTo(arrowX, arrowY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

  }, [rho, length, area]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-md bg-blue-100 text-blue-800 tracking-wider">
            Wire Resistance
          </span>
          <span className="text-sm font-semibold text-slate-600">
            R = (ρ · L) / A • Factors Affecting Electrical Resistance of a Conductor
          </span>
        </div>

        {/* Real Material Presets Selector */}
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase">Material:</span>
          <select
            value={selectedMaterial}
            onChange={(e) => {
              const mat = MATERIAL_PRESETS.find((m) => m.name === e.target.value);
              if (mat) {
                setRho(mat.rho);
                setSelectedMaterial(mat.name);
              } else {
                setSelectedMaterial('Custom');
              }
            }}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Custom">Custom Value</option>
            {MATERIAL_PRESETS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.rho} Ω·cm)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow">
        
        {/* Left 8 Cols: Dynamic Fraction Equation + Physical Wire Stage */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-6">
          
          {/* Dynamic Formula: R = (ρ · L) / A */}
          <div className="h-44 flex items-center justify-center space-x-4 sm:space-x-8 select-none transition-all duration-150">
            {/* R Letter */}
            <div className="flex items-center justify-center" style={{ minWidth: '100px' }}>
              <span
                style={{ fontSize: `${rScale}px` }}
                className="font-serif font-bold text-[#dc2626] leading-none transition-all duration-75 drop-shadow-sm"
              >
                R
              </span>
            </div>

            {/* Equals Sign */}
            <span className="font-serif font-bold text-4xl sm:text-6xl text-slate-900 leading-none">
              =
            </span>

            {/* Fraction Container */}
            <div className="flex flex-col items-center justify-center">
              {/* Numerator: ρ and L */}
              <div className="flex items-center justify-center space-x-4 pb-1">
                <span
                  style={{ fontSize: `${rhoScale}px` }}
                  className="font-serif font-bold text-[#0220a6] leading-none transition-all duration-75"
                >
                  ρ
                </span>
                <span
                  style={{ fontSize: `${lScale}px` }}
                  className="font-serif font-bold text-[#0220a6] leading-none transition-all duration-75"
                >
                  L
                </span>
              </div>

              {/* Fraction Bar */}
              <div className="w-full min-w-[140px] sm:min-w-[190px] h-[3px] bg-slate-900 my-1 rounded-full"></div>

              {/* Denominator: A */}
              <div className="flex items-center justify-center pt-1">
                <span
                  style={{ fontSize: `${aScale}px` }}
                  className="font-serif font-bold text-[#0220a6] leading-none transition-all duration-75"
                >
                  A
                </span>
              </div>
            </div>
          </div>

          {/* Wire Visualizer Container */}
          <div className="w-full max-w-[620px] bg-amber-50/40 rounded-2xl border-2 border-slate-300 shadow-sm p-4 flex flex-col items-center justify-center min-h-[280px]">
            <canvas
              ref={canvasRef}
              width={560}
              height={220}
              className="w-full max-w-[560px] h-auto block"
            />
          </div>

          {/* Educational Insights Card */}
          <div className="w-full max-w-[620px] bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3 text-xs sm:text-sm text-slate-600">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Physical Interpretation:</p>
              <p>
                • <span className="font-bold text-blue-700">Length (L)</span>: Doubling wire length doubles the resistance (R ∝ L) because electrons collide with twice as many atoms.
              </p>
              <p>
                • <span className="font-bold text-blue-700">Area (A)</span>: Increasing thickness lowers resistance (R ∝ 1/A) because a wider cross-section provides more parallel channels for electrons.
              </p>
              <p>
                • <span className="font-bold text-blue-700">Resistivity (ρ)</span>: Intrinsic property of the material representing scattering density.
              </p>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Vertical Sliders Control Panel */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-full max-w-[340px] bg-white rounded-2xl border-2 border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
            {/* Top Resistance Readout (in red matching screenshot) */}
            <div className="text-center mb-6">
              <span className="text-lg sm:text-xl font-bold text-[#dc2626] font-mono">
                resistance = {resistance.toFixed(3)} ohms
              </span>
            </div>

            {/* 3 Vertical Sliders */}
            <div className="grid grid-cols-3 gap-3 text-center">
              
              {/* 1. Resistivity ρ */}
              <div className="flex flex-col items-center space-y-3">
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0220a6]">ρ</div>
                  <div className="text-[10px] font-semibold text-blue-900 tracking-wider">resistivity</div>
                </div>

                <div className="h-56 flex items-center justify-center py-2">
                  <input
                    type="range"
                    min="0.10"
                    max="2.00"
                    step="0.01"
                    value={rho}
                    onChange={(e) => {
                      setRho(parseFloat(e.target.value));
                      setSelectedMaterial('Custom');
                    }}
                    className="vertical-slider h-48 w-6 accent-blue-700"
                    aria-label="Resistivity in Ohm-cm"
                  />
                </div>

                <div className="font-bold text-xs sm:text-sm text-[#0220a6] font-mono">
                  {rho.toFixed(2)}
                  <span className="block text-[11px] text-blue-800 font-sans">Ω·cm</span>
                </div>
              </div>

              {/* 2. Length L */}
              <div className="flex flex-col items-center space-y-3">
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0220a6]">L</div>
                  <div className="text-[10px] font-semibold text-blue-900 tracking-wider">length</div>
                </div>

                <div className="h-56 flex items-center justify-center py-2">
                  <input
                    type="range"
                    min="1.00"
                    max="20.00"
                    step="0.25"
                    value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value))}
                    className="vertical-slider h-48 w-6 accent-blue-700"
                    aria-label="Length in cm"
                  />
                </div>

                <div className="font-bold text-xs sm:text-sm text-[#0220a6] font-mono">
                  {length.toFixed(2)}
                  <span className="block text-[11px] text-blue-800 font-sans">cm</span>
                </div>
              </div>

              {/* 3. Area A */}
              <div className="flex flex-col items-center space-y-3">
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0220a6]">A</div>
                  <div className="text-[10px] font-semibold text-blue-900 tracking-wider">area</div>
                </div>

                <div className="h-56 flex items-center justify-center py-2">
                  <input
                    type="range"
                    min="1.00"
                    max="15.00"
                    step="0.25"
                    value={area}
                    onChange={(e) => setArea(parseFloat(e.target.value))}
                    className="vertical-slider h-48 w-6 accent-blue-700"
                    aria-label="Cross-sectional area in cm squared"
                  />
                </div>

                <div className="font-bold text-xs sm:text-sm text-[#0220a6] font-mono">
                  {area.toFixed(2)}
                  <span className="block text-[11px] text-blue-800 font-sans">cm²</span>
                </div>
              </div>

            </div>

            {/* Quick Presets Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Experiment Presets
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => { setRho(0.17); setLength(10.0); setArea(5.0); setSelectedMaterial('Copper'); }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-center"
                >
                  Thick Copper Wire
                </button>
                <button
                  onClick={() => { setRho(1.50); setLength(18.0); setArea(1.5); setSelectedMaterial('Custom'); }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700 text-center"
                >
                  Thin High-R Wire
                </button>
              </div>
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

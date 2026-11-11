import React, { useState, useEffect, useRef } from 'react';
import { ResetButton } from '../../components/ResetButton';
import { Info, Sparkles, AlertTriangle } from 'lucide-react';

export const OhmsLawSim: React.FC = () => {
  // State: Voltage in Volts (0.1V to 9.0V, default 4.5V)
  const [voltage, setVoltage] = useState<number>(4.5);
  // State: Resistance in Ohms (10 to 1000 Ohms, default 500 Ohms)
  const [resistance, setResistance] = useState<number>(500);
  // Optional toggles
  const [showElectrons, setShowElectrons] = useState<boolean>(true);

  // Derived values
  const currentAmps = voltage / resistance; // in Amperes
  const currentMilliamps = currentAmps * 1000; // in mA

  // Reset handler
  const handleReset = () => {
    setVoltage(4.5);
    setResistance(500);
  };

  // Dynamic font sizing for V = I · R letters
  // V base ~60px, min 24px, max 110px
  const vScale = Math.min(Math.max((voltage / 4.5) * 64, 28), 120);
  // R base ~60px, min 24px, max 110px
  const rScale = Math.min(Math.max((resistance / 500) * 64, 28), 120);
  // I scale: at 9mA base ~48px, min 18px, max 130px
  const iScale = Math.min(Math.max((currentMilliamps / 9.0) * 48, 16), 130);

  // Batteries count based on 1.5V cells
  const batteryCount = Math.max(1, Math.min(6, Math.round(voltage / 1.5)));

  // Canvas animation for circuit, electrons and dots
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const electronOffset = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    // Resistor internal scatter dots (deterministic based on seed)
    const dotCount = Math.floor((resistance / 1000) * 160) + 15;
    const dots: { x: number; y: number }[] = [];
    for (let i = 0; i < 200; i++) {
      dots.push({
        x: ((i * 37 + 13) % 190) / 190,
        y: ((i * 73 + 29) % 32) / 32,
      });
    }

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Circuit dimensions
      const loopLeft = 60;
      const loopRight = width - 60;
      const loopTop = 50;
      const loopBottom = height - 50;
      const wireWidth = 6;

      // Draw Main Circuit Wire (black thick rounded rectangle)
      ctx.lineWidth = wireWidth;
      ctx.strokeStyle = '#111827';
      ctx.lineJoin = 'miter';

      // Top wire (broken in middle for batteries)
      const batWidth = 52;
      const totalBatWidth = batteryCount * batWidth;
      const batStartX = (loopLeft + loopRight) / 2 - totalBatWidth / 2;

      // Left wire
      ctx.beginPath();
      ctx.moveTo(loopLeft, loopBottom);
      ctx.lineTo(loopLeft, loopTop);
      ctx.lineTo(batStartX, loopTop);
      ctx.stroke();

      // Right wire from battery to bottom
      ctx.beginPath();
      ctx.moveTo(batStartX + totalBatWidth, loopTop);
      ctx.lineTo(loopRight, loopTop);
      ctx.lineTo(loopRight, loopBottom);
      ctx.stroke();

      // Bottom wire leading to resistor
      const resWidth = 200;
      const resHeight = 38;
      const resX = (loopLeft + loopRight) / 2 - resWidth / 2;
      const resY = loopBottom - resHeight / 2;

      ctx.beginPath();
      ctx.moveTo(loopLeft, loopBottom);
      ctx.lineTo(resX, loopBottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(resX + resWidth, loopBottom);
      ctx.lineTo(loopRight, loopBottom);
      ctx.stroke();

      // --- Draw Realistic Batteries (1.5V cells in series) ---
      for (let b = 0; b < batteryCount; b++) {
        const bx = batStartX + b * batWidth;
        const by = loopTop - 18;
        const bw = batWidth - 6;
        const bh = 36;

        // Battery body gradient (metallic blue/grey casing)
        const batGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
        batGrad.addColorStop(0, '#64748b');
        batGrad.addColorStop(0.3, '#cbd5e1');
        batGrad.addColorStop(0.7, '#475569');
        batGrad.addColorStop(1, '#1e293b');

        ctx.fillStyle = batGrad;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);

        // Terminal (+) nipple
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(bx + bw, by + 10, 5, bh - 20);
        ctx.strokeRect(bx + bw, by + 10, 5, bh - 20);

        // Voltage label on battery
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1.5 V', bx + bw / 2, by + bh / 2);
      }

      // --- Draw Resistor Cylinder (3D shaded red/orange with end-caps) ---
      const cylGrad = ctx.createLinearGradient(resX, resY, resX, resY + resHeight);
      cylGrad.addColorStop(0, '#f87171');
      cylGrad.addColorStop(0.3, '#fca5a5');
      cylGrad.addColorStop(0.6, '#ef4444');
      cylGrad.addColorStop(1, '#991b1b');

      ctx.save();
      // Resistor body
      ctx.fillStyle = cylGrad;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(resX, resY, resWidth, resHeight, 4);
      ctx.fill();
      ctx.stroke();

      // Left ellipse endcap (giving 3D cylinder depth)
      ctx.beginPath();
      ctx.ellipse(resX + 1, resY + resHeight / 2, 7, resHeight / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f87171';
      ctx.fill();
      ctx.stroke();

      // Resistor Impurity Dots (Scattering centers)
      ctx.fillStyle = '#111827';
      for (let i = 0; i < Math.min(dotCount, dots.length); i++) {
        const dot = dots[i];
        const dx = resX + 10 + dot.x * (resWidth - 20);
        const dy = resY + 4 + dot.y * (resHeight - 8);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- Draw Conventional Current Arrows (Orange corner arrows) ---
      const arrowSize = 14;
      ctx.strokeStyle = '#ea580c';
      ctx.fillStyle = '#ea580c';
      ctx.lineWidth = 3.5;

      // Bottom right corner (pointing left)
      const brX = loopRight - 30;
      const brY = loopBottom + 18;
      ctx.beginPath();
      ctx.moveTo(brX + 24, brY);
      ctx.lineTo(brX, brY);
      ctx.lineTo(brX, brY - 14);
      ctx.stroke();
      // Arrowhead pointing left
      ctx.beginPath();
      ctx.moveTo(brX - 6, brY);
      ctx.lineTo(brX + 6, brY - 6);
      ctx.lineTo(brX + 6, brY + 6);
      ctx.closePath();
      ctx.fill();

      // Bottom left corner (pointing up)
      const blX = loopLeft - 18;
      const blY = loopBottom - 10;
      ctx.beginPath();
      ctx.moveTo(blX + 14, blY + 20);
      ctx.lineTo(blX, blY + 20);
      ctx.lineTo(blX, blY);
      ctx.stroke();
      // Arrowhead pointing up
      ctx.beginPath();
      ctx.moveTo(blX, blY - 6);
      ctx.lineTo(blX - 6, blY + 6);
      ctx.lineTo(blX + 6, blY + 6);
      ctx.closePath();
      ctx.fill();

      // --- Animated Flowing Electrons (if enabled) ---
      if (showElectrons && currentAmps > 0) {
        // Electron speed proportional to current
        const speed = Math.min(Math.max(currentMilliamps * 0.12, 0.4), 8);
        electronOffset.current = (electronOffset.current + speed) % 20;

        // Path perimeter points for electron flow (flowing counter-clockwise: negative to positive)
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;

        // Step along wire segments
        const spacing = 22;
        // Top wire electrons
        for (let x = loopLeft; x <= loopRight; x += spacing) {
          const ex = (x - electronOffset.current);
          if (ex >= loopLeft && ex <= loopRight) {
            ctx.beginPath();
            ctx.arc(ex, loopTop, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
        // Right wire electrons
        for (let y = loopTop; y <= loopBottom; y += spacing) {
          const ey = (y - electronOffset.current);
          if (ey >= loopTop && ey <= loopBottom) {
            ctx.beginPath();
            ctx.arc(loopRight, ey, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
        // Bottom wire electrons
        for (let x = loopRight; x >= loopLeft; x -= spacing) {
          const ex = (x + electronOffset.current);
          if (ex >= loopLeft && ex <= loopRight) {
            // inside resistor or wire
            ctx.beginPath();
            ctx.arc(ex, loopBottom, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
        // Left wire electrons
        for (let y = loopBottom; y >= loopTop; y -= spacing) {
          const ey = (y + electronOffset.current);
          if (ey >= loopTop && ey <= loopBottom) {
            ctx.beginPath();
            ctx.arc(loopLeft, ey, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [voltage, resistance, batteryCount, showElectrons, currentAmps, currentMilliamps]);

  // Format current with dynamic units
  const formattedCurrent =
    currentMilliamps < 1.0
      ? `${(currentMilliamps * 1000).toFixed(1)} µA`
      : currentMilliamps >= 1000
      ? `${currentAmps.toFixed(2)} A`
      : `${currentMilliamps.toFixed(1)} mA`;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-md bg-blue-100 text-blue-800 tracking-wider">
            Ohm's Law
          </span>
          <span className="text-sm font-semibold text-slate-600">
            V = I × R • Relationship between Potential Difference, Current & Resistance
          </span>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showElectrons}
              onChange={(e) => setShowElectrons(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="font-medium text-slate-700">Show Electrons Flow</span>
          </label>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow">
        
        {/* Left 8 Cols: Dynamic Equation + Circuit Stage */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-6">
          
          {/* Dynamic Formula: V = I · R */}
          <div className="h-36 flex items-center justify-center space-x-4 sm:space-x-8 select-none transition-all duration-150">
            {/* V Letter */}
            <div className="flex items-center justify-center" style={{ minWidth: '100px' }}>
              <span
                style={{ fontSize: `${vScale}px` }}
                className="font-serif font-bold text-[#0220a6] leading-none transition-all duration-75 drop-shadow-sm"
              >
                V
              </span>
            </div>

            {/* Equals Sign */}
            <span className="font-serif font-bold text-4xl sm:text-6xl text-slate-900 leading-none">
              =
            </span>

            {/* I Letter */}
            <div className="flex items-center justify-center" style={{ minWidth: '90px' }}>
              <span
                style={{ fontSize: `${iScale}px` }}
                className="font-serif font-bold text-[#ea580c] leading-none transition-all duration-75 drop-shadow-sm"
              >
                I
              </span>
            </div>

            {/* Dot */}
            <span className="font-serif font-bold text-4xl sm:text-6xl text-slate-900 leading-none">
              ·
            </span>

            {/* R Letter */}
            <div className="flex items-center justify-center" style={{ minWidth: '110px' }}>
              <span
                style={{ fontSize: `${rScale}px` }}
                className="font-serif font-bold text-[#0220a6] leading-none transition-all duration-75 drop-shadow-sm"
              >
                R
              </span>
            </div>
          </div>

          {/* Circuit Canvas Container */}
          <div className="relative w-full max-w-[620px] bg-amber-50/40 rounded-2xl border-2 border-slate-300 shadow-sm p-4 flex flex-col items-center">
            
            {/* Real-time Current readout floating badge */}
            <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm px-6 py-2 rounded-xl border-2 border-slate-800 shadow-md flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-bold text-[#ea580c]">
                current =
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                {formattedCurrent}
              </span>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={560}
              height={300}
              className="w-full max-w-[560px] h-auto block"
            />

            {/* High Current Warning */}
            {currentMilliamps > 250 && (
              <div className="mt-2 flex items-center space-x-2 text-xs font-semibold text-amber-700 bg-amber-100/90 px-3 py-1 rounded-full animate-bounce">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>High Current Warning: Resistor is heating up rapidly!</span>
              </div>
            )}
          </div>

          {/* Physical Interpretation Explainer Card */}
          <div className="w-full max-w-[620px] bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3 text-xs sm:text-sm text-slate-600">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Direct Observations:</p>
              <p>
                • As you increase <span className="font-bold text-blue-700">Voltage (V)</span>, more batteries appear and the electron push strengthens, causing the current <span className="font-bold text-orange-600">I</span> letter to grow.
              </p>
              <p>
                • As you increase <span className="font-bold text-blue-700">Resistance (R)</span>, the internal scatterer dots multiply, impeding electron flow and shrinking the current <span className="font-bold text-orange-600">I</span> letter.
              </p>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Vertical Sliders Control Panel */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="w-full max-w-[340px] bg-white rounded-2xl border-2 border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-6 text-center">
              
              {/* Voltage Slider Column */}
              <div className="flex flex-col items-center space-y-4">
                <div className="space-y-0.5">
                  <div className="text-3xl font-serif font-bold text-[#0220a6]">V</div>
                  <div className="text-xs font-semibold text-blue-900 tracking-wider">voltage</div>
                </div>

                {/* Vertical Range Slider */}
                <div className="h-64 flex items-center justify-center py-2">
                  <input
                    type="range"
                    min="0.1"
                    max="9.0"
                    step="0.1"
                    value={voltage}
                    onChange={(e) => setVoltage(parseFloat(e.target.value))}
                    className="vertical-slider h-56 w-8 accent-blue-700"
                    aria-label="Voltage in Volts"
                  />
                </div>

                {/* Value Readout */}
                <div className="font-bold text-lg sm:text-xl text-[#0220a6] font-mono bg-blue-50/80 px-3 py-1 rounded-lg border border-blue-200">
                  {voltage.toFixed(1)} V
                </div>
              </div>

              {/* Resistance Slider Column */}
              <div className="flex flex-col items-center space-y-4">
                <div className="space-y-0.5">
                  <div className="text-3xl font-serif font-bold text-[#0220a6]">R</div>
                  <div className="text-xs font-semibold text-blue-900 tracking-wider">resistance</div>
                </div>

                {/* Vertical Range Slider */}
                <div className="h-64 flex items-center justify-center py-2">
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={resistance}
                    onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                    className="vertical-slider h-56 w-8 accent-blue-700"
                    aria-label="Resistance in Ohms"
                  />
                </div>

                {/* Value Readout */}
                <div className="font-bold text-lg sm:text-xl text-[#0220a6] font-mono bg-blue-50/80 px-3 py-1 rounded-lg border border-blue-200">
                  {resistance} Ω
                </div>
              </div>

            </div>

            {/* Quick Presets */}
            <div className="mt-8 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Quick Presets
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => { setVoltage(1.5); setResistance(500); }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700"
                >
                  1 Cell (1.5V)
                </button>
                <button
                  onClick={() => { setVoltage(4.5); setResistance(500); }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700"
                >
                  Standard (4.5V)
                </button>
                <button
                  onClick={() => { setVoltage(9.0); setResistance(100); }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700"
                >
                  Max Power
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Reset Button matching the screenshot (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
        <ResetButton onReset={handleReset} />
      </div>
    </div>
  );
};

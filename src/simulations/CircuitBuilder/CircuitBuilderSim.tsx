import React, { useState, useEffect, useRef } from 'react';
import { ResetButton } from '../../components/ResetButton';
import { 
  Play, Pause, StepForward, ZoomIn, ZoomOut, Trash2, 
  RotateCw, Plus, Minus, Clock, Eye, Activity, Shield
} from 'lucide-react';

export type CurrentFlowMode = 'electrons' | 'conventional';
export type ViewMode = 'lifelike' | 'schematic';

interface CircuitComponent {
  id: string;
  type: 'wire' | 'battery' | 'ac-source' | 'bulb' | 'resistor' | 'switch' | 'capacitor' | 'inductor';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // in degrees (0, 90, 180, 270)
  value: number; // V for battery/AC, Ohms for resistor, etc.
  isOpen?: boolean; // for switch
  label: string;
}

interface Probe {
  x: number;
  y: number;
}

interface CircuitBuilderSimProps {
  initialMode?: 'DC' | 'AC';
}

export const CircuitBuilderSim: React.FC<CircuitBuilderSimProps> = ({ initialMode = 'DC' }) => {
  const [labMode, setLabMode] = useState<'DC' | 'AC'>(initialMode);
  const [viewMode, setViewMode] = useState<ViewMode>('lifelike');
  const [showCurrent, setShowCurrent] = useState<boolean>(true);
  const [currentType, setCurrentType] = useState<CurrentFlowMode>('electrons');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showValues, setShowValues] = useState<boolean>(true);
  const [showStopwatch, setShowStopwatch] = useState<boolean>(false);
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  // Tools toggles
  const [showVoltmeter, setShowVoltmeter] = useState<boolean>(true);
  const [showAmmeter, setShowAmmeter] = useState<boolean>(true);
  const [showOscilloscope, setShowOscilloscope] = useState<boolean>(false);

  // Simulation execution state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // Probes positions
  const [voltmeterPos, setVoltmeterPos] = useState<{ x: number; y: number }>({ x: 420, y: 70 });
  const [redProbe, setRedProbe] = useState<Probe>({ x: 340, y: 130 });
  const [blackProbe, setBlackProbe] = useState<Probe>({ x: 140, y: 130 });
  
  const [ammeterPos, setAmmeterPos] = useState<{ x: number; y: number }>({ x: 420, y: 190 });
  const [ammeterProbe, setAmmeterProbe] = useState<Probe>({ x: 240, y: 90 });

  // Dragging interaction state
  const [draggingTarget, setDraggingTarget] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pre-configured components on the canvas
  const [components, setComponents] = useState<CircuitComponent[]>([
    {
      id: 'bat-1',
      type: 'battery',
      x: 100,
      y: 190,
      width: 70,
      height: 32,
      angle: 270,
      value: 9.0,
      label: 'Battery'
    },
    {
      id: 'switch-1',
      type: 'switch',
      x: 240,
      y: 90,
      width: 80,
      height: 30,
      angle: 0,
      value: 0,
      isOpen: false,
      label: 'Switch'
    },
    {
      id: 'bulb-1',
      type: 'bulb',
      x: 380,
      y: 190,
      width: 60,
      height: 60,
      angle: 90,
      value: 10.0,
      label: 'Light Bulb'
    },
    {
      id: 'res-1',
      type: 'resistor',
      x: 240,
      y: 290,
      width: 80,
      height: 26,
      angle: 180,
      value: 20.0,
      label: 'Resistor'
    }
  ]);

  // AC Frequency and time tracking
  const [acFrequency, setAcFrequency] = useState<number>(2.0); // Hz
  const timeRef = useRef<number>(0);
  const waveHistory = useRef<{ t: number; v: number; i: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Stopwatch timer
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Reset Lab
  const handleReset = () => {
    setComponents([
      {
        id: 'source-1',
        type: labMode === 'AC' ? 'ac-source' : 'battery',
        x: 100,
        y: 190,
        width: 70,
        height: 32,
        angle: 270,
        value: labMode === 'AC' ? 12.0 : 9.0,
        label: labMode === 'AC' ? 'AC Source' : 'Battery'
      },
      {
        id: 'switch-1',
        type: 'switch',
        x: 240,
        y: 90,
        width: 80,
        height: 30,
        angle: 0,
        value: 0,
        isOpen: false,
        label: 'Switch'
      },
      {
        id: 'bulb-1',
        type: 'bulb',
        x: 380,
        y: 190,
        width: 60,
        height: 60,
        angle: 90,
        value: 10.0,
        label: 'Light Bulb'
      },
      {
        id: 'res-1',
        type: 'resistor',
        x: 240,
        y: 290,
        width: 80,
        height: 26,
        angle: 180,
        value: 20.0,
        label: 'Resistor'
      }
    ]);
    setRedProbe({ x: 340, y: 130 });
    setBlackProbe({ x: 140, y: 130 });
    setAmmeterProbe({ x: 240, y: 90 });
    setSelectedCompId(null);
    setStopwatchTime(0);
    setIsStopwatchRunning(false);
  };

  // Add component from Drawer
  const addComponent = (type: CircuitComponent['type']) => {
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    let initialValue = 10;
    let label = 'Wire';

    if (type === 'battery') { initialValue = 9.0; label = 'Battery'; }
    if (type === 'ac-source') { initialValue = 12.0; label = 'AC Voltage'; }
    if (type === 'bulb') { initialValue = 10.0; label = 'Light Bulb'; }
    if (type === 'resistor') { initialValue = 10.0; label = 'Resistor'; }
    if (type === 'switch') { initialValue = 0; label = 'Switch'; }
    if (type === 'capacitor') { initialValue = 0.1; label = 'Capacitor'; }
    if (type === 'inductor') { initialValue = 5.0; label = 'Inductor'; }

    const newComp: CircuitComponent = {
      id: newId,
      type,
      x: 200 + Math.random() * 80,
      y: 150 + Math.random() * 80,
      width: type === 'bulb' ? 54 : 74,
      height: type === 'bulb' ? 54 : 28,
      angle: 0,
      value: initialValue,
      isOpen: type === 'switch' ? false : undefined,
      label
    };

    setComponents((prev) => [...prev, newComp]);
    setSelectedCompId(newId);
  };

  // Delete selected component
  const deleteSelected = () => {
    if (selectedCompId) {
      setComponents((prev) => prev.filter((c) => c.id !== selectedCompId));
      setSelectedCompId(null);
    }
  };

  // Rotate selected component by 90 degrees
  const rotateSelected = () => {
    if (selectedCompId) {
      setComponents((prev) =>
        prev.map((c) =>
          c.id === selectedCompId ? { ...c, angle: (c.angle + 90) % 360 } : c
        )
      );
    }
  };

  // Physics calculation
  const switchComp = components.find((c) => c.type === 'switch');
  const isCircuitClosed = switchComp ? !switchComp.isOpen : true;

  const totalResistance = components
    .filter((c) => c.type === 'resistor' || c.type === 'bulb')
    .reduce((sum, c) => sum + c.value, 0) || 1;

  const sourceComp = components.find((c) => c.type === 'battery' || c.type === 'ac-source');
  const nominalVoltage = sourceComp ? sourceComp.value : 0;

  // Real-time instantaneous voltage and current (with AC oscillation if AC source)
  const isAC = labMode === 'AC' || (sourceComp && sourceComp.type === 'ac-source');
  const instantVoltage = isAC
    ? nominalVoltage * Math.sin(2 * Math.PI * acFrequency * timeRef.current)
    : nominalVoltage;

  const instantCurrent = isCircuitClosed ? instantVoltage / totalResistance : 0;
  const currentMagnitude = Math.abs(instantCurrent);

  // Voltmeter reading: measures difference
  const measuredV = isCircuitClosed ? Math.abs(instantVoltage) : 0;
  // Ammeter reading
  const measuredA = isCircuitClosed ? currentMagnitude : 0;

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (isPlaying) {
        timeRef.current += 0.016; // ~60fps
      }

      const width = canvas.width;
      const height = canvas.height;

      // Soft light sky blue laboratory background from PhET Circuit Kit screenshots
      ctx.fillStyle = '#9fc5f8';
      ctx.fillRect(0, 0, width, height);

      // Save oscilloscope history
      if (showOscilloscope && isPlaying) {
        waveHistory.current.push({
          t: timeRef.current,
          v: instantVoltage,
          i: instantCurrent
        });
        if (waveHistory.current.length > 180) {
          waveHistory.current.shift();
        }
      }

      // Draw Connection Wires (a loop connecting the 4 quadrants)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Circuit perimeter loop
      ctx.beginPath();
      ctx.rect(100, 90, 280, 200);
      ctx.stroke();

      // Electron or Conventional current animations
      if (showCurrent && isPlaying && isCircuitClosed && currentMagnitude > 0) {
        const offset = (timeRef.current * (currentMagnitude * 35)) % 24;
        ctx.save();

        if (currentType === 'electrons') {
          // Cyan circles with minus sign
          ctx.fillStyle = '#06b6d4';
          ctx.strokeStyle = '#0891b2';
          ctx.lineWidth = 1;

          // Top wire
          for (let x = 100; x <= 380; x += 26) {
            const px = 100 + ((x - 100 + offset) % 280);
            ctx.beginPath();
            ctx.arc(px, 90, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          // Right wire
          for (let y = 90; y <= 290; y += 26) {
            const py = 90 + ((y - 90 + offset) % 200);
            ctx.beginPath();
            ctx.arc(380, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          // Bottom wire
          for (let x = 380; x >= 100; x -= 26) {
            const px = 380 - ((380 - x + offset) % 280);
            ctx.beginPath();
            ctx.arc(px, 290, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          // Left wire
          for (let y = 290; y >= 90; y -= 26) {
            const py = 290 - ((290 - y + offset) % 200);
            ctx.beginPath();
            ctx.arc(100, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // Conventional Current (Red directional arrows)
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#b91c1c';

          const drawArrow = (x: number, y: number, angleRad: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleRad);
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          };

          for (let x = 100; x <= 380; x += 36) {
            const px = 380 - ((380 - x + offset) % 280);
            drawArrow(px, 90, Math.PI); // leftwards
          }
          for (let y = 90; y <= 290; y += 36) {
            const py = 290 - ((290 - y + offset) % 200);
            drawArrow(380, py, -Math.PI / 2); // upwards
          }
        }
        ctx.restore();
      }

      // Draw Components
      components.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((c.angle * Math.PI) / 180);

        const isSelected = c.id === selectedCompId;

        // Selection highlight ring
        if (isSelected) {
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(-c.width / 2 - 8, -c.height / 2 - 8, c.width + 16, c.height + 16);
          ctx.setLineDash([]);
        }

        if (viewMode === 'lifelike') {
          // --- LIFELIKE VISUAL RENDERING ---
          if (c.type === 'battery') {
            // Golden & Black Cylindrical Battery
            const bw = c.width;
            const bh = c.height;
            // Battery Body
            const batGrad = ctx.createLinearGradient(-bw / 2, -bh / 2, -bw / 2, bh / 2);
            batGrad.addColorStop(0, '#f59e0b');
            batGrad.addColorStop(0.3, '#fbbf24');
            batGrad.addColorStop(0.7, '#1e293b');
            batGrad.addColorStop(1, '#0f172a');

            ctx.fillStyle = batGrad;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-bw / 2, -bh / 2, bw - 6, bh, 3);
            ctx.fill();
            ctx.stroke();

            // Positive metal cap
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(bw / 2 - 6, -bh / 4, 6, bh / 2);
            ctx.strokeRect(bw / 2 - 6, -bh / 4, 6, bh / 2);

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${c.value}V`, -3, 0);

          } else if (c.type === 'ac-source') {
            // AC Generator symbol / circle
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Sine wave inside
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.bezierCurveTo(-5, -10, 0, -10, 0, 0);
            ctx.bezierCurveTo(0, 10, 5, 10, 10, 0);
            ctx.stroke();

          } else if (c.type === 'bulb') {
            const power = isCircuitClosed ? currentMagnitude * currentMagnitude * c.value : 0;
            // Bulb glow aura
            if (power > 0.1) {
              const glowRadius = Math.min(20 + Math.sqrt(power) * 12, 60);
              const glow = ctx.createRadialGradient(0, -6, 4, 0, -6, glowRadius);
              glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
              glow.addColorStop(0.5, 'rgba(250, 204, 21, 0.6)');
              glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(0, -6, glowRadius, 0, Math.PI * 2);
              ctx.fill();
            }

            // Glass bulb dome
            ctx.fillStyle = power > 0.1 ? '#fef08a' : '#f1f5f9';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -6, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Filament
            ctx.strokeStyle = power > 0.1 ? '#ea580c' : '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 2);
            ctx.lineTo(-3, -12);
            ctx.lineTo(3, -12);
            ctx.lineTo(6, 2);
            ctx.stroke();

            // Metallic screw base
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-8, 8, 16, 10);
            ctx.strokeRect(-8, 8, 16, 10);

          } else if (c.type === 'resistor') {
            // Tan Resistor with color code stripes
            const rw = c.width;
            const rh = c.height;

            const resGrad = ctx.createLinearGradient(-rw / 2, -rh / 2, -rw / 2, rh / 2);
            resGrad.addColorStop(0, '#fde68a');
            resGrad.addColorStop(0.5, '#fed7aa');
            resGrad.addColorStop(1, '#d97706');

            ctx.fillStyle = resGrad;
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-rw / 2, -rh / 2, rw, rh, 5);
            ctx.fill();
            ctx.stroke();

            // Color stripes (Red, Black, Brown, Gold)
            const stripeColors = ['#dc2626', '#18181b', '#92400e', '#eab308'];
            stripeColors.forEach((color, idx) => {
              ctx.fillStyle = color;
              ctx.fillRect(-rw / 2 + 14 + idx * 12, -rh / 2, 5, rh);
            });

          } else if (c.type === 'switch') {
            // Knife Switch
            ctx.fillStyle = '#78350f'; // Wood block base
            ctx.fillRect(-c.width / 2, -4, c.width, 8);

            // Brass contacts
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(-c.width / 2 + 8, 0, 4, 0, Math.PI * 2);
            ctx.arc(c.width / 2 - 8, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Knife lever
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-c.width / 2 + 8, 0);
            if (c.isOpen) {
              ctx.lineTo(c.width / 2 - 14, -22); // open
            } else {
              ctx.lineTo(c.width / 2 - 8, 0); // closed
            }
            ctx.stroke();
          }

        } else {
          // --- SCHEMATIC SYMBOL RENDERING ---
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;

          if (c.type === 'battery') {
            // Long thin line (+), short thick line (-)
            ctx.beginPath();
            ctx.moveTo(-14, -14);
            ctx.lineTo(-14, 14);
            ctx.stroke();

            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(14, -8);
            ctx.lineTo(14, 8);
            ctx.stroke();
          } else if (c.type === 'bulb') {
            // Circle with cross
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-11, -11);
            ctx.lineTo(11, 11);
            ctx.moveTo(11, -11);
            ctx.lineTo(-11, 11);
            ctx.stroke();
          } else if (c.type === 'resistor') {
            // Zigzag
            ctx.beginPath();
            ctx.moveTo(-24, 0);
            ctx.lineTo(-16, -8);
            ctx.lineTo(-8, 8);
            ctx.lineTo(0, -8);
            ctx.lineTo(8, 8);
            ctx.lineTo(16, -8);
            ctx.lineTo(24, 0);
            ctx.stroke();
          } else if (c.type === 'switch') {
            ctx.beginPath();
            ctx.arc(-16, 0, 3, 0, Math.PI * 2);
            ctx.arc(16, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-16, 0);
            ctx.lineTo(12, c.isOpen ? -16 : 0);
            ctx.stroke();
          }
        }

        // Labels & Values overlays
        if (showLabels || showValues) {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          let text = '';
          if (showLabels) text += c.label;
          if (showValues && c.value > 0) {
            const unit = c.type === 'battery' || c.type === 'ac-source' ? 'V' : 'Ω';
            text += text ? ` (${c.value}${unit})` : `${c.value}${unit}`;
          }
          if (text) {
            ctx.fillText(text, 0, c.height / 2 + 14);
          }
        }

        ctx.restore();
      });

      // --- DRAW DUAL-PROBE VOLTMETER (Matching PhET Multimeter) ---
      if (showVoltmeter) {
        // Red Lead line
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(voltmeterPos.x + 10, voltmeterPos.y + 40);
        ctx.bezierCurveTo(
          voltmeterPos.x - 20,
          voltmeterPos.y + 100,
          redProbe.x + 30,
          redProbe.y - 20,
          redProbe.x,
          redProbe.y
        );
        ctx.stroke();

        // Black Lead line
        ctx.strokeStyle = '#18181b';
        ctx.beginPath();
        ctx.moveTo(voltmeterPos.x - 10, voltmeterPos.y + 40);
        ctx.bezierCurveTo(
          voltmeterPos.x - 60,
          voltmeterPos.y + 100,
          blackProbe.x - 30,
          blackProbe.y - 20,
          blackProbe.x,
          blackProbe.y
        );
        ctx.stroke();

        // Multimeter Body (Orange casing)
        const vmW = 86;
        const vmH = 74;
        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(voltmeterPos.x - vmW / 2, voltmeterPos.y - vmH / 2, vmW, vmH, 10);
        ctx.fill();
        ctx.stroke();

        // LCD Display
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(voltmeterPos.x - 32, voltmeterPos.y - 24, 64, 28, 4);
        ctx.fill();
        ctx.stroke();

        // LCD Reading
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px font-mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${measuredV.toFixed(2)} V`, voltmeterPos.x, voltmeterPos.y - 10);

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('VOLTMETER', voltmeterPos.x, voltmeterPos.y + 18);

        // Probe Tips
        // Red tip (+)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(redProbe.x, redProbe.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('+', redProbe.x, redProbe.y);

        // Black tip (-)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(blackProbe.x, blackProbe.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('-', blackProbe.x, blackProbe.y);
      }

      // --- DRAW DIGITAL AMMETER ---
      if (showAmmeter) {
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ammeterPos.x, ammeterPos.y + 35);
        ctx.lineTo(ammeterProbe.x, ammeterProbe.y);
        ctx.stroke();

        // Ammeter Body
        const amW = 86;
        const amH = 68;
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(ammeterPos.x - amW / 2, ammeterPos.y - amH / 2, amW, amH, 10);
        ctx.fill();
        ctx.stroke();

        // Display
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(ammeterPos.x - 32, ammeterPos.y - 20, 64, 24, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px font-mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${measuredA.toFixed(2)} A`, ammeterPos.x, ammeterPos.y - 6);

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('AMMETER', ammeterPos.x, ammeterPos.y + 18);

        // Probe sensor ring
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ammeterProbe.x, ammeterProbe.y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- LIVE OSCILLOSCOPE WAVEFORM (IF OPEN) ---
      if (showOscilloscope) {
        const oscX = 140;
        const oscY = 130;
        const oscW = 200;
        const oscH = 100;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(oscX, oscY, oscW, oscH, 8);
        ctx.fill();
        ctx.stroke();

        // Grid lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(oscX, oscY + oscH / 2);
        ctx.lineTo(oscX + oscW, oscY + oscH / 2);
        ctx.stroke();

        // Voltage wave (Cyan)
        if (waveHistory.current.length > 2) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          waveHistory.current.forEach((pt, idx) => {
            const wx = oscX + (idx / 180) * oscW;
            const wy = oscY + oscH / 2 - (pt.v / 24) * (oscH / 2 - 10);
            if (idx === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          });
          ctx.stroke();
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px font-mono';
        ctx.textAlign = 'left';
        ctx.fillText(`V(t): ${instantVoltage.toFixed(1)}V`, oscX + 8, oscY + 14);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [
    labMode,
    viewMode,
    showCurrent,
    currentType,
    showLabels,
    showValues,
    showVoltmeter,
    showAmmeter,
    showOscilloscope,
    isPlaying,
    components,
    selectedCompId,
    voltmeterPos,
    redProbe,
    blackProbe,
    ammeterPos,
    ammeterProbe,
    isCircuitClosed,
    currentMagnitude,
    measuredV,
    measuredA,
    instantVoltage
  ]);

  // Unified Mouse & Touch coordinate helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Interaction handlers
  const handlePointerDown = (e: any) => {
    const pos = getCanvasCoords(e);

    // 1. Check Probes
    if (Math.hypot(pos.x - redProbe.x, pos.y - redProbe.y) < 20) {
      setDraggingTarget('red-probe');
      return;
    }
    if (Math.hypot(pos.x - blackProbe.x, pos.y - blackProbe.y) < 20) {
      setDraggingTarget('black-probe');
      return;
    }
    if (Math.hypot(pos.x - voltmeterPos.x, pos.y - voltmeterPos.y) < 40) {
      setDraggingTarget('voltmeter');
      dragOffset.current = { x: pos.x - voltmeterPos.x, y: pos.y - voltmeterPos.y };
      return;
    }
    if (Math.hypot(pos.x - ammeterProbe.x, pos.y - ammeterProbe.y) < 20) {
      setDraggingTarget('ammeter-probe');
      return;
    }
    if (Math.hypot(pos.x - ammeterPos.x, pos.y - ammeterPos.y) < 40) {
      setDraggingTarget('ammeter');
      dragOffset.current = { x: pos.x - ammeterPos.x, y: pos.y - ammeterPos.y };
      return;
    }

    // 2. Check Components
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      if (Math.hypot(pos.x - c.x, pos.y - c.y) < Math.max(c.width, c.height) / 1.5) {
        // If switch, toggle directly on click
        if (c.type === 'switch') {
          setComponents((prev) =>
            prev.map((item) =>
              item.id === c.id ? { ...item, isOpen: !item.isOpen } : item
            )
          );
        }
        setSelectedCompId(c.id);
        setDraggingTarget(`comp-${c.id}`);
        dragOffset.current = { x: pos.x - c.x, y: pos.y - c.y };
        return;
      }
    }

    // Clicked empty space
    setSelectedCompId(null);
  };

  const handlePointerMove = (e: any) => {
    if (!draggingTarget) return;
    const pos = getCanvasCoords(e);

    if (draggingTarget === 'red-probe') {
      setRedProbe({ x: pos.x, y: pos.y });
    } else if (draggingTarget === 'black-probe') {
      setBlackProbe({ x: pos.x, y: pos.y });
    } else if (draggingTarget === 'voltmeter') {
      setVoltmeterPos({ x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y });
    } else if (draggingTarget === 'ammeter-probe') {
      setAmmeterProbe({ x: pos.x, y: pos.y });
    } else if (draggingTarget === 'ammeter') {
      setAmmeterPos({ x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y });
    } else if (draggingTarget.startsWith('comp-')) {
      const compId = draggingTarget.replace('comp-', '');
      setComponents((prev) =>
        prev.map((c) =>
          c.id === compId
            ? { ...c, x: pos.x - dragOffset.current.x, y: pos.y - dragOffset.current.y }
            : c
        )
      );
    }
  };

  const handlePointerUp = () => {
    setDraggingTarget(null);
  };

  const selectedComp = components.find((c) => c.id === selectedCompId);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-2 sm:p-4 md:p-6 flex flex-col justify-between max-w-7xl mx-auto select-none">
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-md bg-blue-100 text-blue-800 tracking-wider">
            {labMode === 'AC' ? 'Circuit Lab: AC' : 'Circuit Lab: DC'}
          </span>
          <span className="text-sm font-semibold text-slate-700 hidden sm:inline">
            Interactive Construction Kit with Real-Time Multimeter & Sensors
          </span>
        </div>

        {/* Mode Switcher DC vs AC */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setLabMode('DC')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              labMode === 'DC' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DC Mode
          </button>
          <button
            onClick={() => setLabMode('AC')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              labMode === 'AC' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AC Mode
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-12 gap-3 flex-grow items-start">
        
        {/* LEFT COLUMN: Component Drawer (Matching Screenshot) */}
        <div className="col-span-12 sm:col-span-2 md:col-span-2 bg-white rounded-2xl border-2 border-slate-300 shadow-md p-2 flex flex-col items-center justify-between space-y-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
            Components
          </span>

          {/* Component Buttons */}
          <div className="w-full flex sm:flex-col flex-wrap justify-center gap-2 overflow-y-auto max-h-[460px] scrollbar-thin">
            <button
              onClick={() => addComponent('wire')}
              className="flex-1 sm:w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all group"
            >
              <div className="w-9 h-2 bg-amber-700 rounded-full my-1"></div>
              <span className="text-[11px] font-semibold text-slate-700">Wire</span>
            </button>

            <button
              onClick={() => addComponent(labMode === 'AC' ? 'ac-source' : 'battery')}
              className="flex-1 sm:w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all"
            >
              <div className="w-8 h-4 bg-gradient-to-r from-amber-500 to-slate-900 rounded-sm my-0.5 border border-slate-600"></div>
              <span className="text-[11px] font-semibold text-slate-700">
                {labMode === 'AC' ? 'AC Voltage' : 'Battery'}
              </span>
            </button>

            <button
              onClick={() => addComponent('bulb')}
              className="flex-1 sm:w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all"
            >
              <div className="w-5 h-5 rounded-full border border-slate-400 bg-amber-100 flex items-center justify-center text-[10px]">💡</div>
              <span className="text-[11px] font-semibold text-slate-700">Light Bulb</span>
            </button>

            <button
              onClick={() => addComponent('resistor')}
              className="flex-1 sm:w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all"
            >
              <div className="w-8 h-2.5 bg-amber-200 rounded border border-amber-800 my-1 flex justify-around">
                <span className="w-1 bg-red-600 h-full"></span>
                <span className="w-1 bg-black h-full"></span>
                <span className="w-1 bg-amber-600 h-full"></span>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Resistor</span>
            </button>

            <button
              onClick={() => addComponent('switch')}
              className="flex-1 sm:w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all"
            >
              <div className="w-8 h-3 flex items-center justify-between text-amber-700 text-xs font-bold">
                •/•
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Switch</span>
            </button>

            {labMode === 'AC' && (
              <button
                onClick={() => addComponent('capacitor')}
                className="flex-1 sm:w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all"
              >
                <div className="w-8 h-3 flex items-center justify-center space-x-1 text-xs">
                  <span className="h-3 w-0.5 bg-slate-800"></span>
                  <span className="h-3 w-0.5 bg-slate-800"></span>
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Capacitor</span>
              </button>
            )}
          </div>

          {/* Schematic vs Lifelike Toggle (Bottom of drawer matching screenshot) */}
          <div className="w-full pt-2 border-t border-slate-200 flex justify-center space-x-2">
            <button
              onClick={() => setViewMode('lifelike')}
              title="Realistic Components"
              className={`p-1.5 rounded-lg border text-xs font-bold ${
                viewMode === 'lifelike' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Real
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              title="Circuit Diagram Symbols"
              className={`p-1.5 rounded-lg border text-xs font-bold ${
                viewMode === 'schematic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Schematic
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: Workbench Interactive Canvas */}
        <div className="col-span-12 sm:col-span-7 md:col-span-7 flex flex-col items-center space-y-2">
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl bg-[#9fc5f8]">
            <canvas
              ref={canvasRef}
              width={540}
              height={380}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              style={{ touchAction: 'none' }}
              className="w-full h-auto block cursor-crosshair"
            />

            {/* Bottom canvas floating actions (Zoom + Play/Pause) */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-slate-300 shadow-sm text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.5))}
                className="p-1 hover:bg-slate-200 rounded text-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))}
                className="p-1 hover:bg-slate-200 rounded text-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-2 right-2 flex items-center space-x-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-300 shadow-sm text-xs">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded-lg text-white font-bold flex items-center space-x-1 ${
                  isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { timeRef.current += 0.05; }}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700"
                title="Step frame"
              >
                <StepForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Selected Component Parameter Editor Bar */}
          {selectedComp && (
            <div className="w-full bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800">{selectedComp.label}</span>
                {selectedComp.value > 0 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min={selectedComp.type === 'battery' ? 1 : 1}
                      max={selectedComp.type === 'battery' ? 48 : 100}
                      value={selectedComp.value}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setComponents((prev) =>
                          prev.map((c) => (c.id === selectedComp.id ? { ...c, value: val } : c))
                        );
                      }}
                      className="w-24 accent-blue-600"
                    />
                    <span className="font-mono font-bold text-blue-700">
                      {selectedComp.value} {selectedComp.type === 'battery' ? 'V' : 'Ω'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={rotateSelected}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1 text-slate-700 font-semibold"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Options & Instrument Panels (Matching Screenshot) */}
        <div className="col-span-12 sm:col-span-3 md:col-span-3 space-y-3">
          
          {/* Options Panel (Matching Screenshot Top Right) */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-3.5 space-y-2.5 text-xs">
            {/* Show Current Checkbox & Radios */}
            <div className="space-y-1.5">
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCurrent}
                  onChange={(e) => setShowCurrent(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Show Current</span>
              </label>

              {showCurrent && (
                <div className="pl-5 space-y-1 text-slate-600 font-medium">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currentMode"
                      checked={currentType === 'electrons'}
                      onChange={() => setCurrentType('electrons')}
                      className="text-cyan-600"
                    />
                    <span>Electrons (-)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currentMode"
                      checked={currentType === 'conventional'}
                      onChange={() => setCurrentType('conventional')}
                      className="text-red-600"
                    />
                    <span>Conventional (→)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-700 font-medium">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Labels</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showValues}
                  onChange={(e) => setShowValues(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Values</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStopwatch}
                  onChange={(e) => setShowStopwatch(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Stopwatch</span>
              </label>
            </div>
          </div>

          {/* Instruments Panel (Matching Screenshot Instruments) */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-3.5 space-y-2 text-xs">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Instruments
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowVoltmeter(!showVoltmeter)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  showVoltmeter ? 'bg-orange-50 border-orange-400 text-orange-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Voltmeter
              </button>
              <button
                onClick={() => setShowAmmeter(!showAmmeter)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  showAmmeter ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Ammeter
              </button>
            </div>

            <button
              onClick={() => setShowOscilloscope(!showOscilloscope)}
              className={`w-full py-2 px-3 rounded-xl border text-center transition-all flex items-center justify-center space-x-1.5 ${
                showOscilloscope ? 'bg-sky-100 border-sky-400 text-sky-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Waveform Chart</span>
            </button>
          </div>

          {/* Stopwatch Widget if enabled */}
          {showStopwatch && (
            <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-md flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-base font-bold text-amber-400">{stopwatchTime.toFixed(1)}s</span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]"
                >
                  {isStopwatchRunning ? 'Stop' : 'Start'}
                </button>
                <button
                  onClick={() => { setStopwatchTime(0); setIsStopwatchRunning(false); }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* AC frequency slider if AC mode */}
          {labMode === 'AC' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Frequency (f)</span>
                <span className="font-mono text-blue-700">{acFrequency.toFixed(1)} Hz</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={acFrequency}
                onChange={(e) => setAcFrequency(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          )}

        </div>

      </div>

      {/* Floating Reset Button matching the screenshot (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <ResetButton onReset={handleReset} />
      </div>

    </div>
  );
};

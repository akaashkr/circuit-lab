import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ResetButton } from '../../components/ResetButton';
import {
  Zap,
  Minus,
  Lightbulb,
  ToggleLeft,
  ToggleRight,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CircuitComponent {
  id: string;
  type: 'wire' | 'battery' | 'bulb' | 'resistor' | 'switch';
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  value: number; // voltage for battery, resistance for resistor, etc.
  isOn?: boolean; // for switch
}

type CurrentMode = 'electrons' | 'conventional';

type ComponentType = CircuitComponent['type'];

const COMPONENT_LABELS: Record<ComponentType, string> = {
  wire: 'Wire',
  battery: 'Battery',
  bulb: 'Light Bulb',
  resistor: 'Resistor',
  switch: 'Switch',
};

const DEFAULT_VALUES: Record<ComponentType, number> = {
  wire: 0,
  battery: 9,
  bulb: 60,
  resistor: 100,
  switch: 0,
};

const COMP_W = 80;
const COMP_H = 50;
const SNAP_DIST = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;
const nextId = () => `comp-${Date.now()}-${++_idCounter}`;

function hitTest(
  comp: CircuitComponent,
  px: number,
  py: number,
  zoom: number,
): boolean {
  const hw = (COMP_W / 2) * zoom;
  const hh = (COMP_H / 2) * zoom;
  return (
    px >= comp.x * zoom - hw &&
    px <= comp.x * zoom + hw &&
    py >= comp.y * zoom - hh &&
    py <= comp.y * zoom + hh
  );
}

/** Simple closed-loop check: need a battery + at least one load, all switches on. */
function solveCircuit(components: CircuitComponent[]): {
  hasCurrent: boolean;
  current: number;
  totalVoltage: number;
  totalResistance: number;
} {
  const batteries = components.filter((c) => c.type === 'battery');
  const resistors = components.filter((c) => c.type === 'resistor');
  const bulbs = components.filter((c) => c.type === 'bulb');
  const switches = components.filter((c) => c.type === 'switch');

  if (batteries.length === 0) {
    return { hasCurrent: false, current: 0, totalVoltage: 0, totalResistance: 0 };
  }

  // Any open switch breaks the loop
  if (switches.some((s) => !s.isOn)) {
    const v = batteries.reduce((s, b) => s + b.value, 0);
    return { hasCurrent: false, current: 0, totalVoltage: v, totalResistance: 0 };
  }

  // Need at least one load
  if (resistors.length === 0 && bulbs.length === 0) {
    const v = batteries.reduce((s, b) => s + b.value, 0);
    return { hasCurrent: false, current: 0, totalVoltage: v, totalResistance: 0 };
  }

  const totalVoltage = batteries.reduce((s, b) => s + b.value, 0);
  // Bulb value is treated as wattage rating – derive resistance: R = V²/P (approx)
  const bulbResistance = bulbs.reduce((s, b) => {
    const r = (totalVoltage * totalVoltage) / Math.max(b.value, 1);
    return s + r;
  }, 0);
  const totalResistance =
    resistors.reduce((s, r) => s + r.value, 0) + bulbResistance || 1;
  const current = totalVoltage / totalResistance;

  return { hasCurrent: true, current, totalVoltage, totalResistance };
}

// ---------------------------------------------------------------------------
// Canvas drawing
// ---------------------------------------------------------------------------

function drawComponent(
  ctx: CanvasRenderingContext2D,
  comp: CircuitComponent,
  selected: boolean,
  showLabels: boolean,
  showValues: boolean,
  glowIntensity: number, // 0-1 for bulb glow
  zoom: number,
) {
  ctx.save();
  ctx.translate(comp.x * zoom, comp.y * zoom);
  ctx.rotate((comp.rotation * Math.PI) / 180);
  ctx.scale(zoom, zoom);

  const hw = COMP_W / 2;
  const hh = COMP_H / 2;

  // Selection highlight
  if (selected) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(-hw - 6, -hh - 6, COMP_W + 12, COMP_H + 12);
    ctx.setLineDash([]);
  }

  ctx.lineWidth = 2;

  switch (comp.type) {
    case 'wire': {
      // Copper-colored horizontal line
      ctx.strokeStyle = '#b87333';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(hw, 0);
      ctx.stroke();
      // Terminals
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(-hw, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hw, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'battery': {
      // Battery symbol
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      // connecting lines
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-8, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(hw, 0);
      ctx.stroke();
      // Short thick line (negative)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(-8, 12);
      ctx.stroke();
      // Long thin line (positive)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -20);
      ctx.lineTo(8, 20);
      ctx.stroke();
      // Plus / Minus labels
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', 20, -12);
      ctx.fillStyle = '#333';
      ctx.fillText('−', -20, -12);
      // Terminals
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(-hw, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hw, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bulb': {
      // Circle
      const r = 16;
      if (glowIntensity > 0) {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 10);
        const alpha = Math.min(glowIntensity, 1);
        grad.addColorStop(0, `rgba(255,240,80,${alpha})`);
        grad.addColorStop(1, `rgba(255,240,80,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = glowIntensity > 0 ? `rgba(255,230,50,${Math.min(glowIntensity * 0.8, 0.9)})` : '#f5f5dc';
      ctx.beginPath();
      ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
      ctx.fill();
      // Filament cross
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(0, -8);
      ctx.lineTo(6, 8);
      ctx.stroke();
      // Leads
      ctx.strokeStyle = '#b87333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-r, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(hw, 0);
      ctx.stroke();
      break;
    }

    case 'resistor': {
      // Zigzag
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2.5;
      const zigW = 40;
      const zigH = 10;
      const segs = 6;
      const segW = zigW / segs;
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-zigW / 2, 0);
      for (let i = 0; i < segs; i++) {
        const xStart = -zigW / 2 + i * segW;
        const yDir = i % 2 === 0 ? -zigH : zigH;
        ctx.lineTo(xStart + segW / 2, yDir);
        ctx.lineTo(xStart + segW, 0);
      }
      ctx.lineTo(hw, 0);
      ctx.stroke();
      // Terminals
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(-hw, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hw, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'switch': {
      const dotR = 5;
      const isOpen = !comp.isOn;
      // Left terminal dot
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(-20, 0, dotR, 0, Math.PI * 2);
      ctx.fill();
      // Right terminal dot
      ctx.beginPath();
      ctx.arc(20, 0, dotR, 0, Math.PI * 2);
      ctx.fill();
      // Lever
      ctx.strokeStyle = isOpen ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      if (isOpen) {
        ctx.lineTo(16, -16);
      } else {
        ctx.lineTo(20, 0);
      }
      ctx.stroke();
      // Leads
      ctx.strokeStyle = '#b87333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-20, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(hw, 0);
      ctx.stroke();
      break;
    }
  }

  // Labels and values beneath component
  if (showLabels || showValues) {
    ctx.rotate((-comp.rotation * Math.PI) / 180); // un-rotate text
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
    let yOff = hh + 14;
    if (showLabels) {
      ctx.fillText(COMPONENT_LABELS[comp.type], 0, yOff);
      yOff += 13;
    }
    if (showValues) {
      let valText = '';
      switch (comp.type) {
        case 'battery':
          valText = `${comp.value} V`;
          break;
        case 'resistor':
          valText = `${comp.value} Ω`;
          break;
        case 'bulb':
          valText = `${comp.value} W`;
          break;
        case 'switch':
          valText = comp.isOn ? 'Closed' : 'Open';
          break;
        default:
          break;
      }
      if (valText) {
        ctx.fillText(valText, 0, yOff);
      }
    }
  }

  ctx.restore();
}

function drawCurrentParticles(
  ctx: CanvasRenderingContext2D,
  components: CircuitComponent[],
  phase: number,
  mode: CurrentMode,
  zoom: number,
) {
  // Draw animated particles along each component's axis
  components.forEach((comp) => {
    ctx.save();
    ctx.translate(comp.x * zoom, comp.y * zoom);
    ctx.rotate((comp.rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const hw = COMP_W / 2;
    const particleCount = 4;
    const isElectrons = mode === 'electrons';
    const dir = isElectrons ? -1 : 1;

    for (let i = 0; i < particleCount; i++) {
      const t = ((i / particleCount + phase * dir) % 1 + 1) % 1;
      const px = -hw + t * COMP_W;

      if (isElectrons) {
        // Blue dots
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(px, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Red arrows
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(px + 5, 0);
        ctx.lineTo(px - 3, -4);
        ctx.lineTo(px - 3, 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CircuitBuilderSim: React.FC = () => {
  // Components on canvas
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Controls
  const [showCurrent, setShowCurrent] = useState(true);
  const [currentMode, setCurrentMode] = useState<CurrentMode>('electrons');
  const [showLabels, setShowLabels] = useState(true);
  const [showValues, setShowValues] = useState(true);

  // Simulation
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const phaseRef = useRef(0);
  const animFrameRef = useRef(0);

  // Drag state
  const draggingRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile panel toggle
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ------ Add component ------
  const addComponent = useCallback(
    (type: ComponentType) => {
      const newComp: CircuitComponent = {
        id: nextId(),
        type,
        x: 200 + Math.random() * 200,
        y: 150 + Math.random() * 150,
        rotation: 0,
        value: DEFAULT_VALUES[type],
        isOn: type === 'switch' ? true : undefined,
      };
      setComponents((prev) => [...prev, newComp]);
      setSelectedId(newComp.id);
    },
    [],
  );

  // ------ Delete selected ------
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setComponents((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ------ Toggle switch ------
  const toggleSwitch = useCallback((id: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id && c.type === 'switch' ? { ...c, isOn: !c.isOn } : c)),
    );
  }, []);

  // ------ Rotate selected ------
  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    setComponents((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, rotation: (c.rotation + 90) % 360 } : c,
      ),
    );
  }, [selectedId]);

  // ------ Reset ------
  const resetAll = useCallback(() => {
    setComponents([]);
    setSelectedId(null);
    phaseRef.current = 0;
    setIsPlaying(true);
    setZoom(1);
  }, []);

  // ------ Step ------
  const stepForward = useCallback(() => {
    phaseRef.current = (phaseRef.current + 0.05) % 1;
  }, []);

  // ------ Keyboard ------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if no input/textarea is focused
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          deleteSelected();
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          rotateSelected();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, rotateSelected]);

  // ------ Pointer helpers (mouse + touch unified) ------
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): { cx: number; cy: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { cx: clientX - rect.left, cy: clientY - rect.top };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (cx: number, cy: number) => {
      // Check hit on components (reverse for top-most first)
      for (let i = components.length - 1; i >= 0; i--) {
        const comp = components[i];
        if (hitTest(comp, cx, cy, zoom)) {
          setSelectedId(comp.id);
          draggingRef.current = {
            id: comp.id,
            offsetX: cx - comp.x * zoom,
            offsetY: cy - comp.y * zoom,
          };
          return;
        }
      }
      setSelectedId(null);
    },
    [components, zoom],
  );

  const handlePointerMove = useCallback(
    (cx: number, cy: number) => {
      if (!draggingRef.current) return;
      const { id, offsetX, offsetY } = draggingRef.current;
      const newX = (cx - offsetX) / zoom;
      const newY = (cy - offsetY) / zoom;

      setComponents((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          // Snap
          let sx = newX;
          let sy = newY;
          for (const other of prev) {
            if (other.id === id) continue;
            if (Math.abs(newX - other.x) < SNAP_DIST && Math.abs(newY - other.y) < SNAP_DIST * 2) {
              sx = other.x;
            }
            if (Math.abs(newY - other.y) < SNAP_DIST && Math.abs(newX - other.x) < SNAP_DIST * 2) {
              sy = other.y;
            }
          }
          return { ...c, x: sx, y: sy };
        }),
      );
    },
    [zoom],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) handlePointerDown(coords.cx, coords.cy);
    },
    [getCanvasCoords, handlePointerDown],
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (coords) handlePointerMove(coords.cx, coords.cy);
    },
    [getCanvasCoords, handlePointerMove],
  );
  const onMouseUp = useCallback(() => handlePointerUp(), [handlePointerUp]);

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const t = e.touches[0];
      const coords = getCanvasCoords(t.clientX, t.clientY);
      if (coords) handlePointerDown(coords.cx, coords.cy);
    },
    [getCanvasCoords, handlePointerDown],
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const t = e.touches[0];
      const coords = getCanvasCoords(t.clientX, t.clientY);
      if (coords) handlePointerMove(coords.cx, coords.cy);
    },
    [getCanvasCoords, handlePointerMove],
  );
  const onTouchEnd = useCallback(() => handlePointerUp(), [handlePointerUp]);

  // Double click to toggle switch
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;
      for (let i = components.length - 1; i >= 0; i--) {
        if (
          components[i].type === 'switch' &&
          hitTest(components[i], coords.cx, coords.cy, zoom)
        ) {
          toggleSwitch(components[i].id);
          return;
        }
      }
    },
    [components, zoom, getCanvasCoords, toggleSwitch],
  );

  // ------ Canvas sizing ------
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // ------ Render loop ------
  const circuitResult = solveCircuit(components);

  useEffect(() => {
    let running = true;

    const render = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear
      ctx.fillStyle = '#bdd7ee';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid dots
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      const gridSize = 40 * zoom;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      for (let gx = 0; gx < cw; gx += gridSize) {
        for (let gy = 0; gy < ch; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw components
      components.forEach((comp) => {
        const isSelected = comp.id === selectedId;
        let glow = 0;
        if (circuitResult.hasCurrent && comp.type === 'bulb') {
          const power = circuitResult.current * circuitResult.current * (comp.value > 0 ? (circuitResult.totalVoltage * circuitResult.totalVoltage) / comp.value : 1);
          glow = Math.min(power / 5, 1);
        }
        drawComponent(ctx, comp, isSelected, showLabels, showValues, glow, zoom);
      });

      // Animated current
      if (showCurrent && circuitResult.hasCurrent && isPlaying) {
        phaseRef.current = (phaseRef.current + 0.008) % 1;
      }
      if (showCurrent && circuitResult.hasCurrent) {
        drawCurrentParticles(ctx, components, phaseRef.current, currentMode, zoom);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [components, selectedId, showLabels, showValues, showCurrent, currentMode, isPlaying, zoom, circuitResult]);

  // ------ Palette icon for each component type ------
  const PaletteIcon: React.FC<{ type: ComponentType }> = ({ type }) => {
    switch (type) {
      case 'wire':
        return <Minus className="w-6 h-6 text-amber-700" />;
      case 'battery':
        return <Zap className="w-6 h-6 text-red-500" />;
      case 'bulb':
        return <Lightbulb className="w-6 h-6 text-yellow-500" />;
      case 'resistor':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h3l1.5-5 3 10 3-10 3 10 1.5-5h3" className="text-purple-600" />
          </svg>
        );
      case 'switch':
        return <ToggleLeft className="w-6 h-6 text-green-600" />;
      default:
        return null;
    }
  };

  // ------ Zoom ------
  const zoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.4));

  // ------ Selected component info ------
  const selectedComp = components.find((c) => c.id === selectedId) ?? null;

  // ------ Palette items ------
  const paletteTypes: ComponentType[] = ['wire', 'battery', 'bulb', 'resistor', 'switch'];

  // ------ Render ------
  return (
    <div className="flex flex-col h-full w-full bg-gray-100 overflow-hidden select-none">
      {/* MOBILE: Horizontal palette */}
      {isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b overflow-x-auto shrink-0">
          {paletteTypes.map((type) => (
            <button
              key={type}
              onClick={() => addComponent(type)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-blue-50 border rounded-lg whitespace-nowrap text-sm font-medium transition-colors"
            >
              <PaletteIcon type={type} />
              {COMPONENT_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP: Left Sidebar Palette */}
        {!isMobile && (
          <div className="w-48 bg-white border-r flex flex-col shrink-0">
            <div className="px-3 py-3 border-b bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Components</h3>
            </div>
            <div className="flex flex-col gap-1 p-2 overflow-y-auto">
              {paletteTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => addComponent(type)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <PaletteIcon type={type} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{COMPONENT_LABELS[type]}</span>
                </button>
              ))}
            </div>

            {/* Selected component actions */}
            {selectedComp && (
              <div className="mt-auto border-t p-3 bg-gray-50 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Selected</p>
                <p className="text-sm font-medium text-gray-800">{COMPONENT_LABELS[selectedComp.type]}</p>

                {selectedComp.type === 'switch' && (
                  <button
                    onClick={() => toggleSwitch(selectedComp.id)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded bg-white border hover:bg-gray-100 transition-colors"
                  >
                    {selectedComp.isOn ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-red-500" />
                    )}
                    {selectedComp.isOn ? 'Close' : 'Open'}
                  </button>
                )}

                {(selectedComp.type === 'battery' || selectedComp.type === 'resistor' || selectedComp.type === 'bulb') && (
                  <div>
                    <label className="text-xs text-gray-500">
                      {selectedComp.type === 'battery'
                        ? 'Voltage (V)'
                        : selectedComp.type === 'resistor'
                          ? 'Resistance (Ω)'
                          : 'Power (W)'}
                    </label>
                    <input
                      type="range"
                      min={selectedComp.type === 'battery' ? 1 : 1}
                      max={selectedComp.type === 'battery' ? 24 : selectedComp.type === 'resistor' ? 1000 : 200}
                      value={selectedComp.value}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setComponents((prev) =>
                          prev.map((c) => (c.id === selectedComp.id ? { ...c, value: val } : c)),
                        );
                      }}
                      className="w-full accent-blue-500"
                    />
                    <span className="text-xs text-gray-600">
                      {selectedComp.value}
                      {selectedComp.type === 'battery' ? ' V' : selectedComp.type === 'resistor' ? ' Ω' : ' W'}
                    </span>
                  </div>
                )}

                <div className="flex gap-1">
                  <button
                    onClick={rotateSelected}
                    title="Rotate (R)"
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white border rounded hover:bg-gray-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Rotate
                  </button>
                  <button
                    onClick={deleteSelected}
                    title="Delete"
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CANVAS AREA */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onDoubleClick={onDoubleClick}
          />

          {/* Status bar overlay */}
          <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
            {circuitResult.hasCurrent && (
              <span className="bg-green-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow">
                ⚡ I = {circuitResult.current.toFixed(2)} A
              </span>
            )}
            {components.length > 0 && !circuitResult.hasCurrent && (
              <span className="bg-amber-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow">
                Open Circuit
              </span>
            )}
          </div>

          {/* Mobile selected controls */}
          {isMobile && selectedComp && (
            <div className="absolute bottom-20 left-3 right-3 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{COMPONENT_LABELS[selectedComp.type]}</span>
                <div className="flex gap-1">
                  {selectedComp.type === 'switch' && (
                    <button
                      onClick={() => toggleSwitch(selectedComp.id)}
                      className="p-1.5 rounded bg-gray-100"
                    >
                      {selectedComp.isOn ? (
                        <ToggleRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-red-500" />
                      )}
                    </button>
                  )}
                  <button onClick={rotateSelected} className="p-1.5 rounded bg-gray-100">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={deleteSelected} className="p-1.5 rounded bg-red-100 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(selectedComp.type === 'battery' || selectedComp.type === 'resistor' || selectedComp.type === 'bulb') && (
                <input
                  type="range"
                  min={1}
                  max={selectedComp.type === 'battery' ? 24 : selectedComp.type === 'resistor' ? 1000 : 200}
                  value={selectedComp.value}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setComponents((prev) =>
                      prev.map((c) => (c.id === selectedComp.id ? { ...c, value: val } : c)),
                    );
                  }}
                  className="w-full accent-blue-500"
                />
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL (desktop) or floating sheet (mobile) */}
        {!isMobile && (
          <div className="w-56 bg-white border-l flex flex-col shrink-0 overflow-y-auto">
            {/* Show Current */}
            <div className="p-3 border-b space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Display</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCurrent}
                  onChange={() => setShowCurrent((p) => !p)}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-700">Show Current</span>
                {showCurrent ? (
                  <Eye className="w-4 h-4 text-blue-500 ml-auto" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400 ml-auto" />
                )}
              </label>
              {showCurrent && (
                <div className="ml-5 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currentMode"
                      checked={currentMode === 'electrons'}
                      onChange={() => setCurrentMode('electrons')}
                      className="accent-blue-500"
                    />
                    <span className="text-xs text-gray-600">Electrons</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 ml-auto" />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currentMode"
                      checked={currentMode === 'conventional'}
                      onChange={() => setCurrentMode('conventional')}
                      className="accent-blue-500"
                    />
                    <span className="text-xs text-gray-600">Conventional</span>
                    <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                  </label>
                </div>
              )}
            </div>

            {/* Labels / Values */}
            <div className="p-3 border-b space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={() => setShowLabels((p) => !p)}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-700">Labels</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showValues}
                  onChange={() => setShowValues((p) => !p)}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-700">Values</span>
              </label>
            </div>

            {/* Circuit info */}
            {components.length > 0 && (
              <div className="p-3 border-b space-y-1">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Circuit Info</h4>
                <p className="text-xs text-gray-600">
                  Components: {components.length}
                </p>
                {circuitResult.totalVoltage > 0 && (
                  <p className="text-xs text-gray-600">
                    V = {circuitResult.totalVoltage.toFixed(1)} V
                  </p>
                )}
                {circuitResult.hasCurrent && (
                  <>
                    <p className="text-xs text-gray-600">
                      R<sub>total</sub> = {circuitResult.totalResistance.toFixed(1)} Ω
                    </p>
                    <p className="text-xs font-medium text-green-700">
                      I = {circuitResult.current.toFixed(3)} A
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Keyboard shortcuts */}
            <div className="p-3 mt-auto text-xs text-gray-400 space-y-1">
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Del</kbd> Delete</p>
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">R</kbd> Rotate</p>
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Dbl-click</kbd> Toggle switch</p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM TOOLBAR */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-t shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={stepForward}
            disabled={isPlaying}
            className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Step Forward"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile controls toggle */}
        {isMobile && (
          <button
            onClick={() => setControlsOpen((p) => !p)}
            className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {controlsOpen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2">
          {selectedId && (
            <button
              onClick={deleteSelected}
              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <ResetButton onReset={resetAll} title="Clear All" />
        </div>
      </div>

      {/* Mobile Controls Sheet */}
      {isMobile && controlsOpen && (
        <div className="fixed inset-x-0 bottom-14 bg-white/95 backdrop-blur border-t rounded-t-2xl shadow-2xl p-4 space-y-3 z-50">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700">Controls</h4>
            <button onClick={() => setControlsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCurrent}
              onChange={() => setShowCurrent((p) => !p)}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-700">Show Current</span>
          </label>
          {showCurrent && (
            <div className="flex gap-4 ml-5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mCurrentMode"
                  checked={currentMode === 'electrons'}
                  onChange={() => setCurrentMode('electrons')}
                  className="accent-blue-500"
                />
                <span className="text-xs text-gray-600">Electrons</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mCurrentMode"
                  checked={currentMode === 'conventional'}
                  onChange={() => setCurrentMode('conventional')}
                  className="accent-blue-500"
                />
                <span className="text-xs text-gray-600">Conventional</span>
              </label>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showLabels} onChange={() => setShowLabels((p) => !p)} className="accent-blue-500" />
            <span className="text-sm text-gray-700">Labels</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showValues} onChange={() => setShowValues((p) => !p)} className="accent-blue-500" />
            <span className="text-sm text-gray-700">Values</span>
          </label>
          {circuitResult.hasCurrent && (
            <div className="bg-green-50 rounded-lg p-2 text-xs text-green-800">
              V = {circuitResult.totalVoltage.toFixed(1)} V | R = {circuitResult.totalResistance.toFixed(1)} Ω | I = {circuitResult.current.toFixed(3)} A
            </div>
          )}
        </div>
      )}
    </div>
  );
};

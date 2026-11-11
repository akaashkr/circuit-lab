# Circuit Lab ⚡
### Interactive Physics Simulation Suite (Current Electricity)

**Circuit Lab** is an interactive, browser-based physics simulation suite for Current Electricity. Designed with real-time vector graphics, dynamic formula scaling, touch-friendly mobile controls, and numerical accuracy, it empowers students and educators to explore the foundational laws of electrical circuits.

---

## 🔬 Featured Simulation Labs

### 1. HomeScreen Dashboard
- Central visual hub displaying all simulations with preview formula badges and feature tags.
- One-click launch into any simulation with instant return navigation.
- Fully responsive across desktop, tablet, and mobile phone screens.

### 2. Ohm's Law ($V = I \cdot R$)
- **Dynamic Equation Scaling:** Letters $V$, $I$, and $R$ dynamically resize in real time according to their values.
- **Physical Circuit Representation:**
  - Real-time battery stack (1.5 V cells in series).
  - 3D-shaded cylindrical resistor with density of scattering impurity dots reflecting resistance value.
  - Animated electron flow counter-clockwise & conventional current indicators.
  - High current thermal overload warning.
- **Laboratory Sliders:** Voltage ($0.1\text{ V} - 9.0\text{ V}$) and Resistance ($10\ \Omega - 1000\ \Omega$).

### 3. Resistance in a Wire ($R = \frac{\rho \cdot L}{A}$)
- **Dynamic Fraction Equation:** Letters $R$, $\rho$, $L$, and $A$ scale dynamically with their values.
- **3D Conductor Geometry:**
  - Length $L$ dynamically extends the physical cylinder.
  - Cross-sectional area $A$ thickens/thins the diameter ($d \propto \sqrt{A}$).
  - Resistivity $\rho$ adjusts internal scattering collision centers.
- **Materials Presets:** Copper, Silver, Gold, Aluminum, Tungsten, Iron, Nichrome, and Graphite.

### 4. Circuit Construction Kit: DC Workbench
- **Component Drawer:** Wires, Batteries, Light Bulbs, Resistors, Knife Switches.
- **View Modes:** Toggle between Lifelike visual rendering and standard schematic diagram symbols.
- **Dual-Lead Voltmeter:** Draggable Red (+) and Black (-) probes to measure potential difference across any node.
- **Digital Ammeter:** Touch & mouse draggable ammeter to measure circuit loop currents.
- **Current Flow Options:** Switch between cyan Electrons flow with negative charges and red Conventional current arrows.
- **Stopwatch:** Built-in timer with start, stop, and reset controls.

### 5. Circuit Construction Kit: AC Workbench
- **AC Source & Alternating Currents:** Sine wave voltage generator with adjustable amplitude and frequency.
- **Capacitive & Inductive Behavior:** Test reactive components under AC conditions.
- **Live Oscilloscope Chart:** Real-time waveform visualizer showing $v(t) = V_0 \sin(2\pi f t)$.

### 6. Series & Parallel Combinations
- **Toggle Topologies:** Switch between Series and Parallel circuits.
- **Real-Time Bulb Glow:** Filament and aura glow intensity scale dynamically with electrical power ($P = I^2 R$).
- **Independent Branch Switches:** Open or close branches to discover why domestic circuits are wired in parallel.
- **Metrics:** Real-time equivalent resistance ($R_{\text{eq}}$) calculation and Kirchhoff's loop rules.

### 7. Joule's Heating & Electrical Power ($H = I^2 R t$)
- **Water Calorimeter:** Submerged heating coil heating water from $20^\circ\text{C}$ up to boiling ($100^\circ\text{C}$).
- **Clean Typography:** All equations displayed with clear typography ($H = I^2 \cdot R \cdot t$ and $P = V \cdot I$).
- **Live Graphing:** Real-time synchronized Temperature vs. Time curve.

### 8. Electricity Concept Challenges & Quizzes
- Interactive multiple-choice challenges with instant verification, detailed explanations, and direct simulation links.

---

## 📱 Mobile & Touch Support
- Built with full touch event bindings (`onTouchStart`, `onTouchMove`, `onTouchEnd`) and CSS `touch-action: none` on interactive canvases.
- Responsive mobile drawer, scalable workbench, and accessible tap targets for smartphone browsers.

---

## 🚀 Local Development

To run Circuit Lab locally:

```bash
cd circuit-lab
npm install
npm run dev
```

The application will run at `http://localhost:3000`.

---

## 🌐 Deploying to Vercel

```bash
cd circuit-lab
npm run build
npx vercel
```

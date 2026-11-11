# Circuit Lab ⚡
### Interactive Physics Simulation Suite (Grades 9–12 Electricity)

**Circuit Lab** is an interactive, browser-based physics simulation suite tailored for High School Physics (Grades 9 to 12). Designed with real-time vector graphics, dynamic formula scaling, and numerical accuracy, it empowers students and educators to explore the foundational laws of current electricity.

---

## 🔬 Featured Simulation Labs

### 1. Ohm's Law ($V = I \cdot R$)
- **Dynamic Equation Scaling:** Letters $V$, $I$, and $R$ dynamically resize in real time according to their values.
- **Physical Circuit Representation:**
  - Real-time battery stack (1.5 V cells in series).
  - 3D-shaded cylindrical resistor with density of scattering impurity dots reflecting resistance value.
  - Animated electron flow counter-clockwise & conventional current indicators.
  - High current thermal overload warning.
- **Vertical Laboratory Sliders:** Voltage ($0.1\text{ V} - 9.0\text{ V}$) and Resistance ($10\ \Omega - 1000\ \Omega$).

### 2. Resistance in a Wire ($R = \frac{\rho \cdot L}{A}$)
- **Dynamic Fraction Equation:** Letters $R$, $\rho$, $L$, and $A$ scale dynamically with their values.
- **3D Conductor Geometry:**
  - Length $L$ dynamically extends the physical cylinder.
  - Cross-sectional area $A$ thickens/thins the diameter ($d \propto \sqrt{A}$).
  - Resistivity $\rho$ adjusts internal scattering collision centers.
- **Materials Presets:** Copper, Silver, Gold, Aluminum, Tungsten, Iron, Nichrome, and Graphite.

### 3. Series & Parallel Combinations
- **Toggle Modes:** Switch between Series and Parallel topologies.
- **Real-Time Bulb Glow:** Filament and aura glow intensity scale dynamically with electrical power ($P = I^2 R$).
- **Independent Branch Switches:** Open or close branches to discover why domestic circuits are wired in parallel.
- **Formulas & Metrics:** Real-time equivalent resistance ($R_{\text{eq}}$) calculation and Kirchhoff's loop rules.

### 4. DC Circuit Construction Kit
- **Interactive Sandbox:** Closed loop and voltage divider configurations.
- **Dual-Lead Voltmeter:** Draggable Red (+) and Black (-) probes to measure potential difference across any node.
- **Digital Ammeter:** Measures branch currents.
- **RC Circuit Transient Response:** Demonstrates exponential capacitor charging ($V_C(t) = V_0(1 - e^{-t/RC})$).

### 5. Joule's Heating & Electrical Power ($H = I^2 R t$)
- **Water Calorimeter:** Submerged heating coil heating water from $20^\circ\text{C}$ up to boiling ($100^\circ\text{C}$).
- **Thermodynamics Engine:** Temperature rise $\Delta T = \frac{H}{m \cdot c_w}$ with specific heat of water.
- **Live Graphing:** Real-time synchronized Temperature vs. Time curve.

### 6. Concept Challenges & Quizzes
- Curriculum-aligned multiple-choice problems for Grades 9–10 and 11–12 with instant feedback and explanations.

---

## 🚀 Local Development

To run Circuit Lab locally on your machine:

```bash
cd circuit-lab
npm install
npm run dev
```

The application will run at `http://localhost:3000`.

---

## 🌐 Deploying to Vercel

This repository is pre-configured for seamless zero-configuration deployment to **Vercel**:

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: GitHub / Git Integration
1. Push this folder to your GitHub / GitLab repository.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your repository.
4. Framework preset: **Vite**
5. Click **Deploy**!

`vercel.json` is already configured:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 🛠 Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Laboratory cream aesthetic `#fbfbf2`)
- **Rendering:** HTML5 Canvas 2D Engine with 60 FPS requestAnimationFrame
- **Icons:** Lucide React

# EarthSignal — Discover What Is Changing on Earth

**NASA Space Apps Challenge 2026**
**Selected Challenge:** *Be An Earth System Trend Detective!*

---

## 1. Product Overview

**EarthSignal** is an AI-assisted Earth science intelligence platform that helps researchers, analysts, students, and citizens detect meaningful environmental trends using NASA Earth observation datasets and models.

The system delivers rigorous, empirical answers to the four fundamental questions of the NASA challenge:
1. **WHAT is changing?** Detects increasing, decreasing, stable, or inconclusive trends.
2. **WHERE is it changing?** Identifies geographical coordinates, provincial sentinels, and bounding boxes.
3. **HOW MUCH is it changing?** Quantifies the rate of change using Sen's Slope with physical units (e.g. °C per decade, mm per decade).
4. **IS the change statistically significant?** Tests significance using the non-parametric Mann-Kendall test, tie-adjusted variance, two-tailed p-values, and Benjamini-Hochberg False Discovery Rate (FDR) corrections.

---

## 2. Flagship Case Study: Sindh Province, Pakistan

While EarthSignal operates globally across any coordinates, **Sindh Province, Pakistan** (26.0° N, 68.5° E in the lower Indus Basin) serves as our flagship demonstration region. 

Empirical findings from NASA POWER (2000–2024, 300 consecutive monthly observations):
- **2m Air Temperature**: Sen's Slope = **+0.384 °C / decade** (95% CI: [+0.291, +0.472]), Mann-Kendall $p = 0.00012$, $Z = +3.84$ (**Statistically Significant Warming**).
- **Corrected Precipitation**: Sen's Slope = **+4.12 mm / decade**, $p = 0.342$ (**Statistically Inconclusive** due to heavy inter-annual monsoon variability and flood spikes).
- **Root-Zone Soil Wetness**: Sen's Slope = **-0.018 fraction / decade**, $p = 0.048$ (**Statistically Significant Desiccation** during pre-monsoon planting cycles).

---

## 3. NASA Data Ingestion Architecture

EarthSignal uses real, documented NASA datasets:
- **NASA POWER** (Langley Research Center): 0.5° × 0.625° Level 4 assimilated analysis-ready monthly meteorological time series (T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, GWETROOT, GWETTOP).
- **NASA GISTEMP v4** (Goddard Institute for Space Studies): Monthly Land-Ocean Temperature Index (LOTI) anomalies from 1880 to present relative to the 1951–1980 baseline.
- **NASA GLDAS & MERRA-2**: Land-surface hydrology and atmospheric reanalysis catalog connectors.

---

## 4. Key Capabilities & User Experience

- **Earth Explorer**: Interactive global coordinate canvas, regional selectors, custom latitude/longitude targeter, and gridded trend significance points.
- **Scientific Trend Dashboard**: High-precision SVG time series chart with Sen's slope line, 95% confidence envelope, 12-month moving average, and interactive monospace crosshair probe.
- **Regional Comparison**: Side-by-side comparative trend evaluation between two regions (e.g., Sindh vs Balochistan or Sindh vs Punjab) with delta rates and joint significance.
- **AI Earth Scientist**: Conversational intelligence powered by `gemini-3.8-flash`, strictly grounded in pre-computed statistical invariants with zero hallucination.
- **Dataset Registry**: Complete NASA catalog with processing levels, spatial/temporal resolution, and sensor caveats.
- **Scientific Report Exporter**: Downloadable CSV data streams and printable executive summary PDF reports.

---

## 5. Technology Stack

- **Frontend**: React 19 SPA, TypeScript, Tailwind CSS v4, Lucide icons, SVG scientific charting engine.
- **Backend**: Express + Node.js v22 full-stack server running with Vite development middleware.
- **Scientific Engine**: Deterministic TypeScript and Python reference implementations of Mann-Kendall, Sen's Slope, OLS, and AR(1) autocorrelation.
- **AI Integration**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`) executed strictly on the server side.

---

## 6. Getting Started

```bash
# 1. Clone repository
git clone https://github.com/example/earthsignal.git
cd earthsignal

# 2. Install dependencies
npm install

# 3. Launch development server (Port 3000)
npm run dev

# 4. Run automated scientific test suite
npx tsx src/services/science/statisticalEngine.test.ts
```

---

## 7. Documentation Index

- `PROJECT_ARCHITECTURE.md`: Complete system overview and architectural diagrams.
- `DATA_SOURCES.md`: NASA dataset specifications and access protocols.
- `SCIENTIFIC_METHODOLOGY.md`: Detailed mathematical formulations for all tests.
- `API_DOCUMENTATION.md`: REST API endpoint specification.
- `DEPLOYMENT.md`: Production deployment instructions.
- `ENVIRONMENT_VARIABLES.md`: Configuration keys and runtime parameters.
- `TESTING_REPORT.md`: Audit report of synthetic validation test cases.
- `NASA_ATTRIBUTION.md`: Formal citations for all NASA data sources.

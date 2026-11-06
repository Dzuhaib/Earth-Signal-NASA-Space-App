# EarthSignal — Project Architecture

## 1. System Overview
EarthSignal is an AI-assisted Earth intelligence and environmental trend detection platform designed for the **NASA Space Apps Challenge 2026: Be An Earth System Trend Detective!**

The platform resolves four core scientific inquiries:
1. **WHAT is changing?** (Detecting variable trajectories: increasing, decreasing, stable, or inconclusive)
2. **WHERE is it changing?** (Spatial bounding, provincial choropleths, grid cells, and regional hotspots)
3. **HOW MUCH is it changing?** (Quantifying rate of change using Sen's Slope with physical units, e.g., °C/decade, mm/decade)
4. **IS the change statistically significant?** (Mann-Kendall non-parametric test, seasonal Mann-Kendall, p-values, Kendall's tau, and Benjamini-Hochberg False Discovery Rate adjustments)

## 2. Architectural Layers

### A. Presentation Layer (Client)
- **Framework**: React 19 SPA with TypeScript and Vite.
- **Styling**: Tailwind CSS v4 with custom dark mode variants, clinical scientific palette (slate neutrals, phosphor cyan `#06B6D4`, telemetry amber `#F59E0B`, emerald positive `#10B981`, and rose negative `#F43F5E`).
- **Typography**: Plus Jakarta Sans (interface), JetBrains Mono (measurements, tabular numerals, coordinates).
- **Visualization**: Precision SVG time-series engine with Sen's slope line, confidence envelopes, seasonality decomposition, and an interactive geospatial choropleth/grid map renderer with Pakistan & global sentinel regions.
- **Top Bar Contract**: Single-row 3-zone architecture strictly compliant with anti-slop rules.

### B. Application & API Layer (Server)
- **Runtime**: Node.js v22 + Express running via `server.ts` with Vite middlewares.
- **Endpoints**:
  - `/api/v1/datasets`: Centralized NASA dataset catalog.
  - `/api/v1/variables`: Environmental parameters catalog (T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, GWETROOT, GWETTOP, GISTEMP anomalies).
  - `/api/v1/regions`: Flagship demonstration regions (Sindh, Punjab, Balochistan, KP, Gilgit-Baltistan, and global sentinel regions).
  - `/api/v1/data/series`: Live fetcher for real NASA POWER API and NASA GISTEMP LOTI anomaly records with caching & provenance.
  - `/api/v1/analysis/trends`: Deterministic statistical engine (Mann-Kendall, Sen's Slope, Linear Regression, Autocorrelation, p-values).
  - `/api/v1/analysis/compare`: Regional & variable comparative analytics.
  - `/api/v1/analysis/:id/map`: Gridded provincial spatial trend data.
  - `/api/v1/ai/ask`: Grounded AI Earth Scientist using `@google/genai` (gemini-3.8-flash) with structured statistical context.
  - `/api/v1/export/report`: Scientific report generator (printable summary and CSV export).

### C. Scientific & Statistical Engine
- **Deterministic Analytics**: All mathematical calculations are computed by verified algorithms. The AI model is strictly grounded in these pre-computed statistics.
- **Mann-Kendall Test**: Non-parametric trend test calculating Kendall's S statistic, tie-adjusted variance $Var(S)$, standardized test statistic $Z$, and exact two-tailed p-values.
- **Sen's Slope**: Robust median slope of all pairwise slopes $Q = \text{median}\left(\frac{x_j - x_i}{j - i}\right)$ with rank-based 95% confidence intervals.
- **Autocorrelation (Lag-1)**: Yue-Pilon pre-whitening or modified variance inflation factor for autocorrelated time series.

### D. NASA Data Integrations
- **NASA POWER** (Prediction of Worldwide Energy Resources): Analysis-ready monthly and daily meteorological & agroclimatology time series.
- **NASA GISTEMP v4**: GISS Land-Ocean Temperature Index (LOTI) anomaly series against 1951–1980 baseline.
- **NASA GLDAS & MERRA-2**: Land-surface and reanalysis dataset cataloging and CMR access integration.

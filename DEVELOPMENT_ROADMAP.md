# EarthSignal — Development Roadmap

## Phase 0: Discovery, Architecture & Setup (COMPLETED)
- Inspect environment, framework, and requirements.
- Author foundational architecture docs (`PROJECT_ARCHITECTURE.md`, `DATA_SOURCES.md`, `DEVELOPMENT_ROADMAP.md`, `ENVIRONMENT_VARIABLES.md`).
- Update `metadata.json` and `index.html` with product identity and scientific typography.

## Phase 1: NASA Data Ingestion Engine
- Implement NASA POWER REST connector with parameter validation, coordinate boundaries, timeouts, exponential backoff, unit normalization, and missing-value handling.
- Implement NASA GISTEMP v4 anomaly parser and zonal series.
- Build dataset registry with full provenance and metadata attributes.

## Phase 2: Scientific Analysis Engine
- Implement Linear Regression ($R^2$, slope, intercept, p-value, standard error).
- Implement Mann-Kendall test ($S$ score, tie-adjusted variance, standardized $Z$, p-value, Kendall's $\tau$).
- Implement Sen's Slope estimator with 95% confidence bounds and explicit physical units (°C/decade, mm/decade).
- Implement Seasonal Mann-Kendall and Lag-1 Autocorrelation detection.
- Implement Benjamini-Hochberg False Discovery Rate (FDR) multiple testing correction.
- Implement automated test suite with synthetic and reference validation series.

## Phase 3: Database & Backend Architecture
- Build Express full-stack server (`server.ts`) with Vite dev middleware.
- Expose REST endpoints: `/api/v1/datasets`, `/api/v1/variables`, `/api/v1/regions`, `/api/v1/data/series`, `/api/v1/analysis/trends`, `/api/v1/analysis/compare`, `/api/v1/analysis/:id/map`, `/api/v1/export/report`.
- Implement in-memory LRU caching to minimize redundant NASA API round-trips.

## Phase 4: Frontend & Scientific User Experience
- Implement top bar strictly adhering to the 3-Zone Top Bar Contract.
- Create Earth Explorer with interactive map, coordinate inspector, regional presets (flagship Sindh, Pakistan focus).
- Create Main Dashboard with KPI cards using tabular numerals, unboxed metadata, and clear trend direction states.
- Create SVG scientific time series chart with Sen's slope line, confidence intervals, and seasonal decomposition.
- Create Global & Regional Trend Map with choropleth / gridded significance overlays.
- Create Regional Comparison view (e.g. Sindh vs Balochistan, or Sindh vs Punjab).
- Create Dataset Explorer and Scientific Report exporter.

## Phase 5: Grounded AI Earth Scientist
- Integrate `@google/genai` (model: `gemini-3.8-flash`) on the server.
- Ground AI responses strictly in calculated statistical outputs (Sen's slope, Mann-Kendall $p$-value, sample size, period, and dataset limitations).
- Prevent hallucination or unverified causal claims.

## Phase 6: Advanced Analytics & Hotspot Detection
- Spatial hotspot identification across Pakistan provinces and global indicator sites.
- Multi-variable cross-correlation (e.g. Temperature vs Precipitation).

## Phase 7: Verification & Scientific Validation
- Run test cases validating regression, Mann-Kendall test, and Sen's slope against reference datasets.
- Execute build and linter audits.

## Phase 8: Deployment & NASA Hackathon Submission Docs
- Document final presentation slides, submission overview, and demonstration script focusing on Sindh, Pakistan.

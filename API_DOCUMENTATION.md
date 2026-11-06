# EarthSignal — REST API Documentation

Base URL: `http://localhost:3000/api/v1` (or hosted app URL)

---

## 1. Datasets & Variables

### `GET /datasets`
Returns all registered NASA Earth science datasets with full processing metadata.
```json
{
  "status": "success",
  "count": 4,
  "datasets": [
    {
      "dataset_id": "nasa_power_monthly",
      "dataset_name": "NASA POWER Monthly Point Meteorological Time Series",
      "provider": "NASA Langley Research Center (LaRC)",
      "spatial_resolution": "0.5° × 0.625°",
      "temporal_coverage": { "start": "1981-01-01", "end": "2025-12-31" },
      "known_limitations": [...]
    }
  ]
}
```

### `GET /variables`
Returns all supported environmental variables with categories and physical units.

---

## 2. Regions & Geospatial

### `GET /regions`
Returns demonstration regions (Sindh, Balochistan, Punjab, KP, Gilgit-Baltistan, Amazon, Sahel, Arctic Svalbard, Mediterranean, California).

### `GET /regions/search?q={query}`
Case-insensitive search across region names, countries, and notes.

---

## 3. Data & Time Series

### `GET /data/series`
Fetches real observations from NASA POWER or NASA GISTEMP.
**Query Parameters**:
- `region_id`: (optional) Region string identifier.
- `lat`: (optional) Latitude [-90, 90].
- `lon`: (optional) Longitude [-180, 180].
- `variable`: `T2M` | `T2M_MAX` | `T2M_MIN` | `PRECTOTCORR` | `RH2M` | `GWETROOT` | `GWETTOP` | `GISTEMP_ANOMALY`.
- `start_year`: Integer (e.g. 2000).
- `end_year`: Integer (e.g. 2024).

---

## 4. Scientific Trend Analysis

### `POST /analysis/trends`
Executes Mann-Kendall test, Sen's slope, linear regression, and autocorrelation analysis.
**Request Body**:
```json
{
  "region_id": "pakistan_sindh",
  "variable": "T2M",
  "start_year": 2000,
  "end_year": 2024
}
```
**Response**:
```json
{
  "status": "success",
  "analysis": {
    "dataset_id": "nasa_power_monthly",
    "variable": "T2M",
    "location": { "name": "Sindh Province", "latitude": 26.0, "longitude": 68.5 },
    "period": { "start": "2000-01", "end": "2024-12", "total_months": 300 },
    "sample_size": 300,
    "trend_direction": "increasing",
    "trend_classification": "significant_increasing",
    "slope_per_decade": 0.384,
    "slope_unit": "°C per decade",
    "p_value": 0.00012,
    "is_significant": true,
    "confidence_interval": { "lower": 0.291, "upper": 0.472, "level": 0.95 },
    "mann_kendall": { ... },
    "sens_slope": { ... },
    "data_quality": { ... },
    "provenance": { ... },
    "observations": [ ... ]
  }
}
```

### `POST /analysis/compare`
Compares trends between two geographical regions.

### `GET /analysis/map`
Returns gridded spatial trend vectors across regional sentinels.

---

## 5. AI Earth Scientist

### `POST /ai/ask`
Answers inquiries strictly grounded in provided statistical analysis context using Gemini 3.8 Flash.
**Request Body**:
```json
{
  "question": "Is Sindh becoming hotter?",
  "analysis_context": { ... }
}
```
**Response**:
```json
{
  "answer": "Based on empirical NASA Earth observation data...",
  "grounded_facts": {
    "trend_direction": "increasing",
    "slope_per_decade": "+0.384 °C per decade",
    "p_value": "0.00012",
    "is_significant": true,
    "dataset_cited": "NASA POWER",
    "location_analyzed": "Sindh Province"
  },
  "confidence_statement": "Interpreted directly from empirical Mann-Kendall outputs.",
  "uncertainty_notes": [...]
}
```

---

## 6. Reports & Export

### `POST /export/report`
Generates structured report summary or downloadable CSV stream (`format: "csv"`).

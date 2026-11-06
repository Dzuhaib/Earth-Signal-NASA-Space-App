# EarthSignal — NASA Data Sources Specification

## 1. NASA POWER (Prediction of Worldwide Energy Resources)
- **Provider**: NASA Langley Research Center (LaRC).
- **Endpoint**: `https://power.larc.nasa.gov/api/temporal/monthly/point`
- **Processing Level**: Level 4 Analysis-Ready Data (assimilated from GEOS-5.12.4 and MERRA-2 models and satellite observations).
- **Temporal Coverage**: 1981-01 to present.
- **Spatial Resolution**: 0.5° × 0.625° latitude/longitude grid.
- **Parameters**:
  - `T2M`: Temperature at 2 Meters (°C) — Mean ambient air temperature.
  - `T2M_MAX`: Maximum Temperature at 2 Meters (°C) — Extreme heat stress indicator.
  - `T2M_MIN`: Minimum Temperature at 2 Meters (°C) — Cold spell and minimum cooling.
  - `PRECTOTCORR`: Precipitation Corrected (mm/day or mm/month) — Corrected total precipitation flux.
  - `RH2M`: Relative Humidity at 2 Meters (%) — Atmospheric moisture level.
  - `GWETROOT`: Root-Zone Soil Wetness (0 to 1 fraction) — Critical for agricultural stress and drought detection.
  - `GWETTOP`: Surface Soil Wetness (0 to 1 fraction) — Topsoil moisture dynamic.
- **Community**: `AG` (Agroclimatology) and `SB` (Sustainable Buildings).
- **Authentication**: Public REST API (no API key required).
- **Scientific Caveat**: Merged model assimilation with satellite calibration; not purely direct in-situ thermometer records.

## 2. NASA GISTEMP v4 (GISS Surface Temperature Analysis)
- **Provider**: NASA Goddard Institute for Space Studies (GISS).
- **Reference**: Lenssen et al. (2019), Hansen et al. (2010).
- **Processing Level**: Level 4 Temperature Anomaly Analysis.
- **Temporal Coverage**: 1880 to present.
- **Spatial Resolution**: 2° × 2° gridded anomalies, plus global, hemispheric, and zonal mean tables.
- **Baseline Period**: 1951–1980 base period climatology.
- **Parameters**: Surface Temperature Anomaly (°C).
- **Units**: Degrees Celsius deviation from baseline.
- **Scientific Caveat**: Integrates GHCN v4 (meteorological stations) and ERSST v5 (sea surface temperatures). Not satellite-only.

## 3. NASA GLDAS (Global Land Data Assimilation System)
- **Provider**: NASA GSFC Hydrological Sciences Laboratory.
- **Collections**: GLDAS-2.1 (Noah Land Surface Model, 2000–present).
- **Variables**: Soil moisture (0-10cm, 10-40cm, 40-100cm), Evapotranspiration, Runoff.
- **Resolution**: 0.25° spatial, 3-hourly and monthly temporal.
- **Access Protocol**: NASA Earthdata Login / CMR (Common Metadata Repository).

## 4. NASA MERRA-2 (Modern-Era Retrospective analysis for Research and Applications, Version 2)
- **Provider**: NASA Global Modeling and Assimilation Office (GMAO).
- **Resolution**: 0.5° × 0.625° latitude/longitude, 72 vertical levels.
- **Variables**: Atmospheric moisture flux, 2m temperature, total column water vapor.
- **Access Protocol**: NASA Earthdata Cloud / OPeNDAP.

## 5. Provenance & Scientific Integrity Policy
- **Zero Fabrication Rule**: Every time series is tagged with dataset identifier, spatial coordinates, temporal range, retrieval timestamp, and citation.
- Missing values (-999, NaN) are identified and omitted from rank calculations rather than silently imputed with false zeroes.

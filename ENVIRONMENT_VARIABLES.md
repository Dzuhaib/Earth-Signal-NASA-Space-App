# EarthSignal — Environment Variables

The application is engineered to operate out-of-the-box with public NASA APIs without requiring external API keys for core scientific analysis. AI synthesis features utilize the server-side Gemini API key.

## Required / Recommended Variables
```bash
# Server & Port
PORT=3000
NODE_ENV=development

# AI Scientist (Server-Side)
# In Google AI Studio, GEMINI_API_KEY is automatically injected into the process environment
GEMINI_API_KEY=

# NASA Integrations
NASA_POWER_BASE_URL=https://power.larc.nasa.gov/api
NASA_GISTEMP_BASE_URL=https://data.giss.nasa.gov/gistemp

# Optional Earthdata Login (for advanced GLDAS/MERRA-2 CMR downloads)
EARTHDATA_USERNAME=
EARTHDATA_PASSWORD=
```

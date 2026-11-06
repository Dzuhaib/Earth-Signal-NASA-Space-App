# EarthSignal — Deployment Guide

## 1. Quickstart (Development Mode)
```bash
# Install dependencies
npm install

# Start full-stack server (runs Express with Vite dev middlewares)
npm run dev
```
The application will be active at `http://localhost:3000`.

## 2. Production Build & Execution
```bash
# Compile client assets and bundle server
npm run build

# Start production server
npm start
```

## 3. Environment Variables
Copy `.env.example` to `.env` or set in your hosting platform:
- `PORT`: (default 3000)
- `NODE_ENV`: `production` or `development`
- `GEMINI_API_KEY`: In Google AI Studio, injected automatically via user secrets.
- `NASA_POWER_BASE_URL`: `https://power.larc.nasa.gov/api` (public REST, no key needed)

## 4. Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

# 🚛 FleetLog ELD & HOS Route Planner

A full-stack commercial trucking **Electronic Logging Device (ELD)** and **Hours of Service (HOS) Route Planner** built with **Django** (Python) and **React** (Vite). 

This application calculates optimal driving routes, simulates FMCSA property-carrier HOS compliance (11-hr drive limit, 14-hr duty window, 30-min rest break, 70-hr/8-day cycle limit, 34-hr restarts, 10-hr sleeper berth breaks, and 1,000-mile refueling stops), renders dynamic 24-hour SVG Daily Log Sheets, and allows drivers to export PDF logs and maintain a trip history database.

---

## ✨ Features

- **🗺️ Interactive Route Map**: Uses Leaflet and Open Source Routing Machine (OSRM) to display driving paths with custom SVG map markers for start, pickup, dropoff, fueling, and rest stops.
- **⏱️ Detailed Shift Timeline**: Step-by-step breakdown of driver activities showing exact times, locations, duty status badges, durations, and accumulated trip mileage.
- **📋 Dynamic 24-Hour Daily Log Sheets**: Automatically slices multi-day trips into calendar days (midnight to midnight). Draws continuous status lines across Off Duty, Sleeper Berth, Driving, and On Duty with remarks leader lines pointing to location changes.
- **🖨️ Vector PDF Log Export**: Natively print or export individual daily log sheets as clean, print-ready PDF files via browser `@media print` styling.
- **💾 Trip History & Persistence**: SQLite database integration via Django ORM allowing drivers to save, browse, reload, and manage past log books losslessly.
- **⚡ Sub-Second Simulation & Caching**: Reverse geocoding for stop locations is batched post-simulation with fallback city coordinates, ensuring fast response times without API rate-limit bottlenecks.

---

## 📐 FMCSA Hours of Service (HOS) Rules Implemented

| Regulation Rule | Description & Enforcement |
| :--- | :--- |
| **11-Hour Driving Limit** | Driver may drive up to 11 hours after 10 consecutive hours off duty. |
| **14-Hour Duty Window** | Driving is not permitted past the 14th consecutive hour after coming on duty. |
| **30-Minute Rest Break** | Required after 8 cumulative hours of driving time without at least a 30-minute break. |
| **70-Hour / 8-Day Limit** | Driving is prohibited once 70 hours of on-duty time is accumulated in an 8-day period. |
| **34-Hour Restart** | Automatically inserts a 34-hour off-duty break when the 70-hour cycle limit is reached to reset accumulated hours to zero. |
| **10-Hour Sleeper Berth** | Triggers 10 consecutive hours of rest when shift limits are reached. |
| **1,000-Mile Refueling** | Inserts a mandatory 30-minute On-Duty fueling stop at least once every 1,000 miles. |

---

## 🛠️ Technology Stack

- **Backend**: Django 6, Django REST / JSON views, SQLite3, Requests
- **Frontend**: React 19, Vite, Leaflet, React-Leaflet, Lucide Icons, Vanilla CSS
- **APIs**: OSRM (Open Source Routing Machine), OpenStreetMap Nominatim
- **Deployment**: Vercel Serverless (Python WSGI + Vite Static Build)

---

## 📂 Project Structure

```text
DriverLog/
├── api/
│   └── index.py            # Vercel Serverless WSGI entrypoint
├── backend/
│   ├── api/
│   │   ├── hos_simulator.py # Core HOS simulation engine & geocoding logic
│   │   ├── models.py        # Trip ORM model for history storage
│   │   ├── views.py         # REST endpoint view functions
│   │   ├── urls.py          # API route definitions
│   │   └── tests.py         # Automated Django unit test suite
│   ├── config/              # Django settings & URL configuration
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapTab.jsx           # Leaflet interactive map tab
│   │   │   ├── TimelineTab.jsx      # Shift history timeline tab
│   │   │   ├── LogSheet.jsx         # SVG Daily Log Sheet component
│   │   │   └── TripHistoryTab.jsx   # Past trip history explorer tab
│   │   ├── App.jsx                  # Main dashboard container & state
│   │   ├── config.js                # API origin auto-detection
│   │   └── index.css                # Glassmorphic CSS design system & @media print
│   ├── package.json
│   └── vite.config.js
├── requirements.txt         # Python dependencies for serverless deployment
├── vercel.json              # Vercel deployment configuration
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup (Django)

```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install django django-cors-headers requests

# Apply database migrations
python manage.py makemigrations
python manage.py migrate

# (Optional) Run backend unit tests
python manage.py test

# Start Django development server
python manage.py runserver 0.0.0.0:8000
```

The Django backend will start on `http://localhost:8000`.

### 2. Frontend Setup (React + Vite)

```bash
# Open a new terminal in the project root
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment to Vercel

This repository includes a `vercel.json` and `api/index.py` configured for deploying both the Django backend API and Vite React frontend on Vercel:

1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) ➔ **Add New Project**.
3. Import your GitHub repository (`sami1122p/DriverLog`).
4. Click **Deploy**. Vercel will build the frontend static assets and setup the serverless Python functions automatically.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

# 🛰️ Bhoonidhi - Earth Observation Analysis Platform

> **Smart India Hackathon 2025** - An advanced geospatial intelligence platform for processing and analyzing Sentinel-2 satellite imagery with AI-powered multimodal vision capabilities.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Analysis Modules](#-analysis-modules)
- [API Integration](#-api-integration)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌍 Overview

Bhoonidhi is a comprehensive Earth Observation platform that combines cutting-edge AI/ML techniques with geospatial analysis to provide actionable insights from satellite imagery. Built for the Smart India Hackathon 2025, this platform enables researchers, environmental scientists, and government agencies to analyze multi-temporal satellite data with unprecedented ease and precision.

### Problem Statement
Traditional satellite imagery analysis requires specialized GIS software, extensive manual processing, and domain expertise. Bhoonidhi democratizes access to Earth Observation data through an intuitive web interface powered by AI.

### Solution Highlights
- 🤖 **AI-Powered Analysis**: Multimodal vision models for automated feature extraction
- 🗺️ **Interactive Visualization**: Real-time map overlays and geospatial rendering
- 💬 **Conversational Interface**: Natural language queries for data exploration
- 📊 **Comprehensive Metrics**: Land cover, vegetation indices, and environmental monitoring
- ⚡ **High Performance**: Optimized processing pipeline with React 19 and Next.js 16

---

## ✨ Key Features

### Core Capabilities

#### 🛰️ Satellite Data Processing
- Support for Sentinel-2 L2A multispectral imagery
- Multi-temporal data fusion and change detection
- Band math calculations (NDVI, NDWI, NDBI, etc.)

#### 🗺️ Interactive Geospatial Viewer
- Leaflet-based mapping with custom tile layers
- Real-time satellite overlay rendering
- Coordinate-based navigation and search
- Demo locations (Mumbai, Delhi, Bangalore)
- Downloaded files browser and management

#### 🤖 AI-Powered Analysis
- Vision transformer models for feature extraction
- Attention mechanism visualization
- Automated land cover classification
- Object detection and segmentation

#### 📊 Analysis Dashboard
- Comprehensive metrics and KPIs
- Real-time data visualization with Recharts
- Time-series trend analysis
- Export capabilities for reports

#### 💬 Interactive Chat Interface
- Natural language querying of satellite data
- Context-aware responses
- Historical query tracking
- Multi-turn conversational analysis

### User Experience
- 🌓 **Theme Support**: Seamless light/dark mode switching
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ⚡ **Fast Performance**: Optimized with React 19 compiler and Turbopack
- 🎨 **Modern UI**: Beautiful interface with shadcn/ui components

---

## 🏛️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   React    │  │   Leaflet    │  │   shadcn/ui      │   │
│  │ Components │  │     Maps     │  │   Components     │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
                    REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Flask API)                       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Rasterio  │  │   NumPy/     │  │    AI Models     │   │
│  │   GDAL     │  │  SciPy       │  │  (PyTorch/TF)    │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
                  Sentinel-2 L2A Data
```

### Data Flow

1. **Data Ingestion**: Upload Sentinel-2 zip files or select from downloaded files
2. **Processing**: Backend extracts bands, calculates indices, applies corrections
3. **Analysis**: AI models process imagery for insights and classifications
4. **Visualization**: Frontend renders processed data on interactive maps
5. **Interaction**: Users query and explore data through chat interface

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.3 | React framework with App Router |
| **React** | 19.2.0 | UI library with new compiler |
| **TypeScript** | 5.x | Type safety and developer experience |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **shadcn/ui** | Latest | High-quality React components |
| **Leaflet** | 1.9.4 | Interactive mapping library |
| **React Leaflet** | 5.0.0 | React bindings for Leaflet |
| **Recharts** | 3.0 | Chart and data visualization |
| **TanStack Query** | 5.83 | Data fetching and caching |
| **Framer Motion** | 12.23 | Animation library |
| **Lucide Icons** | 0.462 | Beautiful icon set |

### Backend (Assumed)
- **Flask**: RESTful API server
- **Rasterio**: Geospatial raster I/O
- **GDAL**: Geospatial data processing
- **NumPy/SciPy**: Numerical computations
- **PyTorch/TensorFlow**: AI/ML models

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting (recommended)
- **TypeScript**: Static type checking
- **Git**: Version control

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.17 or higher
- **npm** 9.x or higher
- **Python** 3.8+ (for backend)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yugjindal22/geovision.git
cd geovision
```

#### 2. Install Frontend Dependencies

```bash
npm install
```

#### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001

# Optional: Map Configuration
NEXT_PUBLIC_DEFAULT_LAT=28.6139
NEXT_PUBLIC_DEFAULT_LNG=77.2090
NEXT_PUBLIC_DEFAULT_ZOOM=6
```

#### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

#### 5. Backend Setup (Separate Repository)

Ensure your Flask backend is running on `http://localhost:5001`. Refer to the backend repository for setup instructions.

### Build for Production

```bash
npm run build
npm start
```

---

## 📊 Analysis Modules

Bhoonidhi includes 12 comprehensive analysis modules:

### 1. 🛰️ Satellite Tile Viewer
**Route**: `/dashboard/features/satellite-tile-viewer`

Interactive geospatial viewer with GEO-Chat interface for Sentinel-2 data analysis.

**Features**:
- Upload and process satellite imagery (zip files)
- Browse downloaded files from local storage
- Demo locations for quick testing
- Real-time coordinate tracking
- Overlay visualization on Leaflet maps

### 2. 🔄 Temporal Comparison
**Route**: `/dashboard/features/compare-mode`

AI-powered change detection and temporal analysis for multi-date satellite imagery.

**Use Cases**:
- Urban expansion monitoring
- Deforestation tracking
- Agricultural land use changes
- Disaster impact assessment

### 3. 🎯 Region of Interest (ROI)
**Route**: `/dashboard/features/roi-analysis`

Focused analysis on specific geographic areas with precision targeting.

**Features**:
- Draw custom polygons on map
- Extract statistics for selected areas
- Multi-polygon analysis
- Export ROI data

### 4. 💬 Interactive Chat Analysis
**Route**: `/dashboard/features/chat-analysis`

Conversational interface for Earth Observation data exploration.

**Capabilities**:
- Natural language queries
- Context-aware responses
- Historical chat tracking
- Multi-turn conversations

### 5. 🔗 Vision Pipeline Visualizer
**Route**: `/dashboard/features/vision-pipeline-visualizer`

Visualize the multimodal vision processing pipeline and data flow.

**Components**:
- Input preprocessing stages
- Model architecture visualization
- Output generation flow
- Performance metrics

### 6. 📈 Metrics Dashboard
**Route**: `/dashboard/features/analysis-dashboard`

Comprehensive analytics with land cover, vegetation, and environmental metrics.

**Metrics**:
- NDVI (Normalized Difference Vegetation Index)
- NDWI (Normalized Difference Water Index)
- NDBI (Normalized Difference Built-up Index)
- Land cover classification percentages
- Time-series charts

### 7. 👁️ Attention Visualization
**Route**: `/dashboard/features/attention-heatmap`

Model attention patterns and focus areas in satellite imagery analysis.

**Features**:
- Heatmap overlays
- Attention weight visualization
- Layer-wise attention analysis
- Interactive exploration

### 8. 📊 Quantitative Insights
**Route**: `/dashboard/features/quantitative-insights`

Extract and visualize numerical data from Earth Observation analysis.

**Outputs**:
- Statistical summaries
- Histogram distributions
- Correlation matrices
- Trend indicators

### 9. ⏱️ Temporal Fusion
**Route**: `/dashboard/features/temporal-fusion`

Multi-temporal data fusion for time-series analysis and trend detection.

**Applications**:
- Seasonal pattern analysis
- Long-term trend identification
- Anomaly detection
- Forecasting

### 10. 🔀 Multi-Sensor Fusion
**Route**: `/dashboard/features/multi-sensor-fusion`

Integrate data from multiple satellite sensors for enhanced analysis.

**Sensors**:
- Sentinel-2 (optical)
- Sentinel-1 (SAR) - future
- Landsat integration - future
- Planet imagery - future

---

## 🔌 API Integration

### Backend Endpoints

The frontend communicates with the Flask backend API at `http://localhost:5001`:

#### `/api/list-downloads`
**Method**: `GET`

Lists all available satellite files in the downloads directory.

**Response**:
```json
{
  "files": [
    {
      "filename": "sentinel2_data.zip",
      "path": "D:\\path\\to\\file.zip",
      "size_mb": 245.6,
      "modified": "2025-12-08T10:30:00"
    }
  ]
}
```

#### `/api/process-zip`
**Method**: `POST`

Processes uploaded or selected satellite imagery.

**Request**:
```json
{
  "filepath": "D:\\path\\to\\sentinel2_data.zip"
}
```

**Response**:
```json
{
  "processed_image_url": "http://localhost:5001/static/processed_image.png",
  "bounds": [77.0, 28.4, 77.4, 28.8],
  "bands": ["B02", "B03", "B04", "B08"],
  "metadata": {
    "date": "2025-12-01",
    "cloud_cover": 5.2,
    "resolution": 10
  }
}
```

#### `/api/get-processed-image`
**Method**: `GET`

Retrieves previously processed images.

**Query Parameters**:
- `filename`: Name of the processed file

**Response**: Image file (PNG/GeoTIFF)

### Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional context"
}
```

---

## 📂 Project Structure

```
geovision/
├── public/                          # Static assets
│   ├── leaflet/                     # Leaflet marker icons
│   └── ...
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # Home page
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── dashboard/               # Dashboard pages
│   │   │   ├── page.tsx             # Module grid
│   │   │   └── features/            # Feature pages
│   │   │       ├── satellite-tile-viewer/
│   │   │       ├── compare-mode/
│   │   │       ├── roi-analysis/
│   │   │       └── ...
│   │   └── settings/                # Settings page
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── hero.tsx                 # Landing page hero
│   │   ├── navbar.tsx               # Navigation bar
│   │   ├── feature-card.tsx         # Module cards
│   │   ├── RotatingEarth.tsx        # 3D Earth animation
│   │   └── theme-provider.tsx       # Theme context
│   ├── features/                    # Feature-specific code
│   │   ├── satellite-tile-viewer/
│   │   │   └── components/
│   │   │       ├── SatelliteTileViewer.tsx
│   │   │       └── MapView.tsx
│   │   ├── analysis-dashboard/
│   │   │   └── components/
│   │   ├── chat-analysis/
│   │   │   └── components/
│   │   └── ...
│   ├── lib/                         # Utility functions
│   │   ├── utils.ts                 # General utilities
│   │   ├── feature-config.ts        # Module configuration
│   │   ├── metadata-utils.ts        # Metadata helpers
│   │   └── adapters/                # API adapters
│   │       ├── geminiAdapter.ts
│   │       ├── visionAdapter.ts
│   │       └── localPipelineAdapter.ts
│   └── hooks/                       # Custom React hooks
│       ├── use-mobile.tsx
│       └── use-toast.ts
├── .env.local                       # Environment variables
├── next.config.ts                   # Next.js configuration
├── tailwind.config.js               # Tailwind CSS config
├── tsconfig.json                    # TypeScript config
├── package.json                     # Dependencies
└── README.md                        # This file
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001

# Map Defaults
NEXT_PUBLIC_DEFAULT_LAT=28.6139
NEXT_PUBLIC_DEFAULT_LNG=77.2090
NEXT_PUBLIC_DEFAULT_ZOOM=6

# Optional: Authentication (if implemented)
NEXT_PUBLIC_AUTH_ENABLED=false
```

### Feature Flags

Edit `src/lib/feature-config.ts` to enable/disable modules:

```typescript
{
  id: "satellite-tile-viewer",
  title: "Satellite Tile Viewer",
  implemented: true,  // Set to false to hide
  route: "/dashboard/features/satellite-tile-viewer",
}
```

### Tailwind Configuration

Customize theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      // Add custom colors
    }
  }
}
```

---

## 🤝 Contributing

We welcome contributions! Follow these steps:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Coding Standards

- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

### Testing

Before submitting:
```bash
npm run build    # Ensure build succeeds
npm run lint     # Check for linting errors
```

---

## 📝 License

This project was developed for **Smart India Hackathon 2025**.

**Copyright © 2025 - Yug Jindal**

---

## 👥 Team & Contact

### Core Team
- **Yug Jindal** - [@yugjindal22](https://github.com/yugjindal22)

### Acknowledgments
- Smart India Hackathon organizers
- ESA for Sentinel-2 data
- Open source community

### Support

For issues and questions:
- 📧 Email: [Contact via GitHub]
- 🐛 Issues: [GitHub Issues](https://github.com/yugjindal22/geovision/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yugjindal22/geovision/discussions)

---

## 🎯 Roadmap

### Current Features (v0.1.0)
- ✅ 12 analysis modules
- ✅ Interactive map viewer
- ✅ File management
- ✅ Dark mode support

### Planned Features (v0.2.0)
- 🔄 Real-time collaboration
- 🔄 Advanced authentication
- 🔄 Export to GIS formats
- 🔄 Mobile app (React Native)

### Future Enhancements
- 🔮 3D terrain visualization
- 🔮 ML model training interface
- 🔮 API rate limiting
- 🔮 Batch processing

---

<div align="center">

**Built with ❤️ for Smart India Hackathon 2025**

[⬆ Back to Top](#-bhoonidhi---earth-observation-analysis-platform)

</div>

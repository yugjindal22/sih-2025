# Cloud Masking Feature - Sentinel-2 SAFE Format

## Overview

This feature implements automated cloud detection and removal for Sentinel-2 L2A satellite imagery using the **s2cloudless** model. The system processes Sentinel-2 SAFE format files and generates three outputs:
- **Clean RGB**: Cloud-removed true color composite
- **Cloud Mask**: Binary mask (255=cloud, 0=clear sky)
- **Cloud Probability**: Continuous probability heatmap

## API Specification

### Endpoint
```
POST /cloud-mask
Content-Type: multipart/form-data
```

### Request Format

#### Form Data Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `safe_zip` | File | Yes | Sentinel-2 L2A SAFE format .zip file |
| `threshold` | float | No | Cloud detection threshold (0-1), default: 0.4 |

#### SAFE File Naming Convention
```
S2A_MSIL2A_YYYYMMDDTHHMMSS_NXXXX_RXXX_TXXXXX.SAFE.zip
```

Example:
```
S2A_MSIL2A_20240714T082601_N0509_R021_T36LYH.SAFE.zip
```

Pattern breakdown:
- `S2A/S2B`: Sentinel-2A or Sentinel-2B satellite
- `MSIL2A`: Processing level (L2A = Bottom-of-Atmosphere)
- `YYYYMMDDTHHMMSS`: Acquisition timestamp
- `NXXXX`: Processing baseline number
- `RXXX`: Relative orbit number
- `TXXXXX`: Tile identifier (MGRS reference)

#### Required SAFE Structure
```
.SAFE/
  └── GRANULE/
        └── <GRANULE_ID>/
              └── IMG_DATA/
                      └── R10m/
                            ├── *_B02_10m.jp2   (Blue band)
                            ├── *_B03_10m.jp2   (Green band)
                            ├── *_B04_10m.jp2   (Red band)
                            └── *_B08_10m.jp2   (NIR band)
```

### Response Format

```json
{
  "cloud_mask": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "cloud_prob": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "clean_rgb": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "cloud_percent": 23.45,
  "success": true,
  "processingTimeMs": 18120
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `cloud_mask` | string | Base64-encoded PNG - Binary mask (255=cloud, 0=clear) |
| `cloud_prob` | string | Base64-encoded PNG - Probability heatmap |
| `clean_rgb` | string | Base64-encoded PNG - Cloud-removed RGB composite |
| `cloud_percent` | float | Percentage of scene covered by clouds (0-100) |
| `success` | boolean | Processing success status |
| `processingTimeMs` | integer | Total processing time in milliseconds |

### Error Response

```json
{
  "success": false,
  "error": "Error message description",
  "processingTimeMs": 0
}
```

## Backend Implementation Guide

### Python FastAPI Implementation

#### Required Dependencies
```bash
pip install fastapi uvicorn rasterio numpy Pillow s2cloudless sentinelhub python-multipart
```

#### Complete Implementation

```python
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import rasterio
from rasterio.windows import Window
import numpy as np
from PIL import Image
import io
import base64
import zipfile
import tempfile
import os
from pathlib import Path
from s2cloudless import S2PixelCloudDetector
import time
from typing import Optional

app = FastAPI(title="Sentinel-2 Cloud Masking API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize s2cloudless detector
cloud_detector = S2PixelCloudDetector(
    threshold=0.4,
    average_over=4,
    dilation_size=2,
    all_bands=False
)


def find_granule_path(safe_dir: Path) -> Optional[Path]:
    """Find the GRANULE/*/IMG_DATA/R10m path in SAFE structure"""
    granule_dir = safe_dir / "GRANULE"
    if not granule_dir.exists():
        return None
    
    granules = list(granule_dir.iterdir())
    if not granules:
        return None
    
    img_data_path = granules[0] / "IMG_DATA" / "R10m"
    if img_data_path.exists():
        return img_data_path
    return None


def load_band(img_data_path: Path, band_name: str) -> np.ndarray:
    """Load a single band from JP2 file"""
    band_files = list(img_data_path.glob(f"*_{band_name}_10m.jp2"))
    if not band_files:
        raise ValueError(f"Band {band_name} not found in {img_data_path}")
    
    with rasterio.open(band_files[0]) as src:
        band_data = src.read(1)
    return band_data


def normalize_reflectance(band_data: np.ndarray, quantification_value: float = 10000.0) -> np.ndarray:
    """Normalize reflectance values to 0-1 range"""
    return np.clip(band_data / quantification_value, 0, 1)


def create_rgb_composite(blue: np.ndarray, green: np.ndarray, red: np.ndarray) -> np.ndarray:
    """Create RGB composite image"""
    rgb = np.stack([red, green, blue], axis=-1)
    rgb = (rgb * 255).astype(np.uint8)
    return rgb


def array_to_base64_png(array: np.ndarray) -> str:
    """Convert numpy array to base64-encoded PNG"""
    # Handle grayscale vs RGB
    if array.ndim == 2:
        img = Image.fromarray(array, mode='L')
    else:
        img = Image.fromarray(array, mode='RGB')
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    b64_string = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{b64_string}"


def apply_cloud_mask_to_rgb(rgb: np.ndarray, cloud_mask: np.ndarray, fill_color: tuple = (50, 50, 50)) -> np.ndarray:
    """Apply cloud mask to RGB composite, replacing clouds with fill color"""
    masked_rgb = rgb.copy()
    cloud_pixels = cloud_mask == 255
    
    for i in range(3):
        masked_rgb[:, :, i][cloud_pixels] = fill_color[i]
    
    return masked_rgb


@app.post("/cloud-mask")
async def mask_clouds(
    safe_zip: UploadFile = File(...),
    threshold: Optional[float] = Form(0.4)
):
    """
    Process Sentinel-2 SAFE format file for cloud masking
    
    Args:
        safe_zip: Sentinel-2 L2A SAFE format .zip file
        threshold: Cloud detection threshold (0-1), default 0.4
    
    Returns:
        JSON with cloud_mask, cloud_prob, clean_rgb (Base64 PNGs), and statistics
    """
    start_time = time.time()
    
    try:
        # Validate filename
        if not safe_zip.filename.endswith('.SAFE.zip'):
            raise HTTPException(
                status_code=400,
                detail="File must be Sentinel-2 SAFE format (.SAFE.zip)"
            )
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            zip_path = temp_path / safe_zip.filename
            
            # Save uploaded file
            with open(zip_path, 'wb') as f:
                content = await safe_zip.read()
                f.write(content)
            
            # Extract SAFE zip
            extract_dir = temp_path / "extracted"
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Find SAFE directory
            safe_dirs = list(extract_dir.glob("*.SAFE"))
            if not safe_dirs:
                raise HTTPException(
                    status_code=400,
                    detail="No .SAFE directory found in zip file"
                )
            
            safe_dir = safe_dirs[0]
            
            # Find IMG_DATA/R10m path
            img_data_path = find_granule_path(safe_dir)
            if not img_data_path:
                raise HTTPException(
                    status_code=400,
                    detail="Could not find GRANULE/*/IMG_DATA/R10m structure"
                )
            
            # Load required bands
            print(f"Loading bands from {img_data_path}")
            b02 = load_band(img_data_path, "B02")  # Blue
            b03 = load_band(img_data_path, "B03")  # Green
            b04 = load_band(img_data_path, "B04")  # Red
            b08 = load_band(img_data_path, "B08")  # NIR
            
            # Normalize reflectance values (S2 L2A uses 10000 as quantification value)
            b02_norm = normalize_reflectance(b02)
            b03_norm = normalize_reflectance(b03)
            b04_norm = normalize_reflectance(b04)
            b08_norm = normalize_reflectance(b08)
            
            # Prepare input for s2cloudless (expects shape: [height, width, bands])
            s2cloudless_input = np.stack([b02_norm, b03_norm, b04_norm, b08_norm], axis=-1)
            
            # Add batch dimension: [1, height, width, bands]
            s2cloudless_input = np.expand_dims(s2cloudless_input, axis=0)
            
            # Run cloud probability model
            print("Running s2cloudless model...")
            cloud_detector.threshold = threshold
            cloud_probs = cloud_detector.get_cloud_probability_maps(s2cloudless_input)[0]
            
            # Generate binary cloud mask
            cloud_mask_binary = cloud_detector.get_cloud_masks(s2cloudless_input)[0]
            cloud_mask_uint8 = (cloud_mask_binary * 255).astype(np.uint8)
            
            # Calculate cloud coverage percentage
            cloud_percent = (np.sum(cloud_mask_binary) / cloud_mask_binary.size) * 100
            
            # Create RGB composite
            rgb_composite = create_rgb_composite(b02_norm, b03_norm, b04_norm)
            
            # Apply cloud mask to create clean RGB
            clean_rgb = apply_cloud_mask_to_rgb(rgb_composite, cloud_mask_uint8)
            
            # Create probability heatmap visualization (0-255 scale)
            cloud_prob_uint8 = (cloud_probs * 255).astype(np.uint8)
            
            # Convert to Base64 PNG
            cloud_mask_b64 = array_to_base64_png(cloud_mask_uint8)
            cloud_prob_b64 = array_to_base64_png(cloud_prob_uint8)
            clean_rgb_b64 = array_to_base64_png(clean_rgb)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            return {
                "cloud_mask": cloud_mask_b64,
                "cloud_prob": cloud_prob_b64,
                "clean_rgb": clean_rgb_b64,
                "cloud_percent": round(cloud_percent, 2),
                "success": True,
                "processingTimeMs": processing_time_ms
            }
    
    except Exception as e:
        print(f"Error processing SAFE file: {str(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Sentinel-2 Cloud Masking Service",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Running the Backend

```bash
# Install dependencies
pip install fastapi uvicorn rasterio numpy Pillow s2cloudless sentinelhub python-multipart

# Run the server
python backend.py

# Or with uvicorn directly
uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
```

### Testing the API

```bash
# Check health
curl http://localhost:8000/health

# Test cloud masking
curl -X POST "http://localhost:8000/cloud-mask" \
  -F "safe_zip=@S2A_MSIL2A_20240714T082601_N0509_R021_T36LYH.SAFE.zip" \
  -F "threshold=0.4"
```

## Frontend Usage

### TypeScript/JavaScript Example

```typescript
import { cloudMaskService } from '@/lib/cloud-mask-service';

// Upload and process SAFE file
async function processCloudMasking(file: File) {
  try {
    const response = await cloudMaskService.maskClouds({
      safeZip: file,
      threshold: 0.4
    });

    // Use the outputs
    console.log('Cloud coverage:', response.cloud_percent, '%');
    
    // Display images
    document.getElementById('clean-rgb').src = response.clean_rgb;
    document.getElementById('cloud-mask').src = response.cloud_mask;
    document.getElementById('cloud-prob').src = response.cloud_prob;
    
  } catch (error) {
    console.error('Cloud masking failed:', error);
  }
}

// Check backend health
async function checkService() {
  const health = await cloudMaskService.checkServiceHealth();
  console.log('Service available:', health.available);
}
```

## Technical Details

### s2cloudless Model

- **Type**: Gradient Boosting Classifier
- **Input Bands**: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR)
- **Resolution**: 10m per pixel
- **Output**: Cloud probability map (0-1)
- **Threshold**: Default 0.4 (adjustable 0-1)

### Processing Pipeline

1. **Unzip SAFE file** → Extract to temporary directory
2. **Locate bands** → Find `GRANULE/*/IMG_DATA/R10m/*.jp2` files
3. **Load rasters** → Read B02, B03, B04, B08 using rasterio
4. **Normalize** → Convert DN values to reflectance (0-1)
5. **Run s2cloudless** → Generate cloud probability map
6. **Threshold** → Create binary mask (0.4 default)
7. **Generate outputs**:
   - Binary mask (255=cloud, 0=clear)
   - Probability heatmap (0-255)
   - Cloud-removed RGB (clouds replaced with gray)
8. **Encode** → Convert to Base64 PNG for transmission

### Performance Considerations

- **File size**: SAFE files typically 50-500MB
- **Processing time**: 15-30 seconds for typical scene
- **Memory**: ~2-4GB RAM required
- **Bands**: Only 10m resolution bands loaded (saves memory)

### Coordinate Reference System

- Sentinel-2 uses UTM projections
- Tile identifier (e.g., T36LYH) indicates MGRS grid zone
- All bands in R10m are co-registered at 10m resolution

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid SAFE format | Incorrect filename | Use proper S2A_MSIL2A_*.SAFE.zip format |
| Band not found | Incomplete SAFE file | Ensure B02, B03, B04, B08 exist in R10m/ |
| Connection refused | Backend not running | Start backend server on port 8000 |
| Timeout | Large file processing | Increase timeout in frontend config |

### Frontend Error Messages

```typescript
try {
  const response = await cloudMaskService.maskClouds({...});
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout
  } else if (error.message.includes('Invalid SAFE format')) {
    // Handle format error
  } else if (error.message.includes('Cannot connect')) {
    // Handle connection error
  }
}
```

## Configuration

### Frontend Configuration

```typescript
// Update backend URL
cloudMaskService.updateConfig({
  backendUrl: 'http://your-server:8000',
  timeout: 60000  // 60 seconds
});
```

### Backend Configuration

```python
# Adjust s2cloudless parameters
cloud_detector = S2PixelCloudDetector(
    threshold=0.4,        # Cloud probability threshold
    average_over=4,       # Averaging window size
    dilation_size=2,      # Mask dilation kernel size
    all_bands=False       # Use only RGB+NIR bands
)
```

## Data Sources

### Downloading Sentinel-2 Data

1. **Copernicus Open Access Hub**: https://scihub.copernicus.eu/
2. **Google Earth Engine**: Sentinel-2 L2A collection
3. **AWS S3**: `s3://sentinel-s2-l2a/`
4. **Microsoft Planetary Computer**: Sentinel-2 Level-2A

### Example Download (sentinelhub)

```python
from sentinelhub import SHConfig, DataCollection, SentinelHubRequest, BBox, CRS, MimeType

config = SHConfig()
config.sh_client_id = 'YOUR_CLIENT_ID'
config.sh_client_secret = 'YOUR_CLIENT_SECRET'

bbox = BBox(bbox=[46.16, -16.15, 46.51, -15.58], crs=CRS.WGS84)

request = SentinelHubRequest(
    data_collection=DataCollection.SENTINEL2_L2A,
    bbox=bbox,
    time=('2024-01-01', '2024-01-31'),
    config=config
)
```

## License

This feature uses:
- **s2cloudless**: BSD-3-Clause License
- **rasterio**: BSD License
- **Sentinel-2 Data**: Free and open (Copernicus)

## Support

For issues or questions:
- Frontend: Check browser console for errors
- Backend: Check server logs
- Model: See [s2cloudless documentation](https://github.com/sentinel-hub/sentinel2-cloud-detector)

---

**Last Updated**: December 8, 2025  
**Version**: 2.0.0  
**API Version**: v1

# Cloud Masking Feature

## Overview
The Cloud Masking feature provides automated cloud detection and removal from satellite imagery through integration with a backend AI service. It enables users to process cloudy satellite images and obtain clean, cloud-free versions for better Earth observation analysis.

## Features

### 1. **Backend API Integration**
- Connects to external cloud masking service via REST API
- Configurable backend URL
- Health check functionality
- Timeout handling and error recovery
- Request/response validation

### 2. **Image Processing**
- Upload satellite/aerial images (PNG, JPEG, TIFF)
- Automatic cloud detection using backend ML models
- Cloud coverage percentage calculation
- High-quality masked image generation
- Processing time tracking

### 3. **Interactive Comparison**
- Side-by-side original vs masked view
- Slider-based comparison tool
- Toggle between original and masked images
- Full-screen image viewer

### 4. **Results & Analytics**
- Cloud coverage percentage with severity levels
- Processing statistics (time, pixels, method)
- Image dimensions and metadata
- Coverage classification (Clear, Partly Cloudy, Mostly Cloudy, Overcast)

### 5. **Export Functionality**
- Download cloud-masked images
- Preserve original image quality
- Base64 encoded output

## Backend API Integration

### API Endpoint

**POST** `/cloud-mask`

### Request Format

```json
{
  "image": "base64_encoded_image_data",
  "format": "base64",
  "threshold": 0.5,
  "metadata": {
    "filename": "satellite_image.jpg",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | string | Yes | Base64 encoded image data (without data URI prefix) |
| `format` | string | No | Response format preference: "base64" (default) or "url" |
| `threshold` | number | No | Cloud detection threshold (0-1), default: 0.5 |
| `metadata` | object | No | Optional metadata object |
| `metadata.filename` | string | No | Original filename |
| `metadata.timestamp` | string | No | ISO 8601 timestamp |

### Response Format

```json
{
  "maskedImage": "base64_encoded_masked_image_data",
  "cloudCoverage": 25.5,
  "processingTime": 1234,
  "maskData": {
    "cloudPixels": 150000,
    "totalPixels": 589824,
    "cloudPercentage": 25.5
  },
  "metadata": {
    "originalSize": {
      "width": 768,
      "height": 768
    },
    "maskedSize": {
      "width": 768,
      "height": 768
    },
    "detectionMethod": "ML Model v2"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `maskedImage` | string | Base64 encoded cloud-masked image |
| `cloudCoverage` | number | Percentage of cloud coverage (0-100) |
| `processingTime` | number | Processing time in milliseconds |
| `maskData` | object | Detailed mask statistics |
| `maskData.cloudPixels` | number | Number of cloud pixels detected |
| `maskData.totalPixels` | number | Total pixels in image |
| `maskData.cloudPercentage` | number | Cloud percentage (same as cloudCoverage) |
| `metadata` | object | Processing metadata |
| `metadata.originalSize` | object | Original image dimensions |
| `metadata.maskedSize` | object | Masked image dimensions |
| `metadata.detectionMethod` | string | Detection algorithm used |

### Health Check Endpoint

**GET** `/health`

#### Response Format

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "message": "Cloud masking service is operational"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid image format",
  "message": "Image data must be valid base64 encoded"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Processing failed",
  "message": "Cloud detection algorithm encountered an error"
}
```

#### 503 Service Unavailable
```json
{
  "error": "Service unavailable",
  "message": "Backend service is temporarily down"
}
```

## Technical Implementation

### Architecture

```
Frontend (Next.js)
    ↓
CloudMaskService (lib/cloud-mask-service.ts)
    ↓
Backend API (/cloud-mask endpoint)
    ↓
ML Cloud Detection Model
    ↓
Masked Image Response
```

### File Structure

```
src/
├── lib/
│   └── cloud-mask-service.ts          # API service layer
├── app/dashboard/features/cloud-masking/
│   └── page.tsx                       # Upload interface
└── features/cloud-masking/
    └── components/
        └── CloudMasking.tsx           # Main component
```

### Service Layer (`cloud-mask-service.ts`)

The `CloudMaskService` provides:
- Centralized API communication
- Request/response handling
- Error management
- Configuration management
- Health checking

#### Key Methods

```typescript
// Single image processing
await cloudMaskService.maskClouds({
  image: base64Image,
  threshold: 0.5,
  metadata: { filename: "image.jpg" }
});

// Batch processing
await cloudMaskService.maskCloudsBatch([
  { image: base64Image1 },
  { image: base64Image2 }
]);

// Health check
await cloudMaskService.checkServiceHealth();

// Update configuration
cloudMaskService.updateConfig({
  backendUrl: "http://your-backend:8000"
});
```

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_CLOUD_MASK_API_URL=http://localhost:8000
```

### Runtime Configuration

Users can configure the backend URL through the UI:
1. Navigate to Cloud Masking feature
2. Click "Configure" button
3. Enter backend URL
4. Test connection
5. Save settings

Settings are persisted in localStorage.

## Usage Guide

### Step 1: Start Backend Service

Ensure your cloud masking backend is running:

```bash
# Example backend startup
cd backend
python main.py  # or your specific command
```

The backend should be accessible at the configured URL (default: `http://localhost:8000`)

### Step 2: Configure Frontend

1. Open the Cloud Masking feature
2. Click "Configure" to set backend URL
3. Click "Test Connection" to verify
4. Save settings

### Step 3: Process Images

1. Click "Choose Image" to upload a satellite image
2. Wait for processing to complete
3. View results with cloud coverage statistics
4. Use slider to compare original vs masked
5. Download masked image if needed

### Step 4: Analyze Results

- **Cloud Coverage**: Percentage of image covered by clouds
- **Processing Time**: How long the backend took
- **Coverage Level**: Clear, Partly Cloudy, Mostly Cloudy, or Overcast
- **Pixel Statistics**: Detailed cloud vs total pixel counts

## Backend Requirements

### Minimal Backend Implementation

Your backend should implement these endpoints:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
from PIL import Image
import io

app = FastAPI()

class CloudMaskRequest(BaseModel):
    image: str
    format: str = "base64"
    threshold: float = 0.5
    metadata: dict = {}

@app.post("/cloud-mask")
async def mask_clouds(request: CloudMaskRequest):
    try:
        # Decode image
        image_data = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(image_data))
        
        # TODO: Implement your cloud detection algorithm here
        # This is where you'd use your ML model
        masked_image, cloud_coverage = detect_and_mask_clouds(
            image, 
            threshold=request.threshold
        )
        
        # Encode result
        buffer = io.BytesIO()
        masked_image.save(buffer, format="PNG")
        masked_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "maskedImage": masked_base64,
            "cloudCoverage": cloud_coverage,
            "processingTime": 1234,
            "maskData": {
                "cloudPixels": int(cloud_coverage * image.width * image.height / 100),
                "totalPixels": image.width * image.height,
                "cloudPercentage": cloud_coverage
            },
            "metadata": {
                "originalSize": {"width": image.width, "height": image.height},
                "maskedSize": {"width": image.width, "height": image.height},
                "detectionMethod": "Your Model Name"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "message": "Cloud masking service is operational"
    }

def detect_and_mask_clouds(image, threshold):
    # TODO: Implement your cloud detection logic
    # Return: (masked_image, cloud_coverage_percentage)
    pass
```

### Deployment Options

1. **Local Development**: Run on localhost:8000
2. **Docker**: Containerize backend service
3. **Cloud Deployment**: Deploy to AWS, GCP, Azure
4. **Kubernetes**: Orchestrate with K8s

## Error Handling

### Frontend Error Handling

The service provides comprehensive error handling:

```typescript
try {
  const result = await cloudMaskService.maskClouds(request);
  // Success
} catch (error) {
  // Error cases handled:
  // - Connection timeout
  // - Service unavailable
  // - Invalid response
  // - Network errors
}
```

### User Feedback

- Loading states during processing
- Success toasts with cloud coverage
- Error messages with troubleshooting info
- Connection status indicators

## Performance Considerations

### Image Size Limits

- Max upload size: 10MB
- Recommended: < 5MB for faster processing
- Large images may timeout (30s default)

### Optimization Tips

1. **Compress images** before upload
2. **Use appropriate threshold** (0.3-0.7 range)
3. **Monitor backend resources**
4. **Implement caching** on backend
5. **Use CDN** for static assets

## Troubleshooting

### "Cannot connect to service"

**Solution:**
1. Check if backend is running
2. Verify URL in configuration
3. Check firewall/network settings
4. Test with curl: `curl http://localhost:8000/health`

### "Request timeout"

**Solution:**
1. Reduce image size
2. Increase timeout in config
3. Optimize backend processing
4. Check backend logs

### "Invalid response"

**Solution:**
1. Verify backend response format
2. Check base64 encoding
3. Validate JSON structure
4. Review backend logs

### High cloud coverage warnings

If cloud coverage > 70%, the UI shows a warning suggesting:
- Use images from different dates
- Consider temporal fusion
- Check image quality

## Advanced Features

### Batch Processing

Process multiple images:

```typescript
const results = await cloudMaskService.maskCloudsBatch([
  { image: base64Image1, metadata: { filename: "img1.jpg" } },
  { image: base64Image2, metadata: { filename: "img2.jpg" } }
]);
```

### Custom Thresholds

Adjust cloud detection sensitivity:

```typescript
await cloudMaskService.maskClouds({
  image: base64Image,
  threshold: 0.3  // More sensitive (0.0-1.0)
});
```

## Integration with Other Features

### Combine with Temporal Fusion
1. Cloud mask images from different dates
2. Feed to Temporal Fusion for trend analysis
3. Cleaner time-series data

### Use with ROI Analysis
1. Mask clouds first
2. Analyze specific regions
3. More accurate ROI metrics

### Enhance Analysis Dashboard
1. Pre-process images with cloud masking
2. Improve land cover classification
3. Better NDVI calculations

## API Payload Examples

### Basic Request
```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "format": "base64"
}
```

### Advanced Request
```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "format": "base64",
  "threshold": 0.6,
  "metadata": {
    "filename": "landsat8_scene.tif",
    "timestamp": "2025-12-08T10:30:00Z",
    "satellite": "Landsat 8",
    "sensor": "OLI-TIRS",
    "location": "28.6139°N, 77.2090°E"
  }
}
```

## Testing

### Manual Testing
1. Use sample satellite images
2. Test various cloud coverage levels
3. Verify slider functionality
4. Check download feature
5. Test error scenarios

### API Testing
```bash
# Health check
curl http://localhost:8000/health

# Cloud masking
curl -X POST http://localhost:8000/cloud-mask \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

## Future Enhancements

Potential improvements:
1. Real-time processing progress
2. Multiple algorithm selection
3. Custom mask visualization
4. Batch processing UI
5. Cloud shadow detection
6. Terrain masking
7. Snow/ice detection
8. Export to GeoTIFF

## Dependencies

- `cloudMaskService`: API integration layer
- UI components: shadcn/ui (Card, Button, etc.)
- Icons: lucide-react
- Notifications: sonner

## Code Quality

✅ TypeScript typed interfaces
✅ Error handling and validation
✅ Loading states and user feedback
✅ Responsive design
✅ Clean separation of concerns
✅ Reusable service layer
✅ Comprehensive API documentation

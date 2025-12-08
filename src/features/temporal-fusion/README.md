# Temporal Fusion Feature

## Overview
The Temporal Fusion feature provides advanced multi-temporal data fusion and time-series analysis for Earth Observation data. It enables users to analyze changes over time, detect trends, identify seasonal patterns, and predict future changes.

## Features

### 1. **Multi-Image Upload & Timeline Management**
- Upload 3 or more satellite/aerial images from different time periods
- Automatic date extraction from filenames
- Manual date entry for images without embedded dates
- Visual timeline representation of uploaded images
- Sortable chronological display

### 2. **AI-Powered Temporal Analysis**
- Uses `responseService` for dynamic model selection (Gemini/Local OSS)
- Comprehensive temporal pattern detection
- Multi-temporal data fusion across image sequences
- Quantitative change detection

### 3. **Trend Detection**
- Identifies increasing, decreasing, stable, and fluctuating trends
- Metrics analyzed:
  - Vegetation cover changes
  - Urban expansion
  - Water body variations
  - Land use transformations
  - NDVI (vegetation health) trends
- Change rate calculations with severity ratings

### 4. **Time-Series Visualizations**
- **Land Cover Time Series**: Line chart showing vegetation, water, and urban changes over time
- **NDVI Trend Chart**: Area chart displaying vegetation health evolution
- **Trend Magnitude Bar Chart**: Visual comparison of change rates across metrics
- Interactive charts with tooltips and legends

### 5. **Seasonal Pattern Detection**
- Identifies cyclical patterns in the data
- Monsoon/wet season detection
- Dry season characteristics
- Confidence scores for each pattern

### 6. **Anomaly Detection**
- Identifies unusual events and sudden changes
- Categories: Drought, Flood, Fire, Rapid Urbanization, etc.
- Severity levels: Critical, Warning, Info
- Impact scoring (0-100)
- Date-specific anomaly tracking

### 7. **Predictive Insights**
- Future trend predictions
- Expected changes for next period
- Confidence-rated forecasts
- AI-generated recommendations

### 8. **Interactive UI Components**
- Timeline navigation with clickable points
- Image viewer with date labels
- Tabbed interface: Trends, Charts, Anomalies
- Responsive design for all screen sizes
- Smooth animations and transitions

## Technical Implementation

### Architecture
```
src/
├── app/dashboard/features/temporal-fusion/
│   └── page.tsx                    # Upload interface & entry point
└── features/temporal-fusion/
    └── components/
        └── TemporalFusion.tsx      # Main analysis component
```

### Key Components

#### **TemporalFusion.tsx**
Main analysis component that handles:
- AI-powered temporal analysis
- Data visualization (Recharts)
- Timeline management
- Results display in tabbed interface

#### **page.tsx**
Upload interface that provides:
- Image upload with validation
- Date extraction/manual entry
- Timeline preview
- Launch analysis

### Data Structures

```typescript
interface TemporalImage {
  url: string;        // Data URL of the image
  label: string;      // Filename
  date: string;       // YYYY-MM-DD format
  timestamp: number;  // Unix timestamp for sorting
}

interface TemporalAnalysis {
  summary: string;
  timeSeriesData: TimeSeriesMetric[];
  trends: TrendAnalysis[];
  seasonalPatterns: SeasonalPattern[];
  anomalies: AnomalyDetection[];
  predictions: PredictionData;
  insights: string[];
  recommendations: string[];
}
```

### AI Integration

The feature uses `responseService` for model-agnostic AI analysis:

```typescript
const analysisResult = await responseService.analyzeImage({
  imageUrls: sortedImages.map(img => img.url),
  prompt: /* detailed temporal analysis prompt */,
  metadata: {
    image_count: sortedImages.length,
    date_range: `${startDate} to ${endDate}`,
  }
});
```

### Visualization Libraries
- **Recharts**: For time-series line charts, area charts, and bar charts
- Responsive design with `ResponsiveContainer`
- Custom tooltips and legends
- Theme-aware colors

## Usage Guide

### Step 1: Upload Images
1. Navigate to Dashboard → Temporal Fusion
2. Click "Choose Image" to upload satellite/aerial images
3. For each image:
   - If filename contains a date (e.g., `sentinel_20231015.jpg`), date is auto-extracted
   - Otherwise, enter the acquisition date manually
4. Upload at least 3 images from different time periods

### Step 2: Review Timeline
- Uploaded images appear in chronological order
- Each image shows its date and position in the timeline
- Remove images if needed using the X button

### Step 3: Start Analysis
- Click "Start Temporal Analysis" when 3+ images are uploaded
- AI processes all images and generates comprehensive analysis
- Wait for analysis to complete (typically 10-30 seconds)

### Step 4: Explore Results
Navigate through three tabs:

**Trends Tab:**
- View overall summary
- Review detected trends with change rates
- Explore seasonal patterns
- Check future predictions

**Charts Tab:**
- Land cover time series (vegetation, water, urban)
- NDVI vegetation health trend
- Trend magnitude comparison

**Anomalies Tab:**
- Review detected anomalies with severity levels
- View impact scores
- Read AI-generated recommendations

## Best Practices

### Image Selection
- Use images from the same geographic area
- Ensure consistent sensor/resolution when possible
- Space images evenly over time for better trend detection
- Include images from different seasons to detect patterns

### Date Formatting
- Use YYYY-MM-DD format for manual date entry
- Include dates in filenames: `location_YYYYMMDD.jpg`
- Ensure dates are accurate for meaningful analysis

### Analysis Quality
- More images = better trend detection (5-10 images recommended)
- Longer time spans reveal more significant patterns
- Include images before/after known events for anomaly detection

## Integration with Existing Services

### Response Service
Uses the centralized `responseService` from `/lib/response-service.ts`:
- Supports both Gemini and Local OSS models
- Respects user's model preference from Settings
- Provides consistent error handling
- Enables model switching without code changes

### Metadata Utils
Leverages `/lib/metadata-utils.ts` for:
- Automatic date extraction from filenames
- Satellite sensor identification
- Filename parsing utilities

## Error Handling

### Graceful Fallbacks
- If AI parsing fails, generates mock data for demonstration
- Shows user-friendly error messages via toast notifications
- Validates image formats and date inputs
- Requires minimum 3 images before analysis

### User Feedback
- Loading states during analysis
- Progress indicators
- Success/error toast notifications
- Clear validation messages

## Performance Considerations

- Images are client-side processed (Data URLs)
- AI analysis runs asynchronously
- Charts use `ResponsiveContainer` for optimal rendering
- Smooth animations with CSS transitions
- Lazy loading of chart components

## Future Enhancements

Potential improvements:
1. Export analysis reports as PDF
2. Download charts as images
3. Compare multiple temporal sequences
4. Advanced anomaly filtering
5. Custom date range selection
6. Bulk image upload with metadata CSV
7. Integration with satellite data APIs
8. Real-time monitoring mode

## Dependencies

Core libraries used:
- `recharts`: Time-series visualization
- `lucide-react`: Icons
- `sonner`: Toast notifications
- `@radix-ui/*`: UI components (via shadcn/ui)
- `responseService`: AI analysis service

## Testing

To test the feature:
1. Ensure API key is set in Settings (for Gemini) or Local OSS is running
2. Upload 3+ sample satellite images with different dates
3. Verify timeline displays correctly
4. Start analysis and wait for completion
5. Navigate through all tabs to verify data display
6. Test with different image counts and date ranges

## Troubleshooting

**Issue: "Please set your API key in Settings"**
- Solution: Navigate to Settings and configure Gemini API key or Local OSS URL

**Issue: Analysis fails or returns errors**
- Check API key validity
- Verify images are valid formats (JPG, PNG)
- Ensure at least 3 images are uploaded
- Check browser console for detailed errors

**Issue: Charts not displaying**
- Verify time series data contains valid values
- Check browser console for Recharts errors
- Ensure dates are in correct format

**Issue: Dates not auto-detected**
- Filename must contain date in YYYYMMDD format
- Use manual date entry as fallback
- Dates must be valid (not future dates)

## Code Quality

The implementation follows project patterns:
- ✅ Uses existing utility services (responseService, metadata-utils)
- ✅ Consistent with other feature implementations
- ✅ TypeScript typed interfaces
- ✅ Responsive design with Tailwind CSS
- ✅ Accessible UI components from shadcn/ui
- ✅ Error handling and validation
- ✅ Loading states and user feedback
- ✅ Clean code structure and organization

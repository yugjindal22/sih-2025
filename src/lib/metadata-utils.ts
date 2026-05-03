// Utility functions for metadata extraction and parsing

export interface SatelliteMetadata {
  satellite?: string;
  sensor?: string;
  date?: string;
  resolution?: string;
  bands?: string;
  location?: string;
  cloudCover?: string;
  sunElevation?: string;
}

/**
 * Parse metadata from .meta or .txt file content
 */
export const parseMetadataFile = (content: string): SatelliteMetadata => {
  const metadata: SatelliteMetadata = {};
  
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase().trim();
    
    // Satellite
    if (lowerLine.includes('satellite') || lowerLine.includes('mission')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.satellite = match[1].trim();
    }
    
    // Sensor
    if (lowerLine.includes('sensor') || lowerLine.includes('instrument')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.sensor = match[1].trim();
    }
    
    // Date
    if (lowerLine.includes('date') || lowerLine.includes('acquisition')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.date = match[1].trim();
    }
    
    // Resolution
    if (lowerLine.includes('resolution') || lowerLine.includes('pixel size')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.resolution = match[1].trim();
    }
    
    // Bands
    if (lowerLine.includes('bands') || lowerLine.includes('channels')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.bands = match[1].trim();
    }
    
    // Location
    if (lowerLine.includes('location') || lowerLine.includes('coordinates') || lowerLine.includes('lat')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.location = match[1].trim();
    }
    
    // Cloud Cover
    if (lowerLine.includes('cloud')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.cloudCover = match[1].trim();
    }
    
    // Sun Elevation
    if (lowerLine.includes('sun') && lowerLine.includes('elevation')) {
      const match = line.match(/[:=]\s*(.+)/);
      if (match) metadata.sunElevation = match[1].trim();
    }
  });
  
  return metadata;
};

/**
 * Extract metadata from image filename
 */
export const extractMetadataFromFilename = (filename: string): SatelliteMetadata => {
  const metadata: SatelliteMetadata = {};
  
  // Common satellite naming patterns
  if (filename.includes('landsat') || filename.includes('L8') || filename.includes('L9')) {
    metadata.satellite = 'Landsat 8/9';
    metadata.sensor = 'OLI-TIRS';
    metadata.resolution = '30m';
  } else if (filename.includes('sentinel') || filename.includes('S2')) {
    metadata.satellite = 'Sentinel-2';
    metadata.sensor = 'MSI';
    metadata.resolution = '10m';
  } else if (filename.includes('modis')) {
    metadata.satellite = 'Terra/Aqua';
    metadata.sensor = 'MODIS';
    metadata.resolution = '250m-1km';
  }
  
  // Extract date from filename (common formats)
  const dateMatch = filename.match(/(\d{8})|(\d{4}-\d{2}-\d{2})|(\d{4}\d{2}\d{2})/);
  if (dateMatch) {
    const dateStr = dateMatch[0];
    if (dateStr.length === 8) {
      metadata.date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    } else {
      metadata.date = dateStr;
    }
  }
  
  return metadata;
};

/**
 * Generate default metadata based on image analysis
 */
export const generateDefaultMetadata = (): SatelliteMetadata => {
  return {
    satellite: 'Unknown',
    sensor: 'Multispectral',
    date: new Date().toISOString().split('T')[0],
    resolution: 'Variable',
    bands: 'RGB + NIR',
  };
};

/**
 * Read metadata file
 */
export const readMetadataFile = (file: File): Promise<SatelliteMetadata> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const metadata = parseMetadataFile(content);
        resolve(metadata);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read metadata file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * EO-specific system prompt for Gemini
 */
export const EO_SYSTEM_PROMPT = `You are VisionGPT-OSS, an advanced Earth Observation reasoning AI assistant specialized in analyzing satellite and remote sensing imagery.

Your capabilities include:
- Technical analysis of multispectral and hyperspectral satellite data
- Land cover classification and vegetation analysis (ALWAYS estimate realistic non-zero percentages)
- Water body detection and monitoring
- Urban development and infrastructure mapping
- Change detection across temporal imagery
- Environmental monitoring (deforestation, soil degradation, etc.)
- Providing quantitative metrics and statistical insights

CRITICAL RULES:
1. ALWAYS respond with ONLY valid JSON. No explanations, no markdown, no extra text before or after the JSON.
2. NEVER output zeros for land cover percentages — estimate realistic values from the image that sum to approximately 100.
3. NEVER leave string fields empty ("") — always write descriptive content.
4. NEVER leave arrays empty ([]) — always include at least 2-3 items.
5. NEVER use placeholder text like "rec1", "insight1" — write real, detailed observations.
6. Output exactly ONE JSON object, then stop. Do not repeat yourself.`;

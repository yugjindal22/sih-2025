"""
Unified API Server - Integrates Location, Search, Download, and Processing
Combines Flask (location/search) and FastAPI (processing) into one comprehensive API
Now with ROI Analysis, Interactive Chat, and Multi-Model Support (Gemini/OSS)
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
from datetime import datetime
from urllib.parse import quote
import os
import sys
import logging
import zipfile
import shutil
from pathlib import Path
import glob
import numpy as np
from dotenv import load_dotenv
import json
import base64
import io

# Import Bhoonidhi search functionality
from search import Bhoonidhi

# Import satellite processing
from process_sentinel import process_sentinel_image

# Import AI model components - NOT USED (using vision backend instead)
# Kept for backward compatibility with old code
try:
    from transformers import BlipProcessor, BlipForQuestionAnswering
    from PIL import Image
    import rasterio
    from rasterio.windows import from_bounds
    from pyproj import Transformer
    AI_AVAILABLE = True
except ImportError as e:
    logging.warning(f"AI components not available (using vision backend instead): {e}")
    AI_AVAILABLE = False

load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes with specific configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
bhoonidhi_instance = None
CURRENT_SAFE_PATH = None
ai_processor = None
ai_model = None
download_progress = {}  # Track download progress: {product_id: {percent, downloaded_bytes, status, ...}}

def update_download_progress(product_id, percent, downloaded_bytes, status, total_bytes=0, speed=0):
    """Update global download progress"""
    global download_progress
    download_progress[product_id] = {
        'percent': percent,
        'downloaded_bytes': downloaded_bytes,
        'total_bytes': total_bytes,
        'status': status,
        'speed_bytes_per_sec': speed,
        'timestamp': datetime.now().isoformat()
    }
    logger.info(f"Progress update for {product_id}: {percent}% - {status}")

# Vision backend configuration - Multi-model support (Gemini or ngrok OSS)
VISION_BACKEND_URL = os.getenv("VISION_BACKEND_URL", "https://sunni-uncarbonized-greg.ngrok-free.dev")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Optional - for Gemini model
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "oss")  # "gemini" or "oss" (ngrok)

def get_bhoonidhi_instance():
    """Get or create Bhoonidhi instance"""
    global bhoonidhi_instance
    if bhoonidhi_instance is None:
        download_folder = os.path.join(os.getcwd(), "downloads")
        bhoonidhi_instance = Bhoonidhi(download_folder=download_folder, progress_callback=update_download_progress)
    return bhoonidhi_instance

def load_ai_model():
    """
    DEPRECATED: This function loaded local BLIP model.
    We now use the vision backend (ngrok) instead.
    Keeping this function for backward compatibility but it does nothing.
    """
    logger.info("AI model loading skipped - using vision backend via ngrok")
    return False  # Always return False to prevent model loading

def get_coordinates(location_name):
    """
    Get coordinates for a location using Nominatim (OpenStreetMap) geocoding API
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {'q': location_name, 'format': 'json', 'limit': 1}
        headers = {'User-Agent': 'Bhoonidhi-Unified-API/1.0'}
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            return {
                'lat': round(lat, 3),
                'lon': round(lon, 3),
                'display_name': data[0].get('display_name', location_name)
            }
        return None
    except Exception as e:
        logger.error(f"Error getting coordinates: {str(e)}")
        return None

def find_safe_folder(extract_path):
    """Find .SAFE folder in extracted zip"""
    for root, dirs, files in os.walk(extract_path):
        for d in dirs:
            if d.endswith(".SAFE"):
                return os.path.join(root, d)
    return None

def get_band_path(safe_path, band_name):
    """Robustly finds bands in L1C or L2A structure"""
    target_10m = f"_{band_name}_10m.jp2"
    target_std = f"_{band_name}.jp2"
    
    for root, _, files in os.walk(safe_path):
        for f in files:
            if f.endswith(target_10m) or f.endswith(target_std):
                return os.path.join(root, f)
    return None

def get_latlon_bounds(safe_path):
    """
    Reads metadata to find where this satellite image is on Earth.
    Returns: [lon_min, lat_min, lon_max, lat_max] for Leaflet [SW, NE] format
    """
    if not AI_AVAILABLE:
        logger.warning("AI libraries not available for bounds extraction")
        return [0.0, 0.0, 0.0, 0.0]
    
    try:
        ref_band = get_band_path(safe_path, "B04")
        if not ref_band:
            logger.warning("Reference band not found for bounds extraction")
            return [0.0, 0.0, 0.0, 0.0]
        
        with rasterio.open(ref_band) as src:
            transformer = Transformer.from_crs(src.crs, "EPSG:4326", always_xy=True)
            lon_min, lat_min = transformer.transform(src.bounds.left, src.bounds.bottom)
            lon_max, lat_max = transformer.transform(src.bounds.right, src.bounds.top)
            bounds = [float(lon_min), float(lat_min), float(lon_max), float(lat_max)]
            logger.info(f"Extracted bounds: {bounds}")
            return bounds
    except Exception as e:
        logger.error(f"Error reading bounds: {e}", exc_info=True)
        return [0.0, 0.0, 0.0, 0.0]

def extract_and_process_zip(zip_path, extract_to="temp_data"):
    """Extract zip and process Sentinel data"""
    global CURRENT_SAFE_PATH
    
    if os.path.exists(extract_to):
        shutil.rmtree(extract_to)
    os.makedirs(extract_to)
    
    logger.info(f"Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    
    CURRENT_SAFE_PATH = find_safe_folder(extract_to)
    
    if CURRENT_SAFE_PATH:
        logger.info(f"Found SAFE data: {CURRENT_SAFE_PATH}")
        # Process the satellite image
        output_path = process_sentinel_image(CURRENT_SAFE_PATH)
        return CURRENT_SAFE_PATH, output_path
    
    return None, None

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Unified Bhoonidhi API',
        'endpoints': {
            'location': '/api/geocode',
            'search_download': '/api/search-and-download',
            'download_progress': '/api/download-progress',
            'process': '/api/process-zip',
            'complete_workflow': '/api/complete-workflow'
        }
    }), 200

@app.route('/api/geocode', methods=['GET', 'POST'])
def geocode():
    """
    Convert location name to coordinates
    GET: /api/geocode?location=New Delhi
    POST: {"location": "New Delhi"}
    """
    try:
        if request.method == 'GET':
            location = request.args.get('location')
        else:
            data = request.json
            location = data.get('location') if data else None
        
        if not location:
            return jsonify({'error': 'Location parameter is required'}), 400
        
        coords = get_coordinates(location)
        if not coords:
            return jsonify({'error': f'Could not find coordinates for location: {location}'}), 404
        
        return jsonify(coords), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/download-progress', methods=['GET'])
def get_download_progress():
    """Get current download progress for all active downloads"""
    global download_progress
    
    product_id = request.args.get('product_id')
    
    if product_id:
        # Return progress for specific product
        if product_id in download_progress:
            return jsonify({
                'product_id': product_id,
                'progress': download_progress[product_id]
            }), 200
        else:
            return jsonify({
                'product_id': product_id,
                'progress': None,
                'message': 'No progress data available for this product'
            }), 404
    else:
        # Return all progress data
        return jsonify({
            'downloads': download_progress
        }), 200

@app.route('/api/search-and-download', methods=['POST'])
def search_and_download():
    """
    Search for satellite data and download
    
    Request: {
        "location": "New Delhi",
        "sdate": "2024-11-01",
        "edate": "2024-11-30",
        "satellites": ["Sentinel-2A_MSI_Level-2A"],
        "max_downloads": 1
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        location = data.get('location')
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        # Step 1: Get coordinates
        logger.info(f"Getting coordinates for location: {location}")
        coords = get_coordinates(location)
        if not coords:
            return jsonify({'error': f'Could not find coordinates for location: {location}'}), 404
        
        logger.info(f"Found coordinates: lat={coords['lat']}, lon={coords['lon']}")
        
        # Step 2: Parse parameters
        sdate_str = data.get('sdate')
        edate_str = data.get('edate')
        
        if not sdate_str or not edate_str:
            return jsonify({'error': 'Both sdate and edate are required in YYYY-MM-DD format'}), 400
        
        satellites = data.get('satellites', ["Sentinel-2A_MSI_Level-2A", "Sentinel-2B_MSI_Level-2A"])
        max_downloads = data.get('max_downloads', 1)
        
        # Step 3: Initialize Bhoonidhi
        logger.info("Initializing Bhoonidhi...")
        bhoonidhi = get_bhoonidhi_instance()
        
        # Step 4: Search for products
        lat_lon = [coords['lat'], coords['lon']]
        logger.info(f"Searching satellite data at {lat_lon} from {sdate_str} to {edate_str}")
        
        results = bhoonidhi.search_bhoo(
            lat_lon=lat_lon,
            start_date=sdate_str,
            end_date=edate_str,
            sats=satellites
        )
        
        logger.info(f"Found {len(results)} products")
        
        if not results:
            return jsonify({
                'message': 'No satellite products found',
                'location': location,
                'coordinates': coords,
                'products_found': 0
            }), 200
        
        # Step 5: Filter and download
        direct_download_products = [p for p in results if bhoonidhi.is_direct_download(p)]
        logger.info(f"Found {len(direct_download_products)} direct download products")
        
        if not direct_download_products:
            return jsonify({
                'message': 'Found products but none available for direct download',
                'location': location,
                'coordinates': coords,
                'products_found': len(results),
                'direct_download_available': 0
            }), 200
        
        # Add to cart and download
        products_to_process = direct_download_products[:max_downloads]
        added_products = []
        
        for product in products_to_process:
            logger.info(f"Adding product to cart: {product.get('ID')}")
            add_result = bhoonidhi.add_order(product)
            if add_result and 'error' not in add_result:
                added_products.append(product)
        
        if not added_products:
            return jsonify({
                'message': 'Failed to add products to cart',
                'location': location,
                'coordinates': coords
            }), 500
        
        # Download products
        downloaded_files = []
        failed_downloads = []
        
        # Initialize progress tracking for all products
        global download_progress
        for product in added_products:
            product_id = product.get('ID')
            download_progress[product_id] = {
                'percent': 0,
                'downloaded_bytes': 0,
                'total_bytes': 0,
                'status': 'pending',
                'speed_bytes_per_sec': 0,
                'timestamp': datetime.now().isoformat()
            }
        
        for product in added_products:
            product_id = product.get('ID')
            file_path = os.path.join(bhoonidhi.download_folder, f"{product_id}.zip")
            
            if os.path.exists(file_path):
                logger.info(f"Product already downloaded: {product_id}")
                downloaded_files.append({
                    'product_id': product_id,
                    'status': 'already_exists',
                    'file_path': file_path
                })
            else:
                try:
                    logger.info(f"Downloading product: {product_id}")
                    bhoonidhi.download_cart_product(product, datetime.now())
                    
                    if os.path.exists(file_path):
                        downloaded_files.append({
                            'product_id': product_id,
                            'status': 'downloaded',
                            'file_path': file_path
                        })
                    else:
                        failed_downloads.append({
                            'product_id': product_id,
                            'error': 'File not found after download'
                        })
                except Exception as e:
                    logger.error(f"Error downloading {product_id}: {e}")
                    failed_downloads.append({
                        'product_id': product_id,
                        'error': str(e)
                    })
        
        return jsonify({
            'message': 'Search and download completed',
            'location': location,
            'location_name': coords['display_name'],
            'coordinates': {'lat': coords['lat'], 'lon': coords['lon']},
            'search_period': {'start': sdate_str, 'end': edate_str},
            'satellites': satellites,
            'products_found': len(results),
            'direct_download_available': len(direct_download_products),
            'downloaded': downloaded_files,
            'failed': failed_downloads,
            'summary': {
                'total_downloaded': len([d for d in downloaded_files if d['status'] == 'downloaded']),
                'already_existed': len([d for d in downloaded_files if d['status'] == 'already_exists']),
                'failed': len(failed_downloads)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in search_and_download: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/process-zip', methods=['POST'])
def process_zip():
    """
    Process a downloaded Sentinel zip file with AI analysis capability
    
    Accepts either:
    - JSON: {"zip_path": "/path/to/file.zip", "product_id": "S2A_...", "load_ai": true}
    - FormData: file upload with optional load_ai parameter
    """
    global CURRENT_SAFE_PATH
    
    try:
        # Handle both JSON and file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            # File upload mode
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            if file.filename == '' or file.filename is None:
                return jsonify({'error': 'Empty filename'}), 400
            
            # Save uploaded file
            bhoonidhi = get_bhoonidhi_instance()
            os.makedirs(bhoonidhi.download_folder, exist_ok=True)
            zip_path = os.path.join(bhoonidhi.download_folder, file.filename)
            file.save(zip_path)
            
            load_ai = request.form.get('load_ai', 'true').lower() == 'true'
            
        else:
            # JSON mode
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            zip_path = data.get('zip_path')
            product_id = data.get('product_id')
            load_ai = data.get('load_ai', True)
            
            # If product_id provided, construct path
            if product_id and not zip_path:
                bhoonidhi = get_bhoonidhi_instance()
                zip_path = os.path.join(bhoonidhi.download_folder, f"{product_id}.zip")
        
        if not zip_path or not os.path.exists(zip_path):
            return jsonify({'error': 'Zip file not found'}), 404
        
        logger.info(f"Processing zip file: {zip_path}")
        
        # Extract and process
        safe_path, output_image = extract_and_process_zip(zip_path)
        
        if not safe_path:
            return jsonify({'error': 'Could not find .SAFE folder in zip'}), 400
        
        # Store SAFE path globally for AI analysis
        CURRENT_SAFE_PATH = safe_path
        
        # Get geographical bounds
        bounds = get_latlon_bounds(safe_path)
        
        # Validate bounds
        if not bounds or not isinstance(bounds, list) or len(bounds) != 4:
            logger.warning("Invalid bounds detected, using default")
            bounds = [0.0, 0.0, 0.0, 0.0]
        
        # Ensure all bounds are numbers
        try:
            bounds = [float(b) for b in bounds]
        except (ValueError, TypeError):
            logger.error("Bounds conversion failed, using default")
            bounds = [0.0, 0.0, 0.0, 0.0]
        
        # AI model not needed - using vision backend via ngrok
        response_data = {
            'message': 'Satellite data processed successfully',
            'safe_path': safe_path,
            'output_image': output_image if output_image else 'processed_sentinel_output.png',
            'image_url': '/api/get-processed-image',
            'processed_image_url': f'http://localhost:5001/api/get-processed-image',
            'bounds': bounds,
            'ai_available': True,  # Always true since we use vision backend
            'features': {
                'ai_analysis': True,  # Vision backend always available
                'viewport_crop': safe_path is not None
            }
        }
        
        logger.info(f"Response bounds: {bounds}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error processing zip: {e}", exc_info=True)
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_viewport():
    """
    DEPRECATED: This endpoint used local BLIP model.
    Use /api/analyze-roi or /api/interactive-chat instead (vision backend via ngrok).
    """
    return jsonify({
        'error': 'This endpoint is deprecated. Use /api/analyze-roi or /api/interactive-chat instead.',
        'alternatives': {
            'roi_analysis': '/api/analyze-roi',
            'chat': '/api/interactive-chat'
        }
    }), 410  # 410 Gone


@app.route('/api/analyze-roi', methods=['POST'])
def analyze_roi():
    """
    Advanced ROI Analysis with Multi-Model Support (Gemini/OSS)
    Supports both base64 images and ROI coordinates on uploaded satellite data
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        prompt = data.get('prompt', 'Analyze this region of interest')
        image_base64 = data.get('image')  # Base64 encoded cropped image
        image_url = data.get('image_url')  # URL to image
        roi_coords = data.get('roi')  # Optional: {x, y, width, height} in percentages
        model = data.get('model', DEFAULT_MODEL)  # "gemini" or "oss"
        metadata = data.get('metadata', {})
        
        # Handle both base64 image and image URL
        if not image_base64 and not image_url:
            return jsonify({'error': 'No image provided'}), 400
        
        # If URL provided, fetch and convert to base64
        if image_url and not image_base64:
            try:
                logger.info(f"Fetching image from URL: {image_url}")
                
                # Check if it's a local URL
                if image_url.startswith('http://localhost') or image_url.startswith('http://127.0.0.1'):
                    # It's our own processed image
                    image_path = 'processed_sentinel_output.png'
                    if os.path.exists(image_path):
                        with open(image_path, 'rb') as f:
                            image_bytes = f.read()
                    else:
                        return jsonify({'error': 'Processed image not found'}), 404
                else:
                    # External URL
                    img_response = requests.get(image_url, timeout=10)
                    img_response.raise_for_status()
                    image_bytes = img_response.content
                
                # Convert to base64
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                logger.info(f"Image converted to base64, size: {len(image_base64)} chars")
                
            except Exception as e:
                logger.error(f"Failed to fetch image from URL: {e}")
                return jsonify({'error': f'Failed to fetch image: {str(e)}'}), 400
        
        logger.info(f"ROI Analysis with model: {model}, has_image: {bool(image_base64)}")
        
        # Enhanced prompt for EO analysis
        enhanced_prompt = f"""You are an expert Earth Observation analyst. Analyze this satellite/aerial imagery region of interest.

{prompt}

Provide a detailed JSON response with the following structure:
{{
  "summary": "Brief 2-3 sentence summary",
  "confidence": 85.5,
  "landCover": {{
    "vegetation": 35.2,
    "water": 12.5,
    "urban": 28.3,
    "bareSoil": 15.0,
    "forest": 5.0,
    "agriculture": 4.0
  }},
  "vegetation": {{
    "health": "Good",
    "ndvi": 0.65,
    "density": 72.5,
    "types": ["Deciduous Trees", "Grassland"]
  }},
  "waterBodies": {{
    "totalArea": 12.5,
    "quality": "Clean",
    "sources": ["River", "Pond"]
  }},
  "urban": {{
    "builtUpArea": 28.3,
    "development": "High",
    "infrastructure": ["Roads", "Buildings"]
  }},
  "environmental": {{
    "temperature": 28,
    "humidity": 65,
    "airQuality": "Good",
    "cloudCover": 20
  }},
  "features": [
    {{"type": "Notable Feature", "description": "Description", "severity": "Medium"}}
  ],
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "coordinates": {{"latitude": 0.0, "longitude": 0.0, "location": "Location Name"}}
}}

IMPORTANT: Provide ONLY valid JSON. No markdown, no code blocks, just pure JSON."""

        if metadata:
            enhanced_prompt += f"\n\nImage Metadata: {json.dumps(metadata)}"
        
        # Call vision backend with selected model
        try:
            response_text = call_vision_backend(image_base64, enhanced_prompt, model=model)
        except Exception as e:
            logger.error(f"Vision backend error: {e}")
            return jsonify({'error': f'Vision backend error: {str(e)}'}), 503
        
        # Parse JSON response
        try:
            # Extract JSON if wrapped in markdown
            json_text = response_text.strip()
            
            # Remove markdown code blocks
            if '```json' in json_text:
                json_text = json_text.split('```json')[1].split('```')[0].strip()
            elif '```' in json_text:
                json_text = json_text.split('```')[1].split('```')[0].strip()
            
            # Try to find JSON object in the text
            if not json_text.startswith('{'):
                # Look for first { and last }
                start_idx = json_text.find('{')
                end_idx = json_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_text = json_text[start_idx:end_idx+1]
            
            # Parse the JSON
            analysis_data = json.loads(json_text)
            display_text = analysis_data.get('summary', 'Analysis completed')
            
            logger.info(f"Successfully parsed JSON response with {len(analysis_data)} fields")
            
        except Exception as parse_error:
            logger.warning(f"Failed to parse JSON: {parse_error}, creating structured response from text")
            
            # Create a basic structured response from the text
            analysis_data = {
                "summary": response_text[:200] + "..." if len(response_text) > 200 else response_text,
                "confidence": 80,
                "insights": [
                    "Analysis completed successfully",
                    "Review the AI response for detailed findings"
                ],
                "text": response_text
            }
            display_text = response_text
        
        return jsonify({
            'success': True,
            'text': display_text,
            'analysis': analysis_data,
            'model': model,
            'roi_coords': roi_coords,
            'metadata': metadata
        }), 200
        
    except Exception as e:
        logger.error(f"Error in ROI analysis: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/interactive-chat', methods=['POST'])
def interactive_chat():
    """
    Interactive chat analysis with conversation history
    Supports multi-turn conversations with context
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        message = data.get('message', '')
        images = data.get('images', [])  # Array of base64 images
        image_url = data.get('image_url')  # Single image URL
        history = data.get('history', [])  # Previous conversation
        model = data.get('model', DEFAULT_MODEL)  # "gemini" or "oss"
        metadata = data.get('metadata', {})
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Handle image_url - convert to base64
        if image_url and not images:
            try:
                logger.info(f"Fetching image from URL: {image_url}")
                
                # Check if it's a local URL
                if image_url.startswith('http://localhost') or image_url.startswith('http://127.0.0.1'):
                    # It's our own processed image
                    image_path = 'processed_sentinel_output.png'
                    if os.path.exists(image_path):
                        with open(image_path, 'rb') as f:
                            image_bytes = f.read()
                        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                        images = [image_base64]
                        logger.info(f"Loaded local image, size: {len(image_base64)} chars")
                else:
                    # External URL
                    img_response = requests.get(image_url, timeout=10)
                    img_response.raise_for_status()
                    image_bytes = img_response.content
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    images = [image_base64]
                    logger.info(f"Fetched external image, size: {len(image_base64)} chars")
                    
            except Exception as e:
                logger.warning(f"Failed to fetch image from URL: {e}, continuing without image")
        
        logger.info(f"Interactive chat with model: {model}, images: {len(images)}")
        
        # Build context from history
        context = ""
        if history:
            for entry in history[-5:]:  # Last 5 messages for context
                role = entry.get('role', 'user')
                content = entry.get('content', '')
                context += f"{role.upper()}: {content}\n"
        
        # Enhanced prompt with EO system context
        system_prompt = """You are an expert Earth Observation analyst specializing in satellite and aerial imagery interpretation. 
You have deep knowledge of remote sensing, GIS, land cover classification, environmental monitoring, and geospatial analysis.

Provide detailed, accurate, and actionable insights. Use the JSON format when providing structured analysis."""

        enhanced_prompt = f"{system_prompt}\n\n"
        if context:
            enhanced_prompt += f"Conversation Context:\n{context}\n\n"
        
        enhanced_prompt += f"Current Question: {message}"
        
        if metadata:
            enhanced_prompt += f"\n\nImage Metadata: {json.dumps(metadata)}"
        
        # Call vision backend with selected model
        try:
            if images:
                response_text = call_vision_backend(images[0], enhanced_prompt, model=model)
            else:
                response_text = call_vision_backend_text(enhanced_prompt, model=model)
        except Exception as e:
            logger.error(f"Vision backend error: {e}")
            return jsonify({'error': f'Vision backend error: {str(e)}'}), 503
        
        # Try to parse structured data
        analysis_data = None
        try:
            json_text = response_text
            if '```json' in json_text:
                json_text = json_text.split('```json')[1].split('```')[0].strip()
            elif '```' in json_text:
                json_text = json_text.split('```')[1].split('```')[0].strip()
            analysis_data = json.loads(json_text)
        except:
            pass
        
        return jsonify({
            'success': True,
            'response': response_text,  # For frontend compatibility
            'text': response_text,
            'analysis': analysis_data,
            'model': model,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in interactive chat: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


def call_vision_backend(image_base64, prompt, model="oss"):
    """
    Call vision backend (Gemini or ngrok OSS) with image
    
    Args:
        image_base64: Base64 encoded image
        prompt: Text prompt
        model: "gemini" or "oss" (default)
    """
    if model == "gemini":
        return call_gemini_vision(image_base64, prompt)
    else:
        return call_oss_vision(image_base64, prompt)


def call_gemini_vision(image_base64, prompt):
    """Call Gemini API for vision analysis"""
    if not GEMINI_API_KEY:
        raise Exception("Gemini API key not configured. Set GEMINI_API_KEY environment variable.")
    
    try:
        import google.generativeai as genai
        from PIL import Image
        import io
        
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 to image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Call Gemini
        response = model.generate_content([prompt, image])
        return response.text
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise Exception(f"Gemini API error: {str(e)}")


def call_oss_vision(image_base64, prompt):
    """Call ngrok OSS vision backend (InternVL2)"""
    if not VISION_BACKEND_URL:
        raise Exception("Vision backend URL not configured")
    
    # Remove data URL prefix if present
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    url = f"{VISION_BACKEND_URL}/chat"
    
    payload = {
        "prompt": prompt,
        "images": [image_base64],
        "history": []
    }
    
    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    return result.get('response', result.get('text', ''))


def call_vision_backend_text(prompt, model="oss"):
    """
    Call vision backend for text-only (Gemini or ngrok)
    
    Args:
        prompt: Text prompt
        model: "gemini" or "oss" (default)
    """
    if model == "gemini":
        return call_gemini_text(prompt)
    else:
        return call_oss_text(prompt)


def call_gemini_text(prompt):
    """Call Gemini API for text-only"""
    if not GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise Exception(f"Gemini API error: {str(e)}")


def call_oss_text(prompt):
    """Call ngrok OSS vision backend for text-only"""
    if not VISION_BACKEND_URL:
        raise Exception("Vision backend URL not configured")
    
    url = f"{VISION_BACKEND_URL}/chat"
    
    payload = {
        "prompt": prompt,
        "history": []
    }
    
    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    return result.get('response', result.get('text', ''))

@app.route('/api/get-processed-image', methods=['GET'])
def get_processed_image():
    """Serve the processed satellite image"""
    try:
        image_path = 'processed_sentinel_output.png'
        if os.path.exists(image_path):
            return send_file(image_path, mimetype='image/png')
        return jsonify({'error': 'Processed image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/complete-workflow', methods=['POST'])
def complete_workflow():
    """
    Complete workflow: Location → Search → Download → Process
    
    Request: {
        "location": "New Delhi",
        "sdate": "2024-11-01",
        "edate": "2024-11-30",
        "satellites": ["Sentinel-2A_MSI_Level-2A"],
        "process_immediately": true
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        location = data.get('location')
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        logger.info(f"Starting complete workflow for location: {location}")
        
        # Step 1: Search and Download
        search_data = {
            'location': location,
            'sdate': data.get('sdate'),
            'edate': data.get('edate'),
            'satellites': data.get('satellites', ["Sentinel-2A_MSI_Level-2A", "Sentinel-2B_MSI_Level-2A"]),
            'max_downloads': 1
        }
        
        # Call search_and_download internally
        with app.test_request_context(json=search_data):
            search_response = search_and_download()
            search_result = search_response[0].get_json()
        
        if search_response[1] != 200:
            return jsonify(search_result), search_response[1]
        
        # Step 2: Process if requested
        process_immediately = data.get('process_immediately', True)
        processed_info = None
        
        if process_immediately and search_result.get('downloaded'):
            downloaded = search_result['downloaded']
            if downloaded and len(downloaded) > 0:
                first_download = downloaded[0]
                
                if first_download['status'] in ['downloaded', 'already_exists']:
                    product_id = first_download['product_id']
                    logger.info(f"Processing product: {product_id}")
                    
                    try:
                        # Call process_zip internally
                        with app.test_request_context(json={'product_id': product_id}):
                            process_response = process_zip()
                            processed_info = process_response[0].get_json()
                    except Exception as e:
                        logger.error(f"Error processing: {e}")
                        processed_info = {'error': str(e)}
        
        # Combine results
        return jsonify({
            'message': 'Complete workflow executed',
            'location': location,
            'search_download_result': search_result,
            'processing_result': processed_info,
            'workflow_steps': {
                '1_geocoding': 'completed',
                '2_search': 'completed',
                '3_download': 'completed' if search_result.get('downloaded') else 'no_data',
                '4_processing': 'completed' if processed_info and 'error' not in processed_info else 'skipped_or_failed'
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error in complete workflow: {e}", exc_info=True)
        return jsonify({'error': f'Workflow failed: {str(e)}'}), 500

@app.route('/api/list-downloads', methods=['GET'])
def list_downloads():
    """List all downloaded satellite data files"""
    try:
        bhoonidhi = get_bhoonidhi_instance()
        download_folder = bhoonidhi.download_folder
        
        if not os.path.exists(download_folder):
            return jsonify({'files': [], 'count': 0}), 200
        
        zip_files = glob.glob(os.path.join(download_folder, "*.zip"))
        
        files_info = []
        for zip_file in zip_files:
            file_stat = os.stat(zip_file)
            files_info.append({
                'filename': os.path.basename(zip_file),
                'path': zip_file,
                'size_mb': round(file_stat.st_size / (1024 * 1024), 2),
                'modified': datetime.fromtimestamp(file_stat.st_mtime).isoformat()
            })
        
        return jsonify({
            'files': files_info,
            'count': len(files_info),
            'download_folder': download_folder
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    print("="*80)
    print("🛰️  UNIFIED BHOONIDHI API SERVER")
    print("="*80)
    print("Available Endpoints:")
    print("  GET  /health                     - Health check")
    print("  POST /api/geocode                - Location to coordinates")
    print("  POST /api/search-and-download    - Search and download satellite data")
    print("  GET  /api/download-progress      - Get download progress (optional: ?product_id=XXX)")
    print("  POST /api/process-zip            - Process downloaded zip file")
    print("  POST /api/complete-workflow      - Complete workflow (all steps)")
    print("  GET  /api/list-downloads         - List downloaded files")
    print("  GET  /api/get-processed-image    - Get processed satellite image")
    print("  POST /api/analyze-roi            - Advanced ROI analysis (Vision Backend)")
    print("  POST /api/interactive-chat       - Interactive chat with context")
    print("\n" + "="*80)
    print(f"Vision Backend: {VISION_BACKEND_URL}")
    print("="*80)
    print("Starting server on http://localhost:5001")
    print("="*80 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)

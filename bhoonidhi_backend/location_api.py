from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime
from urllib.parse import quote
import os
import sys
import logging

# Import the Bhoonidhi class
from search import Bhoonidhi

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Bhoonidhi instance (will be lazy-loaded)
bhoonidhi_instance = None

def get_bhoonidhi_instance():
    """Get or create Bhoonidhi instance"""
    global bhoonidhi_instance
    if bhoonidhi_instance is None:
        download_folder = os.path.join(os.getcwd(), "downloads")
        bhoonidhi_instance = Bhoonidhi(download_folder=download_folder)
    return bhoonidhi_instance

def get_coordinates(location_name):
    """
    Get coordinates for a location using Nominatim (OpenStreetMap) geocoding API
    Free and doesn't require API key
    """
    try:
        # Use Nominatim API for geocoding
        url = f"https://nominatim.openstreetmap.org/search"
        params = {
            'q': location_name,
            'format': 'json',
            'limit': 1
        }
        headers = {
            'User-Agent': 'Bhoonidhi-Location-API/1.0'
        }
        
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
        else:
            return None
            
    except Exception as e:
        print(f"Error getting coordinates: {str(e)}")
        return None

@app.route('/api/location-to-coords', methods=['POST'])
def location_to_coords():
    """
    API endpoint to convert location and date to coordinates
    
    Expected JSON input:
    {
        "location": "New Delhi",
        "sdate": "NOV/8/2025",
        "edate": "DEC/8/2025",
        "userId": "ONL_Sarthak2314",
        "prod": "Standard",
        "selSats": "Sentinel-2A_MSI_Level-2A",
        "radius": "10"
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'error': 'No data provided'
            }), 400
        
        location = data.get('location')
        if not location:
            return jsonify({
                'error': 'Location is required'
            }), 400
        
        # Get coordinates from location
        coords = get_coordinates(location)
        
        if not coords:
            return jsonify({
                'error': f'Could not find coordinates for location: {location}'
            }), 404
        
        # Format dates (URL encoded)
        sdate = data.get('sdate', 'NOV/8/2025')
        edate = data.get('edate', 'DEC/8/2025')
        
        # Build response in the format shown
        response_data = {
            'userId': data.get('userId', 'ONL_User'),
            'prod': data.get('prod', 'Standard'),
            'selSats': data.get('selSats', 'Sentinel-2A_MSI_Level-2A'),
            'offset': data.get('offset', '0'),
            'edate': quote(edate),
            'filters': quote('{}'),
            'isMX': data.get('isMX', 'No'),
            'lat': str(coords['lat']),
            'loc': data.get('loc', 'Decimal'),
            'lon': str(coords['lon']),
            'offset': data.get('offset', '0'),
            'prod': data.get('prod', 'Standard'),
            'query': data.get('query', 'area'),
            'queryType': data.get('queryType', 'location'),
            'radius': data.get('radius', '10'),
            'sdate': quote(sdate),
            'selSats': data.get('selSats', 'Sentinel-2A_MSI_Level-2A'),
            'userId': data.get('userId', 'ONL_User'),
            'location_name': coords['display_name']
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/search-and-download', methods=['POST'])
def search_and_download():
    """
    API endpoint that takes location and dates, searches for satellite data, and downloads it
    
    Expected JSON input:
    {
        "location": "New Delhi",
        "sdate": "2025-11-08",  # Format: YYYY-MM-DD
        "edate": "2025-12-08",  # Format: YYYY-MM-DD
        "satellites": ["Sentinel-2A_MSI_Level-2A", "Sentinel-2B_MSI_Level-2A"],  # optional
        "max_downloads": 1  # optional, defaults to 1
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        location = data.get('location')
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        # Get coordinates from location
        logging.info(f"Getting coordinates for location: {location}")
        coords = get_coordinates(location)
        
        if not coords:
            return jsonify({'error': f'Could not find coordinates for location: {location}'}), 404
        
        logging.info(f"Found coordinates: lat={coords['lat']}, lon={coords['lon']}")
        
        # Parse dates - expect YYYY-MM-DD format
        sdate_str = data.get('sdate')
        edate_str = data.get('edate')
        
        if not sdate_str or not edate_str:
            return jsonify({'error': 'Both sdate and edate are required in YYYY-MM-DD format'}), 400
        
        # Get satellites list
        satellites = data.get('satellites', [
            "Sentinel-2A_MSI_Level-2A",
            "Sentinel-2B_MSI_Level-2A"
        ])
        
        max_downloads = data.get('max_downloads', 1)
        
        # Initialize Bhoonidhi
        logging.info("Initializing Bhoonidhi instance...")
        bhoonidhi = get_bhoonidhi_instance()
        
        # Search for products - search_bhoo expects [lat, lon] and dates as strings or datetime
        lat_lon = [coords['lat'], coords['lon']]
        logging.info(f"Searching for satellite data at {lat_lon} from {sdate_str} to {edate_str}")
        
        results = bhoonidhi.search_bhoo(
            lat_lon=lat_lon,
            start_date=sdate_str,  # Pass as string, search_bhoo will handle conversion
            end_date=edate_str,
            sats=satellites
        )
        
        logging.info(f"Found {len(results)} products")
        
        if not results:
            return jsonify({
                'message': 'No satellite products found for the specified location and dates',
                'location': location,
                'coordinates': coords,
                'products_found': 0
            }), 200
        
        # Filter for direct download products
        direct_download_products = [p for p in results if bhoonidhi.is_direct_download(p)]
        logging.info(f"Found {len(direct_download_products)} direct download products")
        
        if not direct_download_products:
            return jsonify({
                'message': 'Found products but none are available for direct download',
                'location': location,
                'coordinates': coords,
                'products_found': len(results),
                'direct_download_available': 0
            }), 200
        
        # Add products to cart and download (limit to max_downloads)
        products_to_process = direct_download_products[:max_downloads]
        added_products = []
        
        for product in products_to_process:
            logging.info(f"Adding product to cart: {product.get('ID')}")
            add_result = bhoonidhi.add_order(product)
            if add_result and 'error' not in add_result:
                added_products.append(product)
                logging.info(f"Successfully added: {product.get('ID')}")
        
        if not added_products:
            return jsonify({
                'message': 'Failed to add products to cart',
                'location': location,
                'coordinates': coords,
                'products_found': len(results)
            }), 500
        
        # Download products
        downloaded_files = []
        failed_downloads = []
        
        for product in added_products:
            product_id = product.get('ID')
            file_path = os.path.join(bhoonidhi.download_folder, f"{product_id}.zip")
            
            if os.path.exists(file_path):
                logging.info(f"Product already downloaded: {product_id}")
                downloaded_files.append({
                    'product_id': product_id,
                    'status': 'already_exists',
                    'file_path': file_path
                })
            else:
                try:
                    logging.info(f"Downloading product: {product_id}")
                    bhoonidhi.download_cart_product(product, datetime.now())
                    
                    if os.path.exists(file_path):
                        downloaded_files.append({
                            'product_id': product_id,
                            'status': 'downloaded',
                            'file_path': file_path
                        })
                        logging.info(f"Successfully downloaded: {product_id}")
                    else:
                        failed_downloads.append({
                            'product_id': product_id,
                            'error': 'File not found after download'
                        })
                except Exception as e:
                    logging.error(f"Error downloading {product_id}: {e}")
                    failed_downloads.append({
                        'product_id': product_id,
                        'error': str(e)
                    })
        
        return jsonify({
            'message': 'Search and download completed',
            'location': location,
            'location_name': coords['display_name'],
            'coordinates': {
                'lat': coords['lat'],
                'lon': coords['lon']
            },
            'search_period': {
                'start': sdate_str,
                'end': edate_str
            },
            'satellites': satellites,
            'products_found': len(results),
            'direct_download_available': len(direct_download_products),
            'processed': len(products_to_process),
            'downloaded': downloaded_files,
            'failed': failed_downloads,
            'summary': {
                'total_downloaded': len([d for d in downloaded_files if d['status'] == 'downloaded']),
                'already_existed': len([d for d in downloaded_files if d['status'] == 'already_exists']),
                'failed': len(failed_downloads)
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error in search_and_download: {e}", exc_info=True)
        return jsonify({
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/geocode', methods=['GET'])
def geocode():
    """
    Simple GET endpoint to geocode a location
    Usage: /api/geocode?location=New Delhi
    """
    try:
        location = request.args.get('location')
        
        if not location:
            return jsonify({
                'error': 'Location parameter is required'
            }), 400
        
        coords = get_coordinates(location)
        
        if not coords:
            return jsonify({
                'error': f'Could not find coordinates for location: {location}'
            }), 404
        
        return jsonify(coords), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Location to Coordinates API'
    }), 200

if __name__ == '__main__':
    print("Starting Location API server on http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)

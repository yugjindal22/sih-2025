import json
import logging
import os
import requests
from requests.exceptions import RequestException, JSONDecodeError
import time
import urllib.parse
from dotenv import load_dotenv
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
load_dotenv()
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)


@dataclass
class ProductSearchResult:
    """Data class to represent a satellite product search result from Bhoonidhi API."""
    ID: str
    FILENAME: str
    DIRPATH: str
    IMAGING_ORBIT_NO: str
    GROUND_ORBIT_NO: str
    SEGMENT_NO: str
    ROLL: str
    PITCH: str
    YAW: str
    TILE_ID: str
    SCENE_NO: str
    COVERAGE: str
    CURR_SCENE_NO: str
    ImgCrnNWLat: str
    ImgCrnNWLon: str
    ImgCrnNELat: str
    ImgCrnNELon: str
    ImgCrnSELat: str
    ImgCrnSELon: str
    ImgCrnSWLat: str
    ImgCrnSWLon: str
    IMAGE_CHAIN: str
    AGENCY: str
    SCENE_SEQ: str
    OverLapPercent: str
    CrnNWLat: str
    CrnNWLon: str
    CrnNELat: str
    CrnNELon: str
    CrnSELat: str
    CrnSELon: str
    CrnSWLat: str
    CrnSWLon: str
    SCENE_CENTER_LAT: str
    SCENE_CENTER_LONG: str
    OBSID: str
    ACQUISITION_MODE: str
    IMAGING_MODE: str
    SATELLITE: str
    SENSOR: str
    PRICED: str
    TABLETYPE: str
    O2_MODE: str
    DOP: str
    QUALITY_SCORE: str
    PRODCODE: str
    PRODTYPE: str
    BINPERIOD: str
    BINRESOLUTION: str
    PASS_TYPE: str
    QAZIP: str
    QAPDF: str
    srt: str
    
    # Optional fields that may be added by get_interface()
    PATH: Optional[str] = None
    ROW: Optional[str] = None
    PATHNO: Optional[str] = None
    STRIP_NO: Optional[str] = None
    SUBSCENE_ID: Optional[str] = None
    SAT_SPEC: Optional[str] = None
    SAT_SPEC_SCHEME: Optional[str] = None
    SCENE_SPEC: Optional[str] = None
    SCENE_SPEC_SCHEME: Optional[str] = None
    SCENE_ID: Optional[str] = None
    IMG_PATH: Optional[str] = None
    CLOUD_COVER: Optional[str] = None
    SSTM_avail: Optional[str] = None
    Other_Scene: Optional[str] = None
    STRIP_ID: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in asdict(self).items() if v is not None}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProductSearchResult':
        """Create ProductSearchResult from dictionary, handling extra fields gracefully."""
        # Get all field names from the dataclass
        field_names = {f.name for f in cls.__dataclass_fields__.values()}
        # Filter data to only include known fields
        filtered_data = {k: v for k, v in data.items() if k in field_names}
        return cls(**filtered_data)

cartosat_list = """CartoSat-2_PAN(SPOT)
CartoSat-2A_PAN(SPOT)
CartoSat-2B_PAN(SPOT)
CartoSat-2C_PAN(SPOT)
CartoSat-2D_PAN(SPOT)
CartoSat-2E_PAN(SPOT)
CartoSat-2F_PAN(SPOT)
CartoSat-3_PAN(SPOT)
CartoSat-1_PAN(MONO)
CartoSat-2C_MX(SPOT)
CartoSat-2D_MX(SPOT)
CartoSat-2E_MX(SPOT)
CartoSat-2F_MX(SPOT)
CartoSat-3_MX(SPOT)
KompSat-3_MS
KompSat-3A_MS"""
resourcesat_list = """ResourceSat-1_LISS4(MONO)
ResourceSat-2_LISS3
ResourceSat-2_LISS4(MONO)
ResourceSat-2_LISS4(MX23)
ResourceSat-2_LISS4(MX70)
ResourceSat-2A_LISS3
ResourceSat-2A_LISS4(MONO)
ResourceSat-2A_LISS4(MX23)
ResourceSat-2A_LISS4(MX70)
LandSat-8_OLI+TIRS_Standard
Sentinel-2A_MSI_Level-1C
Sentinel-2A_MSI_Level-2A
Sentinel-2B_MSI_Level-1C
Sentinel-2B_MSI_Level-2A
ResourceSat-2_AWIFS
ResourceSat-2A_AWIFS"""

othersat_list = """Novasar-1_SAR(All)
Aqua_MODIS
OceanSat-2_OCM
OceanSat-2_OCM_L1B
Terra_MODIS
Sentinel-1A_SAR(IW)_GRD
Sentinel-1B_SAR(IW)_GRD"""

microsat_list = """RISAT-2B_SAR(MOSAIC-3)
RISAT-2B_SAR(STRIP-MAP)
RISAT-2B_SAR(SUPER-STRIP)
RISAT-2B1_SAR(MOSAIC-3)
RISAT-2B1_SAR(STRIP-MAP)
RISAT-2B1_SAR(SUPER-STRIP)
RISAT-2B2_SAR(MOSAIC-3)
RISAT-2B2_SAR(STRIP-MAP)
RISAT-2B2_SAR(SUPER-STRIP)
RISAT-2B_SAR(FINE-SPOT)
RISAT-2B_SAR(MOSAIC-1)
RISAT-2B_SAR(SLIDING-FINE-SPOT10)
RISAT-2B_SAR(SLIDING-FINE-SPOT20)
RISAT-2B_SAR(SLIDING-SPOT-LIGHT10)
RISAT-2B_SAR(SLIDING-SPOT-LIGHT20)
RISAT-2B_SAR(SPOT-LIGHT)
RISAT-2B1_SAR(FINE-SPOT)
RISAT-2B1_SAR(MOSAIC-1)
RISAT-2B1_SAR(SLIDING-FINE-SPOT10)
RISAT-2B1_SAR(SLIDING-FINE-SPOT20)
RISAT-2B1_SAR(SLIDING-SPOT-LIGHT10)
RISAT-2B1_SAR(SLIDING-SPOT-LIGHT20)
RISAT-2B1_SAR(SPOT-LIGHT)
RISAT-2B2_SAR(FINE-SPOT)
RISAT-2B2_SAR(MOSAIC-1)
RISAT-2B2_SAR(SLIDING-FINE-SPOT10)
RISAT-2B2_SAR(SLIDING-FINE-SPOT20)
RISAT-2B2_SAR(SLIDING-SPOT-LIGHT10)
RISAT-2B2_SAR(SLIDING-SPOT-LIGHT20)
RISAT-2B2_SAR(SPOT-LIGHT)
"""


def bhoo_sat(sat_list):
    res = ""
    sat_list = sat_list.split("\n")
    for sat in sat_list:
        res = res + "%2C" + sat
    return res[3:]


def bhoo_date(in_date):
    try:
        con_date = (
            datetime.strptime(in_date, "%Y-%m-%d") if isinstance(in_date, str) else in_date
        )
        month = con_date.strftime("%B")
        year = con_date.strftime("%Y")
        date = con_date.strftime("%d")
        return f"{month[:3].upper()}%2F{date}%2F{year}"
    except (ValueError, AttributeError) as e:
        logging.error(f"Error parsing date '{in_date}': {e}")
        raise ValueError(f"Invalid date format: {in_date}. Expected YYYY-MM-DD or datetime object.")


class Bhoonidhi:
    def __init__(self, download_folder=None, progress_callback=None):
        self.token = None
        self.user_id = None
        self.session = requests.Session()
        self.timeout = 30  # Default timeout in seconds
        self.download_folder = download_folder or os.getcwd()
        self.progress_callback = progress_callback  # Callback for progress updates
        # Create download folder if it doesn't exist
        if not os.path.exists(self.download_folder):
            os.makedirs(self.download_folder)
            logging.info(f"Created download folder: {self.download_folder}")
        try:
            self.get_token()
        except Exception as e:
            logging.error(f"Initialization failed: {e}")

    def get_token(self):
        url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/LoginServlet"
        username = os.environ.get('BHOONIDHI_USER')
        password = os.environ.get('BHOONIDHI_PASS')
        
        if not username or not password:
            raise ValueError("BHOONIDHI_USER and BHOONIDHI_PASS must be set in environment variables")
        
        payload = {
            "userId":  username,
            "password": password,
            "oldDB": "false",
            "action": "VALIDATE_LOGIN",
        }
        try:
            res = self.session.post(url, json=payload, timeout=self.timeout)
            res.raise_for_status()
        except RequestException as e:
            logging.error(f"Login request failed: {e}")
            raise

        if not res.ok:
            logging.error(f"Login failed with status code: {res.status_code}")
            logging.error(f"Response: {res.text}")
            raise Exception(f"Login failed: {res.status_code} - {res.text}")
        
        try:
            result = res.json()
            if "Results" in result and len(result["Results"]) > 0:
                self.token = result["Results"][0]["JWT"]
                self.user_id = result["Results"][0]["USERID"]
                logging.info(f"✅ Login successful - User ID: {self.user_id}")
            else:
                logging.error(f"Unexpected response format: {result}")
                raise Exception("Login failed: Invalid credentials or unexpected response")
        except JSONDecodeError as e:
            logging.error(f"Error parsing login response: {str(e)}")
            logging.error(f"Response text: {res.text}")
            raise
        except Exception as e:
            logging.error(f"Error processing login response: {str(e)}")
            raise
        
        return result
    
    def download_cart_product(self, product, cart_date):
        """product: Cart Product"""
        try:
            server_url = "https://bhoonidhi.nrsc.gov.in/"
            sat = product.get("SATELLITE", "")
            sen = product.get("SENSOR", "")
            path = product.get("DIRPATH", "").upper()
            prdId = product.get("ID", "")
            sid = product.get("srt", "")
            
            if not all([sat, sen, path, prdId]):
                logging.error(f"Invalid product data: {product}")
                return

            mon = ""
            if ("NOEDA" in path):
                path = path.replace("//IMGARCHIVE/NOEDAJPG//", "bhoonidhi/data/")
                parts = prdId.split("_")
                if len(parts) > 2:
                    mon = parts[2][2:4] # Extracting the month from ots id
            else:
                # Robustly remove the day directory
                # Remove trailing slash if exists
                if path.endswith('/'):
                    path = path[:-1]
                # Remove the last component (day)
                if '/' in path:
                    path = path.rsplit('/', 1)[0] + '/'
                
                path = path.replace("/IMGARCHIVE/PRODUCTJPGS/", "bhoonidhi/data/")
            
            # Clean up double slashes in path
            while "//" in path:
                path = path.replace("//", "/")

            if (sen == "OLI"):
                path = path.replace("L8/OLI", "L8/O")
                path = path.replace("L9/OLI", "L9/O")
            if (sat == "NVS"):
                path = path.replace("NVS/", "NV/")
            if (sat == "NPP"):
                path = path.replace("NPP/VIR/", "NPP/V/")
            if (sat == "JP1"):
                path = path.replace("JP1/VIR/", "JP1/V/")
            if (sat == "RS2"):
                path = path.replace("RS2/LIS3/", "RS2/3/")
                path = path.replace("RS2/AWIF/", "RS2/W/")
                path = path.replace("RS2/LIS4/", "RS2/F/")
                path = path.replace("RS2/L4FMX/", "RS2/F/")
            if (sat == "R2A"):
                path = path.replace("R2A/LIS3/", "R2A/3/")
                path = path.replace("R2A/AWIF/", "R2A/W/")
                path = path.replace("R2A/LIS4/", "R2A/F/")
                path = path.replace("R2A/L4FMX/", "R2A/F/")
            if (mon != ""):
                path = path + "/" + mon + "/"

            downURL = f"{server_url}{path}{prdId}.zip?token={self.token}&product_id={prdId}"
            if (sat != "NVS" or sen != "A"):
                downURL += f"&cartDate={cart_date.strftime('%d %B %Y')}&sid={sid}"
            
            start = time.perf_counter()
            logging.info(f"Starting download for {prdId}...")
            logging.debug(f"Download URL: {downURL}")
            
            with self.session.get(downURL, stream=True, timeout=self.timeout) as res:
                if res.status_code == 404:
                    # Check if file already exists locally
                    safe_filename = "".join(c for c in prdId if c.isalnum() or c in ('-', '_'))
                    local_file = os.path.join(self.download_folder, f'{safe_filename}.zip')
                    
                    if os.path.exists(local_file):
                        logging.info(f"File already exists locally, skipping: {local_file}")
                        return
                    
                    # Special handling for Sentinel-2 products
                    if sat in ["SEN2A", "SEN2B", "SEN1A", "SEN1B"]:
                        logging.warning(f"⚠️  Sentinel-2/1 product not yet available for download: {prdId}")
                        logging.warning(f"   These products need to be staged by the server after cart confirmation.")
                        logging.warning(f"   Please wait 10-30 minutes and check your order history for download status.")
                        logging.warning(f"   You can use order_history() method to check when products are ready.")
                    else:
                        logging.error(f"File not found (404) for {prdId}. URL: {downURL}")
                    return

                res.raise_for_status()
                total_length = res.headers.get('content-length')
                
                # Check if content type is not zip (e.g. error page)
                content_type = res.headers.get('content-type', '')
                if 'text/html' in content_type and (total_length is None or int(total_length) < 10000):
                    logging.error(f"Server returned HTML instead of ZIP for {prdId}. Content: {res.text[:200]}")
                    return

                dl = 0
                bar_char_length = 50
                
                # Sanitize filename
                safe_filename = "".join([c for c in prdId if c.isalpha() or c.isdigit() or c in ('-', '_')]).rstrip()
                filename = os.path.join(self.download_folder, f'{safe_filename}.zip')
                
                with open(filename, 'wb') as f:
                    if total_length is None: # no content length header
                        if self.progress_callback:
                            self.progress_callback(prdId, 0, 0, "downloading")
                        f.write(res.content)
                        if self.progress_callback:
                            self.progress_callback(prdId, 100, 100, "completed")
                    else:
                        total_size = int(total_length)
                        past_done = -1
                        last_reported = -1
                        for chunk in res.iter_content(chunk_size=8192):  # Larger chunk size for better performance
                            if chunk:
                                dl += len(chunk)
                                f.write(chunk)
                                done = int(bar_char_length * dl / total_size)
                                percent = int(100 * dl / total_size)
                                
                                # Report progress every 5% or when done changes
                                if past_done != done or (percent - last_reported >= 5):
                                    past_done = done
                                    last_reported = percent
                                    speed = dl / (time.perf_counter() - start) if (time.perf_counter() - start) > 0 else 0
                                    
                                    # Call progress callback if provided
                                    if self.progress_callback:
                                        self.progress_callback(prdId, percent, dl, "downloading", total_size, speed)
                                    
                                    # Log progress
                                    mb_downloaded = dl / (1024 * 1024)
                                    mb_total = total_size / (1024 * 1024)
                                    speed_mbps = speed / (1024 * 1024)
                                    logging.info(f"Progress: {percent}% ({mb_downloaded:.1f}/{mb_total:.1f} MB) - {speed_mbps:.2f} MB/s")
            
            download_time = time.perf_counter() - start
            logging.info(f"File written successfully at {filename} in {download_time:.2f} seconds")
            
            # Report completion
            if self.progress_callback:
                self.progress_callback(prdId, 100, dl if 'dl' in locals() else 0, "completed", 
                                     total_length if total_length else 0, 
                                     (dl / download_time) if download_time > 0 and 'dl' in locals() else 0)
            
        except RequestException as e:
            logging.error(f"Network error downloading {product.get('ID')}: {e}")
        except IOError as e:
            logging.error(f"File I/O error for {product.get('ID')}: {e}")
        except Exception as e:
            logging.error(f"Unexpected error downloading {product.get('ID')}: {e}")

    def view_cart(self, date=None):
        """View cart contents. If date is None, uses today's date."""
        if date is None:
            date = datetime.now()
        
        url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/CartServlet"
        # Try the format used in confirm_cart
        date_str = date.strftime("%d-%b-%Y").upper()
        payload = {
            "userId": self.user_id,
            "cartDate": date_str,
            "action": "VIEWCART",
        }
        logging.info(f"Viewing cart for date: {date_str}")
        try:
            res = self.session.post(url, data=payload, headers={"Token": self.token}, timeout=self.timeout)
            logging.info(f"View cart response status: {res.status_code}")
            
            if res.ok:
                try:
                    result = res.json()
                    logging.info(f"Cart response: {result}")
                    if "Results" in result:
                        return result["Results"]
                except JSONDecodeError:
                    logging.error(f"Error parsing view cart response. Text: {res.text[:500]}")
            else:
                logging.error(f"View cart failed: {res.status_code} - {res.text}")
        except RequestException as e:
            logging.error(f"Network error viewing cart: {e}")
        except Exception as e:
            logging.error(f"Unexpected error viewing cart: {e}")
            
        return []
    
    def order_history(self):
        """Get order history for the user."""
        url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/OrderHistoryServlet"
        payload = {
            "userId": self.user_id,
            "action": "GETORDERS"
        }
        try:
            res = self.session.post(url, data=payload, headers={"Token": self.token}, timeout=self.timeout)
            logging.info(f"Order history response status: {res.status_code}")
            
            if res.ok:
                try:
                    result = res.json()
                    if "Results" in result:
                        return result["Results"]
                except JSONDecodeError:
                    logging.error(f"Error parsing order history. Text: {res.text[:500]}")
            else:
                logging.error(f"Order history failed: {res.status_code} - {res.text}")
        except RequestException as e:
            logging.error(f"Network error getting order history: {e}")
        except Exception as e:
            logging.error(f"Unexpected error getting order history: {e}")
            
        return []

    def confirm_cart(self):
        url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/CartServlet"
        payload = {"action": "CONFIRM", "userId": self.user_id, "cartDate": datetime.now().strftime("%d-%b-%Y").upper()}
        
        try:
            res = self.session.post(url, data=payload, headers={"Token": self.token}, timeout=self.timeout)
            logging.info(f"Confirm cart response status: {res.status_code}")
            
            if not res.ok:
                logging.error(f"Confirm cart failed with status code: {res.status_code}")
                logging.error(f"Response: {res.text}")
                return {"error": f"Failed to confirm cart: {res.status_code}", "text": res.text}
            
            # Some APIs return empty response on success
            if not res.text or res.text.strip() == '':
                logging.info("Empty response - assuming cart confirmed successfully")
                return {"success": True, "message": "Cart confirmed"}
            
            try:
                return res.json()
            except JSONDecodeError as e:
                logging.warning(f"Could not parse JSON response: {str(e)}")
                logging.info(f"Response text: {res.text[:200]}")
                return {"success": True, "message": "Cart confirmed (non-JSON response)", "raw": res.text[:200]}
        except RequestException as e:
            logging.error(f"Network error confirming cart: {e}")
            return {"error": f"Network error: {e}"}
        except Exception as e:
            logging.error(f"Unexpected error confirming cart: {e}")
            return {"error": f"Unexpected error: {e}"}

    @staticmethod
    def is_direct_download(product):
        """Check if a product is directly downloadable (DirectDownload or Open_Data)."""
        priced = product.get("PRICED", "")
        return "DirectDownload" in priced or "Open_Data" in priced
    
    def check_product_availability(self, product):
        """Check if a product file actually exists on the server before downloading.
        
        For certain satellites like Sentinel-2, products may need to be added to cart first
        before they become downloadable, so we skip the availability check for those.
        
        Args:
            product: Product dictionary from search results
            
        Returns:
            bool: True if product is available for download, False otherwise
        """
        try:
            sat = product.get("SATELLITE", "")
            prdId = product.get("ID", "")
            
            # Skip availability check for Sentinel-2 and other OpenData satellites
            # These products become available after adding to cart
            if sat in ["SEN2A", "SEN2B", "SEN1A", "SEN1B"]:
                logging.info(f"  → {sat} is OpenData satellite, skipping pre-check")
                return True
            
            sen = product.get("SENSOR", "")
            path = product.get("DIRPATH", "").upper()
            
            if not all([sat, sen, path, prdId]):
                logging.warning(f"Missing required fields for {prdId}")
                return False

            # Build the download path using same logic as download_cart_product
            mon = ""
            if ("NOEDA" in path):
                path = path.replace("//IMGARCHIVE/NOEDAJPG//", "bhoonidhi/data/")
                parts = prdId.split("_")
                if len(parts) > 2:
                    mon = parts[2][2:4]
            else:
                if path.endswith('/'):
                    path = path[:-1]
                if '/' in path:
                    path = path.rsplit('/', 1)[0] + '/'
                path = path.replace("/IMGARCHIVE/PRODUCTJPGS/", "bhoonidhi/data/")
            
            # Clean up double slashes
            while "//" in path:
                path = path.replace("//", "/")

            # Apply satellite-specific path transformations
            if (sen == "OLI"):
                path = path.replace("L8/OLI", "L8/O")
                path = path.replace("L9/OLI", "L9/O")
            if (sat == "NVS"):
                path = path.replace("NVS/", "NV/")
            if (sat == "NPP"):
                path = path.replace("NPP/VIR/", "NPP/V/")
            if (sat == "JP1"):
                path = path.replace("JP1/VIR/", "JP1/V/")
            if (sat == "RS2"):
                path = path.replace("RS2/LIS3/", "RS2/3/")
                path = path.replace("RS2/AWIF/", "RS2/W/")
                path = path.replace("RS2/LIS4/", "RS2/F/")
                path = path.replace("RS2/L4FMX/", "RS2/F/")
            if (sat == "R2A"):
                path = path.replace("R2A/LIS3/", "R2A/3/")
                path = path.replace("R2A/AWIF/", "R2A/W/")
                path = path.replace("R2A/LIS4/", "R2A/F/")
                path = path.replace("R2A/L4FMX/", "R2A/F/")
            if (mon != ""):
                path = path + "/" + mon + "/"

            server_url = "https://bhoonidhi.nrsc.gov.in/"
            check_url = f"{server_url}{path}{prdId}.zip?token={self.token}&product_id={prdId}"
            
            # Use HEAD request to check if file exists without downloading
            response = self.session.head(check_url, timeout=10, allow_redirects=True)
            
            if response.status_code == 200:
                # Check if content-type is appropriate (not HTML error page)
                content_type = response.headers.get('content-type', '')
                if 'text/html' in content_type:
                    logging.debug(f"Product {prdId} returns HTML instead of ZIP (likely error page)")
                    return False
                return True
            elif response.status_code == 404:
                logging.debug(f"Product {prdId} not found (404)")
                return False
            else:
                logging.debug(f"Product {prdId} returned status {response.status_code}")
                return False
                
        except Exception as e:
            logging.debug(f"Error checking availability for {product.get('ID')}: {e}")
            return False

    @staticmethod
    def get_interface(product):
        subscene_list = ["A", "B", "C", "D", "F", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]
        product_id = product.get("ID", "")
        split_product = product_id.split("_")
        if not product.get("IMAGING_MODE"):
            product["IMAGING_MODE"] = "-"
        if "_" in product_id and product.get("SATELLITE") != "O2":
            product["IMAGING_MODE"] = split_product[2] if len(split_product) > 2 else ''
        else:
            product["IMAGING_MODE"] = "-"

        product["SUBSCENE_ID"] = "F"
        temp_sub = split_product[6] if len(split_product) > 6 else ''
        if product.get("TABLETYPE") == "PMETA" and len(product_id) == 41:
            temp_sub = product["ID"][40:]
        if temp_sub in subscene_list:  # Assuming `subscene_list` is defined elsewhere
            product["SUBSCENE_ID"] = temp_sub

        sub = "F"
        if "F" not in product["SUBSCENE_ID"] and product.get("SENSOR") != 'LIS4':
            sub = "S"
        if (
            (product.get("SATELLITE") in ["1C", "1D"])
            and product.get("SENSOR") == "PAN"
            and product["SUBSCENE_ID"] in ["A", "B", "C", "D"]
        ):
            sub = "F"

        sat_spec_scheme = "Satellite_Sensor_ImagingMode_Subscene"
        product["SAT_SPEC"] = f"{product.get('SATELLITE')}_{product.get('SENSOR')}_{product.get('IMAGING_MODE')}_{sub}"
        if product.get("TABLETYPE") == "PMETA" and product.get("PRODTYPE") != "Others":
            product["SAT_SPEC"] += f"_{product.get('PRODTYPE')}"
            sat_spec_scheme += "_Product"
            if product.get("SATELLITE","").startswith("E06") and product.get("SENSOR").startswith("SCT"):
                product["SAT_SPEC"] += f"_{split_product[len(split_product)-2]}"  # Assuming `sub` is defined elsewhere
                sat_spec_scheme += "_Resolution"
        if product.get("TABLETYPE") == "PMETA" and product.get("SATELLITE") == "E04":
            product["SAT_SPEC"] += f"_{split_product[9] if len(split_product) > 9 else ''}"
            sat_spec_scheme += "_TxPol"

        scene_spec1 = product["SAT_SPEC"]
        if product.get("SATELLITE") in ("NPP", "JP1"):
            scene_spec1 += f"_{product.get('ID').split('_')[-1]}"
            product["SAT_SPEC"] = scene_spec1

        scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('STRIP_NO')}_{product.get('SCENE_NO')}"
        scene_spec_scheme = "GroundOrbit_Strip_Scene"
        this_sat = product.get("SATELLITE", "")
        if this_sat.startswith("SEN"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('TILE_ID')}"
            scene_spec_scheme = "GroundOrbit_TileID"
        elif this_sat.startswith("GI1"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('STRIP_NO')}"
            scene_spec_scheme = "Orbit_Strip"
        elif this_sat.startswith("E04"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('IMAGING_ORBIT_NO')}_{product.get('STRIP_ID')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_ImagingOrbit_Strip_Scene"
        elif this_sat.startswith("E04"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('IMAGING_ORBIT_NO')}_{product.get('STRIP_ID')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_ImagingOrbit_Strip_Scene"
        elif this_sat.startswith("SC1") and product.get("SENSOR", "").startswith("SCAT"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_Scene"
        elif this_sat.startswith("E06") and product.get("SENSOR", "").startswith("SCT"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_Scene"
        elif this_sat.startswith("G29"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_Scene"
        elif this_sat == "C2":
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('IMAGING_ORBIT_NO')}_{split_product[12] if len(split_product) > 12 else ''}_{product.get('STRIP_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_ImagingOrbit_Segment_Strip_Scene"
        elif this_sat in ("C2A", "C2B", "C2C", "C2D"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('IMAGING_ORBIT_NO')}_{split_product[11] if len(split_product) > 11 else ''}_{product.get('STRIP_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_ImagingOrbit_Session_Strip_Scene"
        elif this_sat in ("C2E", "C2F", "C03"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{split_product[11] if len(split_product) > 11 else ''}_{product.get('STRIP_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_Session_Strip_Scene"
        elif this_sat in ("C2A", "C2B", "C2C", "C2D"):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('IMAGING_ORBIT_NO')}_{split_product[11] if len(split_product) > 11 else ''}_{product.get('STRIP_NO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_ImagingOrbit_Session_Strip_Scene"
        elif this_sat.startswith("O2") and product.get("SENSOR", "").startswith("SCAT"):
            scene_spec2 = product.get('GROUND_ORBIT_NO')
            scene_spec_scheme = "GroundOrbit"
        elif this_sat.startswith("O2") and product.get("SENSOR", "").startswith("OCM"):
            scene_spec2 = f"{product.get('PATHNO', '')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "Path_Row"
        elif this_sat.startswith("RS2") and "4x4deg-tiles" in product.get("PRODTYPE", ""):
            scene_spec2 = f"{split_product[6] if len(split_product) > 6 else ''}_{split_product[5] if len(split_product) > 5 else ''}day"
            scene_spec_scheme = "TileID_BinningPeriod"
        elif (this_sat.startswith("O2") or  this_sat.startswith("P6")) and "tiles" in product.get("PRODTYPE", ""):
            scene_spec2 = f"{product_id.split('_')[3]}_{product.get('PATHNO', '')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "TileID_Path_Row"
        elif any(list(map(lambda x: this_sat.startswith(x), ["RS2", "R2A", "L8", "L9", "P4", "P5", "P6"]))) or (
            this_sat.startswith("O2" and product.get("SENSOR").startswith("OCM")) or (
            this_sat.startswith("E06" and product.get("SENSOR").startswith("OCM"))) or (
            this_sat.startswith("E06" and product.get("SENSOR").startswith("SST")))):
            scene_spec2 = f"{product.get('GROUND_ORBIT_NO')}_{product.get('PATHNO')}_{product.get('SCENE_NO')}"
            scene_spec_scheme = "GroundOrbit_Path_Row"
            if product.get("SENSOR") == "AWIF" or product.get("IMAGING_MODE") in ["FMX", "MN"]:
                scene_spec2 += "_" + product["SUBSCENE_ID"]
                scene_spec_scheme += "_Subscene"
            elif this_sat.startswith("P6") and product.get("IMAGING_MODE") in ["SMX"]:
                scene_spec2 += "_" + split_product[13] if len(split_product) > 13 else ''
                scene_spec_scheme += "_StripNo"
            elif (this_sat.startswith("RS2") or this_sat.startswith("R2A")) and product.get("IMAGING_MODE") in ["SMX"]:
                scene_spec2 += "_" + split_product[23] if len(split_product) > 23 else ''
                scene_spec_scheme += "_StripNo"
            elif this_sat.startswith("P5") and product.get("PRODTYPE") == "CartoDEM-10m":
                scene_spec2 = product_id
                scene_spec_scheme = "TileID"
        elif any(list(map(lambda x: this_sat.startswith(x), ["1A", "1B", "1C", "1D", "L5", "AQ", "TE", "N1"]))):
            scene_spec2 = f'{product.get("PATHNO")}_{product.get("SCENE_NO")}'
            scene_spec_scheme = "Path_Row"
            if product.get("SENSOR") in ["AWIF", "LIS4", "LIS2", "PAN"]:
                scene_spec2 += f'_{product["SUBSCENE_ID"]}'
                scene_spec_scheme += "_Subscene"
        if this_sat.startswith("E06") and product.get("SENSOR", "").startswith("OCM"):
            product["SSTM_avail"] = "Y" if product.get("Other_Scene", "") and len(product["Other_Scene"]) > 2 else "N"

        product["SAT_SPEC_SCHEME"] = sat_spec_scheme
        product["SCENE_SPEC"] = scene_spec2
        product["SCENE_SPEC_SCHEME"] = scene_spec_scheme
        product["SCENE_ID"] = product.get("ID")

        img_loc = f"{product.get('DIRPATH')}/{product.get('FILENAME')}"
        img_loc += ".jpeg" if product.get("TABLETYPE") == "SMETA" else ".jpg"
        product["IMG_PATH"] = img_loc
        return product

    
    def add_order(self, product):
        """
        product is json of the product result
        """
        try:
            product = self.get_interface(product)
            url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/OpenOrderCart"
            if "DirectDownload" in product.get("PRICED", "") or "Open_Data" in product.get("PRICED", ""):
                if 'Other_Scene' in product:
                    product.pop("Other_Scene")
                
                # URL encode the selProds JSON
                sel_prods_json = json.dumps(product, separators=(',', ':'))
                sel_prods_encoded = urllib.parse.quote(sel_prods_json)
                
                payload = {
                    "PROD_AV": "Y" if product.get("CURR_SCENE_NO") == "Y" else "N",
                    "PROD_ID": product.get("ID"),
                    "action": "ADDTOCART",
                    "dop": product.get("DOP"),
                    "selProds": sel_prods_encoded,
                    "srt": product.get("srt"),
                    "userId": self.user_id,
                }
            else:  # "OnOrder" in product["PRICED"]
                if 'Other_Scene' in product:
                    product.pop("Other_Scene")
                payload = {
                    "sceneID": product.get("ID"),
                    "srt": product.get("srt"),
                    "queryType": product.get("TABLETYPE"),
                    "action": "ADDTOORDERCART",
                    "userId": self.user_id,
                    "selProds": json.dumps(product, separators=(',', ':')),
                    "selOtherProds": "NA",
                    "selSats": product.get("SAT_SPEC"),
                    "prod": "Standard"
                }
            # Don't URL encode when sending as form data
            # print(payload)
            res = self.session.post(url, data=payload, headers={
                "Token": self.token, 
                'Origin': 'https://bhoonidhi.nrsc.gov.in',
                'Host': 'bhoonidhi.nrsc.gov.in',
                'Content-Type': 'application/x-www-form-urlencoded'
            }, timeout=self.timeout)
            
            logging.info(f"Add order response status: {res.status_code}")
            
            if not res.ok:
                logging.error(f"Add order failed with status code: {res.status_code}")
                logging.error(f"Response: {res.text}")
                return {"error": f"Failed to add order: {res.status_code}", "text": res.text}
            
            # Some APIs return empty response on success
            if not res.text or res.text.strip() == '':
                logging.info("Empty response - assuming success")
                return {"success": True, "message": "Product added to cart"}
            
            try:
                return res.json()
            except JSONDecodeError as e:
                logging.warning(f"Could not parse JSON response: {str(e)}")
                logging.info(f"Response text: {res.text[:200]}")  # First 200 chars
                # Return success if status is 200
                return {"success": True, "message": "Product added (non-JSON response)", "raw": res.text[:200]}
        except RequestException as e:
            logging.error(f"Network error adding order: {e}")
            return {"error": f"Network error: {e}"}
        except Exception as e:
            logging.error(f"Unexpected error adding order: {e}")
            return {"error": f"Unexpected error: {e}"}

    def delete_order(self, product):
        payload = {
            "sceneID": product.get("ID"),
            "srt": product.get("srt"),
            "action": "DELETE",
            "userId": self.user_id,    
        }
        for k, v in payload.items():
            if v:
                payload[k] = urllib.parse.quote(v)
        url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/OpenOrderCart"
        try:
            res = self.session.post(url, json=payload, headers={"Token": self.token}, timeout=self.timeout)
            return res.json()
        except RequestException as e:
            logging.error(f"Network error deleting order: {e}")
            return {"error": f"Network error: {e}"}
        except Exception as e:
            logging.error(f"Unexpected error deleting order: {e}")
            return {"error": f"Unexpected error: {e}"}
        
    def search_bhoo(
        self, lat_lon, start_date=None, end_date=None, sats=resourcesat_list, return_typed=False
    ) -> List[Dict[str, Any]]:
        # sat_lists = [resourcesat_list, cartosat_list, othersat_list, microsat_list]
        try:
            d1 = bhoo_date(start_date)
            d2 = bhoo_date(end_date)
            sats_str = sats if isinstance(sats, str) else bhoo_sat('\n'.join(sats) if isinstance(sats, list) else sats)
            
            # If sats was passed as a list to bhoo_sat, it expects a newline separated string
            # But bhoo_sat implementation: sat_list = sat_list.split("\n")
            # So if we pass a list, we should join it first.
            # The original code: sats = sats if isinstance(sats, list) else bhoo_sat(sats)
            # If sats is list, it uses it directly? But json_to_be_sent uses '%2C'.join(sats)
            # If sats is list, '%2C'.join(sats) works.
            # If sats is string (from bhoo_sat), it is already joined with %2C.
            
            # Let's clarify:
            # bhoo_sat returns "Sat1%2CSat2..."
            # If sats is list: we want "Sat1%2CSat2..."
            
            if isinstance(sats, list):
                sats_val = '%2C'.join(sats)
            else:
                # Assume it's the newline separated string or already formatted
                if "\n" in sats:
                    sats_val = bhoo_sat(sats)
                else:
                    sats_val = sats

            # Use location-based search with radius instead of polygon
            json_to_be_sent = {
                "userId": "ONL_Sarthak2314",
                "prod": "Standard",
                "selSats": "Sentinel-2A_MSI_Level-2A",
                "offset": "0",
                "edate": "DEC%2F8%2F2025",
                "filters": "%7B%7D",
                "isMX": "No",
                "lat": "23.542",
                "loc": "Decimal",
                "lon": "91.492",
                "query": "area",
                "queryType": "location",
                "radius": "10",
                "sdate": "NOV%2F8%2F2025",
            }
            # print(json_to_be_sent)
            logging.info("Searching the products")
            url = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/ProductSearch"
            res = self.session.post(url, json=json_to_be_sent, timeout=self.timeout)
            print("searched products")
            print(res.text)

            if res.ok:
                try:
                    results = res.json()["Results"]
                    if return_typed:
                        # Convert to ProductSearchResult objects
                        typed_results = []
                        for result in results:
                            try:
                                typed_results.append(ProductSearchResult.from_dict(result))
                            except Exception as e:
                                logging.warning(f"Failed to convert result to typed object: {e}")
                                # Fall back to raw dict
                                typed_results.append(result)
                        return typed_results
                    return results
                except (JSONDecodeError, KeyError) as e:
                    logging.error(f"Error parsing search results: {e}")
                    logging.debug(f"Response: {res.text[:500]}")
                    return []
            else:
                logging.error(f"Search failed: {res.status_code}")
                logging.debug(f"Response: {res.text[:500]}")
                return []
        except Exception as e:
            logging.error(f"Error during search: {e}")
            return []
        
    def dowload_cart(self, cart_date):
        logging.info(f"Checking the cart for {cart_date}")
        cart_items = self.view_cart(cart_date)
        logging.info(f"Found {len(cart_items)} items")
        # Confirm the Data
        for cart_item in cart_items:
            file_path = os.path.join(self.download_folder, cart_item['ID']+'.zip')
            if not os.path.exists(file_path):
                self.download_cart_product(cart_item, cart_date)
            else:
                logging.info(f"File {file_path} already downloaded")


if __name__ == "__main__":
    try:
        # Specify the download folder (change this to your desired path)
        download_folder = os.path.join(os.getcwd(), "downloads")
        instance = Bhoonidhi(download_folder=download_folder)
        # Best satellites for high-resolution Level 2 (atmospherically corrected) imagery
        sats = [
            "Sentinel-2A_MSI_Level-2A",  # 10m resolution, free, open data
            "Sentinel-2B_MSI_Level-2A",  # 10m resolution, free, open data
        ]
        # 1. Search time data
        # Coordinates: [latitude, longitude]
        # Location: Delhi
        results = instance.search_bhoo(
            [28.652, 77.222],  # Delhi coordinates
            start_date="2025-12-06",
            end_date="2025-12-06",
            sats=sats
        )
        logging.info(f"Found {len(results)} results")
        
        # Log sample products
        if results:
            logging.info("\n" + "="*60)
            logging.info("Sample of searched products:")
            logging.info("="*60)
            for i, product in enumerate(results[:5], 1):  # Show first 5
                logging.info(f"\nProduct {i}:")
                logging.info(f"  ID: {product.get('ID')}")
                logging.info(f"  Satellite: {product.get('SATELLITE')}")
                logging.info(f"  Sensor: {product.get('SENSOR')}")
                logging.info(f"  Date: {product.get('DOP')}")
                logging.info(f"  Cloud Cover: {product.get('CLOUD_COVER', 'N/A')}%")
                logging.info(f"  Priced: {product.get('PRICED')}")
                logging.info(f"  Path/Row: {product.get('PATH')}/{product.get('ROW')}")
            if len(results) > 5:
                logging.info(f"\n... and {len(results) - 5} more products")
            logging.info("="*60 + "\n")
        
        # 2. Filter for direct download products and check actual availability
        if results:
            # First filter: products that are marked as directly downloadable
            direct_download_products = [p for p in results if instance.is_direct_download(p)]
            on_order_products = [p for p in results if not instance.is_direct_download(p)]
            
            logging.info(f"Found {len(direct_download_products)} products marked as DirectDownload/Open_Data")
            logging.info(f"Found {len(on_order_products)} products requiring order (skipping)")
            
            if on_order_products:
                logging.info("\nSkipped products (OnOrder):")
                for p in on_order_products[:5]:  # Show first 5
                    logging.info(f"  - {p.get('ID')} (PRICED: {p.get('PRICED')})")
                if len(on_order_products) > 5:
                    logging.info(f"  ... and {len(on_order_products) - 5} more")
            
            # Second filter: verify products are actually available on server
            if direct_download_products:
                logging.info(f"\nVerifying availability of {len(direct_download_products)} products...")
                available_products = []
                unavailable_products = []
                
                for i, product in enumerate(direct_download_products, 1):
                    product_id = product.get('ID')
                    logging.info(f"Checking {i}/{len(direct_download_products)}: {product_id}...")
                    
                    if instance.check_product_availability(product):
                        available_products.append(product)
                        logging.info(f"  ✅ Available")
                    else:
                        unavailable_products.append(product)
                        logging.warning(f"  ❌ Not available on server")
                
                logging.info(f"\n{'='*60}")
                logging.info(f"Availability Check Summary:")
                logging.info(f"  Total searched: {len(results)}")
                logging.info(f"  Marked as DirectDownload: {len(direct_download_products)}")
                logging.info(f"  Actually available: {len(available_products)}")
                logging.info(f"  Unavailable (filtered out): {len(unavailable_products)}")
                logging.info(f"  OnOrder (skipped): {len(on_order_products)}")
                logging.info(f"{'='*60}\n")
                
                if unavailable_products:
                    logging.info("Products filtered out (not actually downloadable):")
                    for p in unavailable_products:
                        logging.info(f"  - {p.get('ID')} (PRICED: {p.get('PRICED')})")
                
                # Only add verified available products to cart
                if available_products:
                    logging.info(f"\nAdding {len(available_products)} verified products to cart...")
                    added_products = []  # Store successfully added products
                    
                    for i, product in enumerate(available_products, 1):
                        logging.info(f"Adding product {i}/{len(available_products)}: {product.get('ID')}")
                        result = instance.add_order(product)
                        if result and (result.get("Results") or result.get("success")):
                            if result.get("Results"):
                                message = result.get("Results", [])[0]
                                logging.info(f"  ✅ {message}")
                            else:
                                logging.info(f"  ✅ {result.get('message', 'Added successfully')}")
                            added_products.append(product)
                        else:
                            logging.warning(f"  ⚠️  Failed to add: {result}")
                
                    logging.info(f"\nSuccessfully added {len(added_products)} products to cart")
                    
                    # Confirm cart after adding all items
                    logging.info("Confirming cart...")
                    confirm_result = instance.confirm_cart()
                    logging.info(f"Cart confirmation: {confirm_result}")
                else:
                    logging.info("No verified available products to add to cart")
                    added_products = []
            else:
                logging.info("No directly downloadable products found to add to cart")
                added_products = []
        
        # 3. Download cart items (only direct download products)
        if 'added_products' in locals() and added_products:
            cart_date = datetime.now()
            # Limit to download at most 1 product
            products_to_download = added_products[:1]
            logging.info(f"\nDownloading {len(products_to_download)} product(s) (limited to 1)...")
            downloaded_count = 0
            skipped_count = 0
            
            for i, product in enumerate(products_to_download, 1):
                product_id = product.get('ID', '')
                logging.info(f"\n--- Downloading {i}/{len(added_products)}: {product_id} ---")
                
                # Check if file already exists
                safe_filename = "".join(c for c in product_id if c.isalnum() or c in ('-', '_'))
                file_path = os.path.join(instance.download_folder, f'{safe_filename}.zip')
                
                if os.path.exists(file_path):
                    # Validate existing file
                    file_size = os.path.getsize(file_path)
                    if file_size == 0:
                        logging.warning(f"Found empty file, removing and re-downloading: {file_path}")
                        try:
                            os.remove(file_path)
                        except Exception as e:
                            logging.error(f"Failed to remove empty file: {e}")
                    else:
                        # Check ZIP signature
                        try:
                            with open(file_path, 'rb') as f:
                                header = f.read(2)
                                if header == b'PK':
                                    logging.info(f"✅ File already exists and is valid ({file_size:,} bytes): {file_path}")
                                    logging.info(f"   Skipping download...")
                                    skipped_count += 1
                                    continue
                                else:
                                    logging.warning(f"File exists but is not a valid ZIP, removing: {file_path}")
                                    os.remove(file_path)
                        except Exception as e:
                            logging.error(f"Error validating file {file_path}: {e}")
                
                # File doesn't exist or was invalid, proceed with download
                try:
                    instance.download_cart_product(product, cart_date)
                    # Check if download was successful
                    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                        downloaded_count += 1
                except Exception as e:
                    logging.error(f"Failed to download {product_id}: {str(e)}")
            
            logging.info(f"\n{'='*60}")
            logging.info(f"Download Summary:")
            logging.info(f"  Total products in cart: {len(added_products)}")
            logging.info(f"  Products attempted: {len(products_to_download)}")
            logging.info(f"  Successfully downloaded: {downloaded_count}")
            logging.info(f"  Skipped (already exist): {skipped_count}")
            logging.info(f"  Failed: {len(products_to_download) - downloaded_count - skipped_count}")
            logging.info(f"{'='*60}")
    except Exception as e:
        logging.error(f"An error occurred in main execution: {e}")
    
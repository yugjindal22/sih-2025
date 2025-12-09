#import rasterio
#import numpy as np
#from rasterio.plot import reshape_as_image
#from PIL import Image
#import os
#
# CONFIGURATION: Point this to your UNZIPPED .SAFE folder path
# Example: "data/S2A_MSIL2A_20251109...SAFE"
#SAFE_PATH = "YOUR_SAFE_FOLDER_PATH_HERE" 
#
#def find_band_path(safe_folder, band_name):
#    """Crawls the complex .SAFE structure to find the specific .jp2 band file"""
#    target_suffix = f"_{band_name}_10m.jp2"
#    for root, dirs, files in os.walk(safe_folder):
#        for file in files:
#            if file.endswith(target_suffix):
#                return os.path.join(root, file)
#    return None
#
#def process_sentinel_image(safe_path):
#    print(f"🛰️ Processing Satellite Data from: {os.path.basename(safe_path)}")
#    
#    # 1. Find the RGB Bands (Level-2A usually has them in R10m folder)
#    band_paths = {
#        'Red': find_band_path(safe_path, "B04"),
#        'Green': find_band_path(safe_path, "B03"),
#        'Blue': find_band_path(safe_path, "B02")
#    }
#    
#    # Check if we found them
#    if not all(band_paths.values()):
#        print("❌ Error: Could not find one of the RGB bands (B02, B03, B04).")
#        print(f"Found: {band_paths}")
#        return
#
#    print("✅ Found all bands. Reading data...")
#
#    # 2. Open the bands using Rasterio
#    with rasterio.open(band_paths['Red']) as src:
#        red = src.read(1)
#        profile = src.profile # Save metadata (geo-coordinates) for later
#        
#    with rasterio.open(band_paths['Green']) as src:
#        green = src.read(1)
#        
#    with rasterio.open(band_paths['Blue']) as src:
#        blue = src.read(1)
#
#    # 3. Stack into an RGB image
#    # Satellite data is typically uint16 (0-10000+), we need uint8 (0-255)
#    rgb = np.dstack((red, green, blue))
#    
#    # 4. Normalize (Basic "Level 1 to Level 2" visualization processing)
#    # We clip the top brightness to avoid washing out the image
#    print("🎨 Normalizing and converting to Image...")
#    rgb_norm = np.clip(rgb / 3000 * 255, 0, 255).astype(np.uint8)
#    
#    # 5. Save as a standard PNG that AI models can read
#    output_filename = "processed_sentinel_output.png"
#    img = Image.fromarray(rgb_norm)
#    img.save(output_filename)
#    
#    print(f"🎉 Success! Saved processed image to: {output_filename}")
#    print(f"ℹ️ This image covers 100x100km. For the AI, we will chop this later.")
#
#if __name__ == "__main__":
#    # UPDATE THIS PATH to the folder you unzipped
#    # It should look like: "/home/sarthak/Downloads/S2A_MSIL2A_2025...SAFE"
#    user_safe_path = input("Enter the full path to your .SAFE folder: ").strip().replace("'", "")
#    process_sentinel_image(user_safe_path)





import rasterio
import numpy as np
from rasterio.enums import Resampling
from PIL import Image
import os

# CONFIGURATION: Memory-Safe Factor (4 = 1/16th memory usage, 10 = 1/100th usage)
DOWNSCALE_FACTOR = 4 

def find_band_path(safe_folder, band_name):
    target_suffix = f"_{band_name}_10m.jp2"
    for root, dirs, files in os.walk(safe_folder):
        for file in files:
            if file.endswith(target_suffix):
                return os.path.join(root, file)
    return None

def process_sentinel_image(safe_path):
    print(f"🛰️ Processing Satellite Data (Low RAM Mode)...")
    
    band_paths = {
        'Red': find_band_path(safe_path, "B04"),
        'Green': find_band_path(safe_path, "B03"),
        'Blue': find_band_path(safe_path, "B02")
    }
    
    if not all(band_paths.values()):
        print("❌ Error: Missing bands.")
        return

    # Open just one file first to calculate the new smaller size
    with rasterio.open(band_paths['Red']) as src:
        # Calculate new dimensions (e.g., 10980 -> 2745 pixels)
        new_height = src.height // DOWNSCALE_FACTOR
        new_width = src.width // DOWNSCALE_FACTOR
        print(f"📉 Downscaling image from {src.width}x{src.height} to {new_width}x{new_height}")

    # Function to read efficiently
    def read_band(path):
        with rasterio.open(path) as src:
            return src.read(
                1,
                out_shape=(new_height, new_width),
                resampling=Resampling.bilinear
            )

    print("✅ Reading Red Band...")
    red = read_band(band_paths['Red'])
    
    print("✅ Reading Green Band...")
    green = read_band(band_paths['Green'])
    
    print("✅ Reading Blue Band...")
    blue = read_band(band_paths['Blue'])

    # Stack efficiently
    print("🎨 Stacking & Normalizing...")
    rgb = np.dstack((red, green, blue))
    
    # Normalize carefully to save RAM (do math in-place if possible)
    rgb = rgb.astype(np.float32) 
    np.multiply(rgb, 255.0 / 3000.0, out=rgb) # Brightness scaling
    np.clip(rgb, 0, 255, out=rgb)
    rgb = rgb.astype(np.uint8)
    
    output_filename = "processed_sentinel_output.png"
    Image.fromarray(rgb).save(output_filename)
    
    print(f"🎉 Success! Saved optimized image to: {output_filename}")

if __name__ == "__main__":
    user_safe_path = input("Enter the full path to your .SAFE folder: ").strip().replace("'", "")
    process_sentinel_image(user_safe_path)

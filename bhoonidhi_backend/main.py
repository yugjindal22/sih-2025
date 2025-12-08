    # # import os
    # # import ctypes
    # # import sys

    # # # --- PATCH: FORCE CONDA LIBRARIES (Must be first) ---
    # # try:
    # #     if "CONDA_PREFIX" in os.environ:
    # #         conda_lib_path = os.path.join(os.environ["CONDA_PREFIX"], "lib")
    # #         os.environ["LD_LIBRARY_PATH"] = f"{conda_lib_path}:{os.environ.get('LD_LIBRARY_PATH', '')}"
    # #         libstdc = os.path.join(conda_lib_path, "libstdc++.so.6")
    # #         if os.path.exists(libstdc):
    # #             ctypes.CDLL(libstdc, mode=ctypes.RTLD_GLOBAL)
    # #             print(f"✅ Patch Applied: Loaded {libstdc}")
    # # except Exception as e:
    # #     print(f"⚠️ Patch Warning: {e}")
    # # # ----------------------------------------------------

    # # from fastapi import FastAPI, UploadFile, File
    # # from fastapi.middleware.cors import CORSMiddleware
    # # from fastapi.staticfiles import StaticFiles  # Crucial for serving the map image
    # # from pydantic import BaseModel
    # # from transformers import BlipProcessor, BlipForQuestionAnswering
    # # from PIL import Image
    # # import torch
    # # import shutil

    # # # Import your processor
    # # # Ensure process_sentinel.py is in the same folder
    # # from process_sentinel import process_sentinel_image

    # # app = FastAPI(title="ISRO Conversational GIS API")

    # # # Allow Frontend Access
    # # app.add_middleware(
    # #     CORSMiddleware,
    # #     allow_origins=["*"],
    # #     allow_methods=["*"],
    # #     allow_headers=["*"],
    # # )

    # # # --- MOUNT STATIC FILES ---
    # # # This allows http://localhost:8000/static/image.png to work
    # # app.mount("/static", StaticFiles(directory="."), name="static")

    # # # --- LOAD THE LIGHTWEIGHT BRAIN (BLIP-VQA) ---
    # # print("⏳ Loading AI Brain (BLIP-VQA ~480MB)...")
    # # MODEL_ID = "Salesforce/blip-vqa-base"

    # # try:
    # #     processor = BlipProcessor.from_pretrained(MODEL_ID)
    # #     model = BlipForQuestionAnswering.from_pretrained(MODEL_ID)
    # #     print("✅ BLIP Loaded Successfully!")
    # # except Exception as e:
    # #     print(f"❌ Error loading model: {e}")
    # #     model = None

    # # # --- API ENDPOINTS ---

    # # @app.get("/")
    # # def health_check():
    # #     return {"status": "active", "model": MODEL_ID}

    # # @app.post("/upload-sentinel")
    # # async def upload_sentinel(file: UploadFile = File(...)):
    # #     """
    # #     Simulates uploading a Sentinel-2 zip file.
    # #     For the demo, we just save it and return the path to our pre-processed map.
    # #     """
    # #     temp_filename = f"temp_{file.filename}"
    # #     with open(temp_filename, "wb") as buffer:
    # #         shutil.copyfileobj(file.file, buffer)
        
    # #     # In a real app, we would unzip and run process_sentinel_image() here.
    # #     # For the demo, we point to the one you already made.
    # #     return {
    # #         "message": "File processed successfully", 
    # #         "visual_path": "static/processed_sentinel_output.png" # Correct path for static hosting
    # #     }

    # # class QueryRequest(BaseModel):
    # #     question: str

    # # @app.post("/analyze")
    # # def analyze_image(request: QueryRequest):
    # #     image_path = "processed_sentinel_output.png"
        
    # #     if model is None:
    # #         return {"response": "Error: AI Model not loaded."}
        
    # #     try:
    # #         raw_image = Image.open(image_path).convert('RGB')
            
    # #         # BLIP needs "Image + Question" to generate an answer
    # #         inputs = processor(raw_image, request.question, return_tensors="pt")
            
    # #         out = model.generate(**inputs)
    # #         answer = processor.decode(out[0], skip_special_tokens=True)
            
    # #         return {"response": answer}
            
    # #     except FileNotFoundError:
    # #         return {"response": "⚠️ System Error: No Satellite Map Found. Please upload data."}
    # #     except Exception as e:
    # #         return {"response": f"Analysis Failed: {str(e)}"}
















    # import os
    # import ctypes
    # import sys
    # import zipfile

    # # --- PATCH: FORCE CONDA LIBRARIES ---
    # try:
    #     if "CONDA_PREFIX" in os.environ:
    #         conda_lib_path = os.path.join(os.environ["CONDA_PREFIX"], "lib")
    #         os.environ["LD_LIBRARY_PATH"] = f"{conda_lib_path}:{os.environ.get('LD_LIBRARY_PATH', '')}"
    #         libstdc = os.path.join(conda_lib_path, "libstdc++.so.6")
    #         if os.path.exists(libstdc):
    #             ctypes.CDLL(libstdc, mode=ctypes.RTLD_GLOBAL)
    #             print(f"✅ Patch Applied: Loaded {libstdc}")
    # except Exception as e:
    #     print(f"⚠️ Patch Warning: {e}")
    # # ----------------------------------------------------

    # from fastapi import FastAPI, UploadFile, File, BackgroundTasks
    # from fastapi.middleware.cors import CORSMiddleware
    # from fastapi.staticfiles import StaticFiles
    # from pydantic import BaseModel
    # from transformers import BlipProcessor, BlipForQuestionAnswering
    # from PIL import Image
    # import torch
    # import shutil

    # # Import your processor logic
    # from process_sentinel import process_sentinel_image

    # app = FastAPI(title="ISRO Conversational GIS API")

    # app.add_middleware(
    #     CORSMiddleware,
    #     allow_origins=["*"],
    #     allow_methods=["*"],
    #     allow_headers=["*"],
    # )

    # # Mount static files so the frontend can see images
    # app.mount("/static", StaticFiles(directory="."), name="static")

    # # --- LOAD AI MODEL ---
    # print("⏳ Loading AI Brain (BLIP-VQA)...")
    # MODEL_ID = "Salesforce/blip-vqa-base"
    # try:
    #     processor = BlipProcessor.from_pretrained(MODEL_ID)
    #     model = BlipForQuestionAnswering.from_pretrained(MODEL_ID)
    #     print("✅ BLIP Loaded Successfully!")
    # except Exception as e:
    #     print(f"❌ Error loading model: {e}")
    #     model = None

    # # --- HELPER: UNZIP & PROCESS ---
    # def handle_uploaded_zip(zip_path, extract_to="temp_data"):
    #     """Unzips a Sentinel SAFE file and finds the right folder to process"""
    #     if os.path.exists(extract_to):
    #         shutil.rmtree(extract_to) # Clean previous upload
    #     os.makedirs(extract_to)
        
    #     print(f"📂 Unzipping {zip_path}...")
    #     with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    #         zip_ref.extractall(extract_to)
            
    #     # Find the .SAFE directory inside
    #     safe_dir = None
    #     for root, dirs, files in os.walk(extract_to):
    #         for d in dirs:
    #             if d.endswith(".SAFE"):
    #                 safe_dir = os.path.join(root, d)
    #                 break
        
    #     if safe_dir:
    #         print(f"🛰️ Found SAFE Data: {safe_dir}")
    #         # Run your existing processor on this new data
    #         process_sentinel_image(safe_dir)
    #         return True
    #     return False

    # # --- API ENDPOINTS ---

    # @app.post("/upload-sentinel")
    # async def upload_sentinel(file: UploadFile = File(...)):
    #     """
    #     Accepts a .zip file (Sentinel Product), extracts it, and processes it.
    #     """
    #     file_location = f"temp_{file.filename}"
        
    #     # 1. Save the ZIP file
    #     with open(file_location, "wb") as buffer:
    #         shutil.copyfileobj(file.file, buffer)
            
    #     # 2. Process it (Unzip -> Find Bands -> Normalize -> Save PNG)
    #     if file.filename.endswith(".zip"):
    #         success = handle_uploaded_zip(file_location)
    #         if not success:
    #             return {"error": "Invalid Zip: Could not find .SAFE folder inside."}
    #     else:
    #         return {"error": "Please upload a valid Sentinel-2 .zip file"}

    #     # 3. Cleanup
    #     os.remove(file_location)
        
    #     # The processor saves to 'processed_sentinel_output.png' by default
    #     # We append a timestamp in the frontend to force a reload
    #     return {
    #         "message": "Satellite data ingested and normalized.", 
    #         "visual_path": "static/processed_sentinel_output.png"
    #     }

    # class QueryRequest(BaseModel):
    #     question: str

    # # @app.post("/analyze")
    # # def analyze_image(request: QueryRequest):
    # #     image_path = "processed_sentinel_output.png"
        
    # #     if not os.path.exists(image_path):
    # #         return {"response": "⚠️ Error: No image found. Please upload a Sentinel-2 zip first."}

    # #     try:
    # #         raw_image = Image.open(image_path).convert('RGB')
            
    # #         # PROMPT ENGINEERING: 
    # #         # We modify the user's question slightly to get a better answer from BLIP
    # #         # If they ask "what is this", we guide the AI to be descriptive.
    # #         augmented_question = request.question
    # #         if len(request.question.split()) < 4:
    # #             augmented_question = f"detailed description of the land cover and geography in this satellite image: {request.question}"
                
    # #         inputs = processor(raw_image, augmented_question, return_tensors="pt")
            
    # #         # Generate a slightly longer answer
    # #         out = model.generate(**inputs, max_new_tokens=50)
    # #         answer = processor.decode(out[0], skip_special_tokens=True)
            
    # #         return {"response": answer}
            
    # #     except Exception as e:
    # #         return {"response": f"Analysis Failed: {str(e)}"}


    # @app.post("/analyze")
    # def analyze_image(request: QueryRequest):
    #     image_path = "processed_sentinel_output.png"
        
    #     if not os.path.exists(image_path):
    #         return {"response": "⚠️ Error: No image found. Please upload a Sentinel-2 zip first."}

    #     try:
    #         raw_image = Image.open(image_path).convert('RGB')
            
    #         # STRATEGY: Chain of Thought Prompting (Simulated)
    #         # 1. If the question is short, we ask for a caption first to prime the context.
    #         question = request.question.lower()
            
    #         if "describe" in question or "what is" in question:
    #             # Use the "Image Captioning" mode of BLIP implicitly by asking for a description
    #             final_prompt = f"a high resolution satellite image of {question.replace('describe', '').strip()}"
    #         else:
    #             # For specific questions, we add context
    #             final_prompt = f"satellite image analysis: {request.question}"

    #         inputs = processor(raw_image, final_prompt, return_tensors="pt")
            
    #         # Increase max_new_tokens to allow longer sentences
    #         out = model.generate(**inputs, max_new_tokens=60, min_length=10)
    #         answer = processor.decode(out[0], skip_special_tokens=True)
            
    #         return {"response": answer}
            
    #     except Exception as e:
    #         return {"response": f"Analysis Failed: {str(e)}"}






    import os
    import ctypes
    import sys
    import zipfile
    import numpy as np
    import json
    from dotenv import load_dotenv

    load_dotenv()

    try:
        if "CONDA_PREFIX" in os.environ:
            conda_lib_path = os.path.join(os.environ["CONDA_PREFIX"], "lib")
            os.environ["LD_LIBRARY_PATH"] = f"{conda_lib_path}:{os.environ.get('LD_LIBRARY_PATH', '')}"
            libstdc = os.path.join(conda_lib_path, "libstdc++.so.6")
            if os.path.exists(libstdc):
                ctypes.CDLL(libstdc, mode=ctypes.RTLD_GLOBAL)
                print(f"✅ Patch Applied: Loaded {libstdc}")
    except Exception as e:
        print(f"⚠️ Patch Warning: {e}")

    from fastapi import FastAPI, UploadFile, File
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel
    from transformers import BlipProcessor, BlipForQuestionAnswering
    from PIL import Image
    import shutil
    import rasterio
    from rasterio.windows import from_bounds
    from pyproj import Transformer

    from process_sentinel import process_sentinel_image

    app = FastAPI(title="ISRO Conversational GIS API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/static", StaticFiles(directory="."), name="static")

    print("⏳ Loading...")
    MODEL_ID = os.getenv("MODEL")

    try:
        processor = BlipProcessor.from_pretrained(MODEL_ID)
        model = BlipForQuestionAnswering.from_pretrained(MODEL_ID)
        print("Loaded Successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None

    CURRENT_SAFE_PATH = None

    # --- GEOSPATIAL HELPERS ---

    def find_safe_folder(extract_path):
        for root, dirs, files in os.walk(extract_path):
            for d in dirs:
                if d.endswith(".SAFE"):
                    return os.path.join(root, d)
        return None

    def get_band_path(safe_path, band_name):
        """Robustly finds bands in L1C or L2A structure"""
        target_10m = f"_{band_name}_10m.jp2"
        target_std = f"_{band_name}.jp2" # Some L1C files just use this
        
        for root, _, files in os.walk(safe_path):
            for f in files:
                if f.endswith(target_10m) or f.endswith(target_std):
                    return os.path.join(root, f)
        return None

    def get_latlon_bounds(safe_path):
        """
        Reads the raw metadata to find exactly where this satellite image is on Earth.
        Returns: [[lat_min, lon_min], [lat_max, lon_max]]
        """
        try:
            # We use Band 4 (Red) as the reference for geometry
            ref_band = get_band_path(safe_path, "B04")
            if not ref_band: return None
            
            with rasterio.open(ref_band) as src:
                # Create a transformer from Image CRS (UTM) to Map CRS (Lat/Lon)
                # src.crs is usually EPSG:32xxx (UTM), we want EPSG:4326 (Lat/Lon)
                transformer = Transformer.from_crs(src.crs, "EPSG:4326", always_xy=True)
                
                # Transform the corners
                lon_min, lat_min = transformer.transform(src.bounds.left, src.bounds.bottom)
                lon_max, lat_max = transformer.transform(src.bounds.right, src.bounds.top)
                
                return [[lat_min, lon_min], [lat_max, lon_max]]
                
        except Exception as e:
            print(f"Metadata Read Error: {e}")
            return None

    # --- ENDPOINTS ---

    @app.post("/upload-sentinel")
    async def upload_sentinel(file: UploadFile = File(...)):
        global CURRENT_SAFE_PATH
        file_location = f"temp_{file.filename}"
        extract_to = "temp_data"
        
        # 1. Save & Unzip
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        if os.path.exists(extract_to): shutil.rmtree(extract_to)
        os.makedirs(extract_to)
        
        print("Unzipping Sentinel Product...")
        with zipfile.ZipFile(file_location, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        
        CURRENT_SAFE_PATH = find_safe_folder(extract_to)
        
        if not CURRENT_SAFE_PATH:
            return {"error": "Invalid Zip. No .SAFE folder found."}
            
        # 2. Generate Preview (Full Image)
        # We run the 'process_sentinel' script you already have for the overview map
        process_sentinel_image(CURRENT_SAFE_PATH)
        
        # 3. Calculate Real World Bounds
        # This tells the frontend exactly where to zoom
        map_bounds = get_latlon_bounds(CURRENT_SAFE_PATH)
        
        os.remove(file_location)
        
        return {
            "message": "Satellite Data Ingested.", 
            "visual_path": "static/processed_sentinel_output.png",
            "bounds": map_bounds # [[19.1, 72.8], [19.2, 72.9]]
        }

    class QueryRequest(BaseModel):
        question: str
        bounds: dict = None # The visible map area

    @app.post("/analyze")
    def analyze_image(request: QueryRequest):
        global CURRENT_SAFE_PATH
        
        image_for_ai = None
        
        try:
            # STRATEGY A: High-Res Zoom Crop (Real GIS Mode)
            if request.bounds and CURRENT_SAFE_PATH:
                print("🔍 Precision Mode: Analyzing Viewport...")
                
                # 1. Parse Frontend Coordinates (Lat/Lon)
                sw = request.bounds['_southWest']
                ne = request.bounds['_northEast']
                
                # 2. Open Raw Data
                b4_path = get_band_path(CURRENT_SAFE_PATH, "B04")
                b3_path = get_band_path(CURRENT_SAFE_PATH, "B03")
                b2_path = get_band_path(CURRENT_SAFE_PATH, "B02")
                
                with rasterio.open(b4_path) as src:
                    # 3. Coordinate Conversion: Lat/Lon -> UTM (Image Coordinates)
                    transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
                    
                    # Transform bounds to Image CRS
                    left, bottom = transformer.transform(sw['lng'], sw['lat'])
                    right, top = transformer.transform(ne['lng'], ne['lat'])
                    
                    # Calculate Pixel Window
                    window = from_bounds(left, bottom, right, top, transform=src.transform)
                    
                    # 4. Safety Check: Don't crash RAM if they zoom out too far
                    if window.width * window.height > 5000 * 5000:
                        return {"response": "⚠️ Area too large for high-res analysis. Please zoom in further."}
                    
                    # 5. Read Cropped Data (Super Fast)
                    red = src.read(1, window=window)
                    with rasterio.open(b3_path) as b3: green = b3.read(1, window=window)
                    with rasterio.open(b2_path) as b2: blue = b2.read(1, window=window)
                    
                    # 6. Stack & Normalize (Same logic as process_sentinel)
                    rgb = np.dstack((red, green, blue)).astype(np.float32)
                    np.multiply(rgb, 255.0 / 3000.0, out=rgb)
                    np.clip(rgb, 0, 255, out=rgb)
                    image_for_ai = Image.fromarray(rgb.astype(np.uint8))
                    
            # STRATEGY B: Fallback to Overview Image
            if image_for_ai is None:
                image_path = "processed_sentinel_output.png"
                if os.path.exists(image_path):
                    image_for_ai = Image.open(image_path).convert('RGB')
                else:
                    return {"response": "System Error: No data loaded."}

            # --- AI INFERENCE ---
            # Now we have exactly the image the user is looking at
            
            prompt = request.question
            # Context Injection: Adding "Satellite Image" helps the model context
            if "describe" in prompt.lower():
                prompt = f"detailed description of this satellite view: {prompt}"

            inputs = processor(image_for_ai, prompt, return_tensors="pt")
            out = model.generate(**inputs, max_new_tokens=60)
            answer = processor.decode(out[0], skip_special_tokens=True)
            
            return {"response": answer}

        except Exception as e:
            print(f"Analysis Error: {e}")
            return {"response": f"Analysis Failed: {str(e)}"}
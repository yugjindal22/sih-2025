// Cloud Masking Service - Backend API Integration
// Handles API calls to the cloud masking backend endpoint for Sentinel-2 SAFE format

export interface CloudMaskRequest {
  safeZip: File; // Sentinel-2 SAFE format .zip file
  threshold?: number; // Cloud detection threshold (0-1), default 0.4
}

export interface CloudMaskResponse {
  success: boolean;
  cloud_mask: string; // Base64 PNG - Binary mask (255=cloud, 0=clear)
  cloud_prob: string; // Base64 PNG - Probability heatmap
  clean_rgb: string; // Base64 PNG - Cloud-removed RGB composite
  cloud_percent: number; // Percentage of scene masked as cloud
  processingTimeMs: number; // Processing time in milliseconds
  error?: string;
}

export interface CloudMaskConfig {
  backendUrl?: string;
  timeout?: number; // Request timeout in milliseconds
}

class CloudMaskService {
  private config: CloudMaskConfig;

  constructor(config?: CloudMaskConfig) {
    this.config = {
      backendUrl: process.env.NEXT_PUBLIC_CLOUD_MASK_API_URL || "http://localhost:8000",
      timeout: 30000, // 30 seconds default
      ...config,
    };

    // Try to load from localStorage if available (client-side)
    if (typeof window !== "undefined") {
      const savedBackendUrl = localStorage.getItem("cloud_mask_backend_url");
      if (savedBackendUrl) {
        this.config.backendUrl = savedBackendUrl;
      }
    }
  }

  /**
   * Perform cloud masking on a Sentinel-2 SAFE format file
   * @param request Cloud mask request with SAFE zip file
   * @returns Promise with cloud mask, probability map, and clean RGB
   */
  async maskClouds(request: CloudMaskRequest): Promise<CloudMaskResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!request.safeZip) {
        throw new Error("SAFE zip file is required");
      }

      // Validate file is a .zip
      if (!request.safeZip.name.endsWith('.zip')) {
        throw new Error("File must be a .zip archive");
      }

      // Validate SAFE format naming
      const safePattern = /S2[AB]_MSIL2A_\d{8}T\d{6}_N\d{4}_R\d{3}_T\w+\.SAFE\.zip/;
      if (!safePattern.test(request.safeZip.name)) {
        throw new Error(
          "Invalid SAFE format. Expected: S2A_MSIL2A_YYYYMMDDTHHMMSS_NXXXX_RXXX_TXXXXX.SAFE.zip"
        );
      }

      // Prepare FormData payload
      const formData = new FormData();
      formData.append("safe_zip", request.safeZip);
      if (request.threshold !== undefined) {
        formData.append("threshold", request.threshold.toString());
      }

      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.backendUrl}/cloud-mask`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse response
      const data = await response.json();

      // Validate response structure
      if (!data.cloud_mask || !data.cloud_prob || !data.clean_rgb) {
        throw new Error("Invalid response: missing required output images");
      }

      const processingTime = Date.now() - startTime;

      return {
        success: data.success !== false,
        cloud_mask: data.cloud_mask,
        cloud_prob: data.cloud_prob,
        clean_rgb: data.clean_rgb,
        cloud_percent: data.cloud_percent || 0,
        processingTimeMs: data.processingTimeMs || processingTime,
      };
    } catch (error: any) {
      console.error("Cloud masking error:", error);

      // Handle specific error types
      if (error.name === "AbortError") {
        throw new Error("Request timeout: Cloud masking is taking too long (>30s)");
      }

      if (error.message.includes("fetch")) {
        throw new Error(
          `Cannot connect to cloud masking service at ${this.config.backendUrl}. Please check if the backend is running.`
        );
      }

      throw error;
    }
  }

  /**
   * Batch process multiple SAFE files
   * @param requests Array of cloud mask requests
   * @returns Promise with array of responses
   */
  async maskCloudsBatch(requests: CloudMaskRequest[]): Promise<CloudMaskResponse[]> {
    try {
      const formData = new FormData();
      
      // Append all SAFE zip files
      requests.forEach((req, index) => {
        formData.append(`safe_zip_${index}`, req.safeZip);
        if (req.threshold !== undefined) {
          formData.append(`threshold_${index}`, req.threshold.toString());
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (this.config.timeout || 30000) * requests.length);

      const response = await fetch(`${this.config.backendUrl}/cloud-mask/batch`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.results || [];
    } catch (error: any) {
      console.error("Batch cloud masking error:", error);
      throw error;
    }
  }

  /**
   * Check if the backend service is available
   * @returns Promise with service status
   */
  async checkServiceHealth(): Promise<{
    available: boolean;
    version?: string;
    message?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.config.backendUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          available: true,
          version: data.version,
          message: data.message || "Service is healthy",
        };
      }

      return {
        available: false,
        message: `Service returned ${response.status}`,
      };
    } catch (error) {
      return {
        available: false,
        message: "Cannot connect to service",
      };
    }
  }

  /**
   * Update service configuration
   * @param updates Configuration updates
   */
  updateConfig(updates: Partial<CloudMaskConfig>): void {
    this.config = { ...this.config, ...updates };

    // Save to localStorage if available (client-side)
    if (typeof window !== "undefined" && updates.backendUrl) {
      localStorage.setItem("cloud_mask_backend_url", updates.backendUrl);
    }
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): CloudMaskConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const cloudMaskService = new CloudMaskService();

// Export class for testing/customization
export { CloudMaskService };

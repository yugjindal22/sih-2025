// Cloud Masking Service - Backend API Integration
// Handles API calls to the cloud masking backend endpoint

export interface CloudMaskRequest {
  image: string; // Base64 encoded image data
  format?: "base64" | "url"; // Response format preference
  threshold?: number; // Cloud detection threshold (0-1)
  metadata?: {
    filename?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface CloudMaskResponse {
  success: boolean;
  maskedImage: string; // Base64 encoded masked image
  cloudCoverage: number; // Percentage of cloud coverage detected
  processingTime: number; // Processing time in milliseconds
  maskData?: {
    cloudPixels: number;
    totalPixels: number;
    cloudPercentage: number;
  };
  metadata?: {
    originalSize: { width: number; height: number };
    maskedSize: { width: number; height: number };
    detectionMethod?: string;
  };
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
   * Perform cloud masking on an image
   * @param request Cloud mask request with image data
   * @returns Promise with masked image and metadata
   */
  async maskClouds(request: CloudMaskRequest): Promise<CloudMaskResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!request.image) {
        throw new Error("Image data is required");
      }

      // Prepare request payload
      const payload = {
        image: request.image,
        format: request.format || "base64",
        threshold: request.threshold || 0.5,
        metadata: request.metadata || {},
      };

      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.backendUrl}/cloud-mask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      if (!data.maskedImage) {
        throw new Error("Invalid response: missing masked image data");
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        maskedImage: data.maskedImage,
        cloudCoverage: data.cloudCoverage || data.cloud_coverage || 0,
        processingTime: data.processingTime || data.processing_time || processingTime,
        maskData: data.maskData || data.mask_data,
        metadata: data.metadata,
      };
    } catch (error: any) {
      console.error("Cloud masking error:", error);

      // Handle specific error types
      if (error.name === "AbortError") {
        throw new Error("Request timeout: Cloud masking is taking too long");
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
   * Batch process multiple images
   * @param requests Array of cloud mask requests
   * @returns Promise with array of responses
   */
  async maskCloudsBatch(requests: CloudMaskRequest[]): Promise<CloudMaskResponse[]> {
    try {
      const payload = {
        images: requests,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (this.config.timeout || 30000) * requests.length);

      const response = await fetch(`${this.config.backendUrl}/cloud-mask/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

/**
 * API Configuration
 * Centralized API URL management for the application
 */

function getDefaultApiUrl(): string {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }
  return 'http://localhost:8000';
}

// Use env override when provided, otherwise derive from current host in browser
export const API_URL = process.env.NEXT_PUBLIC_API_URL || getDefaultApiUrl();

// Log the API URL being used (helps with debugging)
if (typeof window !== 'undefined') {
  console.log('🔗 API URL configured:', API_URL);
}

/**
 * Get the full API endpoint URL
 * @param endpoint - The API endpoint path (e.g., '/api/companies')
 * @returns Full URL to the API endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
}

/**
 * Helper function to make API calls with error handling
 * @param endpoint - The API endpoint path
 * @param options - Fetch options
 * @returns Response data
 */
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

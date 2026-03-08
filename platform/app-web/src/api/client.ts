import type {
  CapabilitiesListResponse,
  DevicesListResponse,
  ErrorResponse,
  PlatformStatusResponse,
  PoliciesListResponse,
  TopologyResponse,
} from "./contracts";

export interface ApiClientConfig {
  baseUrl: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string = "request_failed",
    readonly requestId?: string,
    readonly details: ErrorResponse["details"] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(private readonly config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async getPlatformStatus(): Promise<PlatformStatusResponse> {
    return this.request<PlatformStatusResponse>("/api/v1/platform/status");
  }

  async getDevices(): Promise<DevicesListResponse> {
    return this.request<DevicesListResponse>("/api/v1/devices");
  }

  async getTopology(): Promise<TopologyResponse> {
    return this.request<TopologyResponse>("/api/v1/topology");
  }

  async getPolicies(): Promise<PoliciesListResponse> {
    return this.request<PoliciesListResponse>("/api/v1/policies");
  }

  async getCapabilities(): Promise<CapabilitiesListResponse> {
    return this.request<CapabilitiesListResponse>("/api/v1/capabilities");
  }

  private async request<T>(path: string): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          Accept: "application/json",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reach the backend API.";
      throw new ApiClientError(message, 0, "network_error");
    }

    const payload = (await this.tryParseJson(response)) as T | ErrorResponse | null;

    if (!response.ok) {
      if (isErrorResponse(payload)) {
        throw new ApiClientError(
          payload.message,
          response.status,
          payload.code,
          payload.request_id,
          payload.details,
        );
      }

      throw new ApiClientError(
        `Request failed with status ${response.status}.`,
        response.status,
      );
    }

    if (payload === null) {
      throw new ApiClientError(
        "Backend returned an empty response for a JSON endpoint.",
        response.status,
        "empty_response",
      );
    }

    return payload as T;
  }

  private async tryParseJson(response: Response): Promise<unknown | null> {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }
}

function isErrorResponse(payload: unknown): payload is ErrorResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return (
    "code" in payload &&
    "message" in payload &&
    "details" in payload &&
    "request_id" in payload
  );
}

function resolveAppApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_APP_API_BASE_URL?.trim();
  const browserFallbackBaseUrl = "";

  if (!configuredBaseUrl) {
    return browserFallbackBaseUrl;
  }

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  try {
    const configuredUrl = new URL(configuredBaseUrl);
    if (configuredUrl.hostname === "app-api") {
      return "";
    }
    return configuredBaseUrl;
  } catch {
    return browserFallbackBaseUrl;
  }
}

export const appApiBaseUrl = resolveAppApiBaseUrl();

export const apiClient = new ApiClient({
  baseUrl: appApiBaseUrl,
});

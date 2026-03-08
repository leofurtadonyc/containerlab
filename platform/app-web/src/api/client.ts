export interface ApiClientConfig {
  baseUrl: string;
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  async getHealth(): Promise<Response> {
    return fetch(`${this.config.baseUrl}/api/v1/health`);
  }
}

export const appApiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = new ApiClient({
  baseUrl: appApiBaseUrl,
});

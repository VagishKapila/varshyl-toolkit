import type {
  CIEClientConfig,
  EventsResponse,
  SummaryResponse,
  SearchResponse,
  SearchParams,
} from './types';

export class CIEClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: CIEClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`CIE ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async getEvents(
    projectId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<EventsResponse> {
    const params = new URLSearchParams();
    if (options?.limit)  params.set('limit',  String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const qs = params.toString() ? `?${params}` : '';
    return this.request<EventsResponse>(
      `/intelligence/events/${projectId}${qs}`
    );
  }

  async getSummary(projectId: string): Promise<SummaryResponse> {
    return this.request<SummaryResponse>(
      `/intelligence/summary/${projectId}`
    );
  }

  async search(params?: SearchParams): Promise<SearchResponse> {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v != null) as [string, string][]
    ).toString();
    return this.request<SearchResponse>(
      `/intelligence/search${qs ? `?${qs}` : ''}`
    );
  }

  async health(): Promise<{ status: string; product: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json() as Promise<{ status: string; product: string }>;
  }
}

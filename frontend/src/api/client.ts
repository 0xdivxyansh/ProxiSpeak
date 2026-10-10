export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path?: string; message: string }>;
  };
  requestId?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}

class ApiClient {
  private baseUrl: string =
    import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim().length > 0
      ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/v1`
      : '/api/v1';

  private tokenGetter: (() => Promise<string | null> | string | null) | null = null;

  setTokenGetter(getter: () => Promise<string | null> | string | null) {
    this.tokenGetter = getter;
  }

  private async getHeaders(extraHeaders?: Record<string, string>): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...extraHeaders,
    });

    if (this.tokenGetter) {
      const token = await this.tokenGetter();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = await this.getHeaders(options.headers as Record<string, string>);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    let payload: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      const errPayload = payload as ApiErrorResponse;
      const message =
        errPayload?.error?.message ||
        (typeof payload === 'string' && payload) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      const error = new Error(message) as Error & {
        code?: string;
        details?: unknown;
        status: number;
      };
      error.code = errPayload?.error?.code || 'UNKNOWN_ERROR';
      error.details = errPayload?.error?.details;
      error.status = response.status;
      throw error;
    }

    const successPayload = payload as ApiSuccessResponse<T>;
    return successPayload.data;
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export interface JobMessageMetadata {
  /** NATS pattern that must be invoked when processing the job */
  pattern: string;

  /** Event that the microservice will emit once the task is completed */
  completionEvent: string;
}

export interface JobData {
  /** Unique job identifier */
  id: string;

  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;

  /** Request URL path (without query string) */
  url: string;

  /** Original URL including query string */
  rawUrl: string;

  /** Request payload data (body for POST/PUT, query params for GET, etc.) */
  data?: any;

  /** Query parameters from URL (if any) */
  queryParams?: Record<string, any>;

  /** Route parameters extracted from the URL */
  params?: Record<string, any>;

  /** Essential headers for request reconstruction */
  headers: Record<string, string>;

  /** Extracted user ID from JWT token (if available) */
  userId?: string;

  /** Timestamp when the job was created */
  timestamp: number;

  /** IP address of the client (for logging/security) */
  clientIp?: string;

  /** Additional contextual data captured from the HTTP request */
  context?: Record<string, any>;

  /** Message metadata required to dispatch the job to the corresponding microservice */
  message?: JobMessageMetadata;

  /** Payload that will be sent to the microservice */
  payload?: any;
}

export interface QueueResponse {
  /** Unique job identifier for tracking */
  jobId: string;

  /** Current status of the job */
  status: 'queued' | 'processing' | 'completed' | 'failed';

  /** Estimated processing time */
  estimatedTime: string;

  /** URL to check job status */
  checkStatusUrl: string;

  /** Type of queue where job was placed */
  queueType: 'critical' | 'standard' | 'background';

  /** Timestamp of response */
  timestamp: string;

  /** Additional metadata */
  metadata?: {
    priority?: number;
    retryCount?: number;
    timeout?: number;
  };
}

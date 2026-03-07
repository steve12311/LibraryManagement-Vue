import type { InternalAxiosRequestConfig } from "axios";

export interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _skipAuthRefresh?: boolean;
}

export type HttpRequestExecutor = (config: RetryRequestConfig) => Promise<unknown>;

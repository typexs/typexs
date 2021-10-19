export interface IPullableQueueOptions {
  error_retries?: number;
  error_timeout?: number;
  min_flush_queue?: number;
  concurrency?: number;
  fetch_limit?: number;

  /**
   * Keep queue alive on empty. Values can be added manually.
   */
  keepAlive?: boolean;
}

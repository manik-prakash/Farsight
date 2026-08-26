export interface Env {
  TOKENS: DurableObjectNamespace;
  BLOBS: R2Bucket;
  UPLOAD_LIMITER: RateLimit;
}

declare module 'ali-oss' {
  interface OSSOptions {
    region?: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint?: string;
    internal?: boolean;
    secure?: boolean;
    timeout?: number;
    cname?: boolean;
    isRequestPay?: boolean;
    [key: string]: unknown;
  }

  interface SignatureUrlOptions {
    method?: string;
    expires?: number;
    'Content-Type'?: string;
    response?: Record<string, string>;
    [key: string]: unknown;
  }

  class OSS {
    constructor(options: OSSOptions);
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
    delete(name: string, options?: Record<string, unknown>): Promise<unknown>;
    put(name: string, file: Buffer | string | ReadableStream, options?: Record<string, unknown>): Promise<unknown>;
    get(name: string, options?: Record<string, unknown>): Promise<{ content: Buffer; res: unknown }>;
    head(name: string, options?: Record<string, unknown>): Promise<unknown>;
    list(query: Record<string, unknown> | null, options?: Record<string, unknown>): Promise<unknown>;
  }

  export = OSS;
}

// Polyfills for browser environment
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {} };
  (window as any).Buffer = {
    from: (str: string) => new TextEncoder().encode(str),
    byteLength: (str: string) => new TextEncoder().encode(str).length,
    isBuffer: () => false,
    alloc: () => new Uint8Array(),
    allocUnsafe: () => new Uint8Array(),
    toString: () => ''
  };
}
export class ExecutionCache<TInputs extends Array<unknown>, TOutput> {
  constructor(private readonly handler: (...args: TInputs) => Promise<TOutput>) {}
  
  async fire(key: string, ...args: TInputs): Promise<TOutput> {
    if (!('_cache' in this)) {
      Object.defineProperty(this, '_cache', {
        value: new Map<string, Promise<TOutput>>(),
        configurable: false,
        enumerable: false,
        writable: false,
      });
    }

    // @ts-ignore - internal cache
    const cache: Map<string, Promise<TOutput>> = (this as any)._cache;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = (async () => this.handler(...args))();
    cache.set(key, promise);

    // remove chaching on failure 
    promise.catch(() => {
      cache.delete(key);
    });

    return promise;
  }
}

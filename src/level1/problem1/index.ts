export type Value = string | number | boolean | null | undefined |
  Date | Buffer | Map<unknown, unknown> | Set<unknown> |
  Array<Value> | { [key: string]: Value };

/**
 * Transforms JavaScript scalars and objects into JSON
 * compatible objects.
 */
export function serialize(value: Value): unknown {
  if (value === null) return null;

  const t = typeof value;
  switch (t) {
    case 'string':
    case 'number':
    case 'boolean':
      return value;
    case 'undefined':
      return undefined;
    case 'object': {
      // determine object kind
      const kind = ((): 'Date' | 'Buffer' | 'Map' | 'Set' | 'Array' | 'Plain' => {
        if (value instanceof Date) return 'Date';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof Buffer !== 'undefined' && (Buffer as any).isBuffer && (Buffer as any).isBuffer(value)) return 'Buffer';
        if (value instanceof Map) return 'Map';
        if (value instanceof Set) return 'Set';
        if (Array.isArray(value)) return 'Array';
        return 'Plain';
      })();

      switch (kind) {
        case 'Date':
          return { __t: 'Date', __v: (value as Date).getTime() };
        case 'Buffer':
          return { __t: 'Buffer', __v: Array.from(value as Buffer) };
        case 'Map': {
          const entries: unknown[] = [];
          for (const [k, v] of (value as Map<unknown, unknown>).entries()) {
            entries.push([serialize(k as Value), serialize(v as Value)]);
          }
          return { __t: 'Map', __v: entries };
        }
        case 'Set':
          return { __t: 'Set', __v: Array.from(value as Set<unknown>).map((v) => serialize(v as Value)) };
        case 'Array':
          return (value as unknown[]).map((v) => serialize(v as Value));
        case 'Plain': {
          const out: { [k: string]: unknown } = {};
          for (const key of Object.keys(value as { [k: string]: Value })) {
            const v = (value as { [k: string]: Value })[key];
            out[key] = serialize(v as Value);
          }
          return out;
        }
      }
    }
    default:
      return value as unknown;
  }
}

/**
 * Transforms JSON compatible scalars and objects into JavaScript
 * scalar and objects.
 */
export function deserialize<T = unknown>(value: unknown): T {
  if (value === null) return null as unknown as T;

  const t = typeof value;
  switch (t) {
    case 'string':
    case 'number':
    case 'boolean':
      return value as unknown as T;
    case 'undefined':
      return undefined as unknown as T;
    case 'object': {
      if (Array.isArray(value)) return (value as unknown[]).map((v) => deserialize(v)) as unknown as T;

      const obj = value as { [k: string]: unknown };
      if ('__t' in obj && typeof obj.__t === 'string') {
        switch (obj.__t) {
          case 'Date':
            return (new Date(obj.__v as number) as unknown) as T;
          case 'Buffer':
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (typeof Buffer !== 'undefined' ? Buffer.from(obj.__v as number[]) : obj.__v) as unknown as T;
          case 'Map': {
            const m = new Map();
            const entries = obj.__v as unknown[];
            for (const e of entries) {
              if (Array.isArray(e) && e.length === 2) {
                const k = deserialize(e[0]);
                const v = deserialize(e[1]);
                m.set(k, v);
              }
            }
            return m as unknown as T;
          }
          case 'Set': {
            const arr = (obj.__v as unknown[]).map((v) => deserialize(v));
            return (new Set(arr) as unknown) as T;
          }
          default:
            break;
        }
      }

      const out: { [k: string]: unknown } = {};
      for (const key of Object.keys(obj)) {
        out[key] = deserialize(obj[key]);
      }
      return out as unknown as T;
    }
    default:
      return value as unknown as T;
  }
}

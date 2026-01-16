export class ObjectId {
  private data: Buffer;
  private static readonly RANDOM: Buffer = (() => {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32BE(Math.floor(Math.random() * 0x100000000), 0);
    return buf;
  })();

  private static counter: number = Math.floor(Math.random() * 0x1000000);

  constructor(type: number, timestamp: number) {
    this.data = Buffer.allocUnsafe(14);

    this.data[0] = type & 0xff;

    for (let i = 0; i < 6; i++) {
      const shiftBytes = 5 - i;
      const byte = Math.floor(timestamp / Math.pow(256, shiftBytes)) % 256;
      this.data[1 + i] = byte;
    }

  
    ObjectId.RANDOM.copy(this.data, 7);

    const cnt = ObjectId.counter & 0xffffff;
    this.data[11] = (cnt >> 16) & 0xff;
    this.data[12] = (cnt >> 8) & 0xff;
    this.data[13] = cnt & 0xff;
    ObjectId.counter = (ObjectId.counter + 1) & 0xffffff;
  }

  static generate(type?: number): ObjectId {
    return new ObjectId(type ?? 0, Date.now());
  }
  
  toString(encoding?: 'hex' | 'base64'): string {
    return this.data.toString(encoding ?? 'hex');
  }
}
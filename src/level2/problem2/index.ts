export type DowntimeLogs = [Date, Date][];

export function merge(...args: DowntimeLogs[]): DowntimeLogs {
  const all: DowntimeLogs = ([] as DowntimeLogs).concat(...args);
  if (all.length === 0) return [];

  const sorted = all.slice().sort((a, b) => a[0].getTime() - b[0].getTime());

  const result: DowntimeLogs = [];

  for (const [start, end] of sorted) {
    if (result.length === 0) {
      result.push([new Date(start.getTime()), new Date(end.getTime())]);
      continue;
    }

    const last = result[result.length - 1];
    const lastEnd = last[1].getTime();
    const curStart = start.getTime();
    const curEnd = end.getTime();

    if (curStart <= lastEnd) {
      // overlap -> extend end if needed
      if (curEnd > lastEnd) {
        last[1] = new Date(curEnd);
      }
    } else {
      result.push([new Date(curStart), new Date(curEnd)]);
    }
  }

  return result;
}
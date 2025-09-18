export function splitIntoChunks(input: string, target = 800, overlap = 200) {
  const words = input.split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += (target - overlap)) {
    const slice = words.slice(i, i + target).join(' ').trim();
    if (slice) out.push(slice);
  }
  return out;
}

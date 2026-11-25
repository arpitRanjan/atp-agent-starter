// Dollars per million tokens, from Anthropic's price list.
// Cached input is read at about a tenth of the input price; writing to the cache costs a quarter more.
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

export type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

export function costUsd(model: string, u: Usage): number {
  const p = PRICES[model] ?? PRICES["claude-sonnet-5-5"];
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const dollars =
    u.input_tokens * p.input +
    cacheRead * p.input * 0.1 +
    cacheWrite * p.input * 1.25 +
    u.output_tokens * p.output;
  return dollars / 1_000_000;
}

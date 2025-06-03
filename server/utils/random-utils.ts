export function pickRandom(min: number, max: number): number {
  if (min >= max) {
    throw new Error("Min must be less than max");
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
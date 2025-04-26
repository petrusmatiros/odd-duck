export function hsl(h: number, s: number, l: number, a: number): string {
	return `hsl(${h} ${s}% ${l}% / ${a})`;
}

/** Unisce classi Tailwind senza dipendenze extra. */
export function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

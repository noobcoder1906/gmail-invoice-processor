import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function cleanOcrText(text: string): string {
  return text
    .replace(/\n{2,}/g, "\n") // collapse multiple newlines
    .replace(/[^\x20-\x7E\n]+/g, "") // remove non-printable characters
    .trim()
}


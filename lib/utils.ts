import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to your utils.ts file if it doesn't exist already
export function cleanOcrText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII characters
    .trim();
}

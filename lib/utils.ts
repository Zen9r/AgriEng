import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Arabic pluralization utility function
 * Implements standard Arabic pluralization rules
 */
export function getArabicPlural(
  count: number,
  forms: {
    singular: string;    // 1 item
    dual: string;        // 2 items
    plural: string;      // 3-10 items
    accusative: string;  // 11+ items
  }
): string {
  if (count === 1) {
    return `1 ${forms.singular}`;
  } else if (count === 2) {
    return `2 ${forms.dual}`;
  } else if (count >= 3 && count <= 10) {
    return `${count} ${forms.plural}`;
  } else {
    return `${count} ${forms.accusative}`;
  }
}

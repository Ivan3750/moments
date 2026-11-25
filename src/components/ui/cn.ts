import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names; later Tailwind utilities override earlier conflicting ones. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

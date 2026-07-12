/** Joins class names, skipping anything falsy. Saves pulling in `clsx`. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

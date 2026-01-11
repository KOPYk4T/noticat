import { useEffect, type RefObject } from "react";

export const useClickOutside = <T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  isActive: boolean = true
) => {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, handler, isActive]);
};

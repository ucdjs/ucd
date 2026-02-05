import { useCallback, useEffect, useState } from "react";

export interface UseCommandPaletteOptions {
  /**
   * Initial open state (default: false)
   */

  initialOpen?: boolean;

  /**
   * Keyboard shortcut to open palette (default: "k")
   */

  shortcut?: string;
}

export interface UseCommandPaletteReturn {
  /**
   * Whether the palette is open
   */

  isOpen: boolean;

  /**
   * Search query
   */

  query: string;

  /**
   * Set the search query
   */

  setQuery: (query: string) => void;

  /**
   * Open the palette
   */

  open: () => void;

  /**
   * Close the palette
   */

  close: () => void;

  /**
   * Toggle the palette
   */

  toggle: () => void;
}

export function useCommandPalette(
  options: UseCommandPaletteOptions = {},
): UseCommandPaletteReturn {
  const { initialOpen = false, shortcut = "k" } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [query, setQuery] = useState("");

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === shortcut) {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape" && isOpen) {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, isOpen, toggle, close]);

  return {
    isOpen,
    query,
    setQuery,
    open,
    close,
    toggle,
  };
}

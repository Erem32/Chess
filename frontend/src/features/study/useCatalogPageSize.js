import { useCallback, useEffect, useState } from "react";

// Match the catalog card height and gap in LessonsPage.css.
export function useCatalogPageSize() {
  const [container, setContainer] = useState(null);
  const [pageSize, setPageSize] = useState(1);
  const ref = useCallback((node) => setContainer(node), []);

  useEffect(() => {
    if (!container) return;
    function measure() {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const height = container.clientHeight;
      const columns = window.innerWidth <= 700 ? 1 : window.innerWidth <= 900 ? 2 : window.innerWidth < 1500 ? 3 : 4;
      const cardHeight = window.innerHeight <= 650 ? 4.5 : 6;
      const rows = Math.max(1, Math.floor((height + 0.65 * rem) / ((cardHeight + 0.65) * rem)));
      setPageSize(columns * rows);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [container]);
  return [ref, pageSize];
}

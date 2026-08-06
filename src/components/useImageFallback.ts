import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an <img> failed to load.
 *
 * Markup is server-rendered, so an image can finish failing before React
 * hydrates — too early for a React `onError` prop to ever see it. Checking the
 * element after paint catches that case, and a native listener covers failures
 * that land afterwards.
 */
export function useImageFallback() {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;

    if (img.complete && img.naturalWidth === 0) {
      setFailed(true);
      return;
    }

    const onError = () => setFailed(true);
    img.addEventListener("error", onError);
    return () => img.removeEventListener("error", onError);
  }, []);

  return { failed, imgProps: { ref } };
}

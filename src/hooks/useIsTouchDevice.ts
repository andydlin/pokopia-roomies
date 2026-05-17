import { useEffect, useState } from "react";

export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(hover: none)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isTouch;
};

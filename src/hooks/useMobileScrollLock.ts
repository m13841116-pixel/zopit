import { useEffect } from "react";

/**
 * A custom hook to lock the body scroll on mobile devices when a modal, drawer, or dropdown is open.
 * @param isLocked Whether the scroll should currently be locked.
 */
export function useMobileScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobileAndToggle = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && isLocked) {
        document.body.classList.add("overflow-hidden", "mobile-scroll-lock");
      } else {
        document.body.classList.remove("overflow-hidden", "mobile-scroll-lock");
      }
    };

    checkMobileAndToggle();

    window.addEventListener("resize", checkMobileAndToggle);

    return () => {
      document.body.classList.remove("overflow-hidden", "mobile-scroll-lock");
      window.removeEventListener("resize", checkMobileAndToggle);
    };
  }, [isLocked]);
}

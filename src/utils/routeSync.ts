import { useEffect, useState, useCallback, useRef } from 'react';

export function useSyncTabWithUrl(
  baseUrl: string,
  activeTab: string,
  setActiveTab: (tab: string) => void,
  defaultTab: string = 'overview',
  validTabs?: string[]
) {
  const isFirstMount = useRef(true);

  // 1. Initial Validation / Normalization on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith(baseUrl)) {
        const urlTab = currentPath.replace(baseUrl, '').replace(/^\//, '');
        if (urlTab) {
          if (validTabs && validTabs.length > 0 && !validTabs.includes(urlTab)) {
            // Invalid tab -> fallback to defaultTab and fix URL
            setActiveTab(defaultTab);
            const fallbackUrl = `${baseUrl}/${defaultTab}${window.location.search}`;
            window.history.replaceState(null, '', fallbackUrl);
          } else {
            setActiveTab(urlTab);
          }
        }
      }
    }
  }, [baseUrl, defaultTab, setActiveTab, validTabs]);

  // 2. Sync React State -> Browser URL & Scroll to Top smoothly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith(baseUrl) || window.location.pathname === '/') {
        const cleanActiveTab = activeTab || defaultTab;
        const newUrl = `${baseUrl}/${cleanActiveTab}${window.location.search}`;
        
        if (window.location.pathname !== `${baseUrl}/${cleanActiveTab}`) {
          window.history.pushState(null, '', newUrl);
        }
      }

      // Auto scroll to top of page/main container on tab change (skip initial mount if already at top)
      if (!isFirstMount.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainScroll = document.querySelector('main') || document.getElementById('dashboard-main-content');
        if (mainScroll) {
          mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        isFirstMount.current = false;
      }
    }
  }, [activeTab, baseUrl, defaultTab]);

  // 3. Sync Browser URL -> React State (on back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith(baseUrl)) {
        const urlTab = currentPath.replace(baseUrl, '').replace(/^\//, '');
        const targetTab = urlTab || defaultTab;
        if (validTabs && validTabs.length > 0 && !validTabs.includes(targetTab)) {
          setActiveTab(defaultTab);
        } else {
          setActiveTab(targetTab);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [baseUrl, setActiveTab, defaultTab, validTabs]);
}

/**
 * Syncs a piece of state with a URL query parameter (e.g. ?tab=orders or ?search=term).
 * Returns the state and setter, similar to useState.
 */
export function useUrlQueryState<T extends string>(
  key: string,
  defaultValue: T
): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (params.get(key) as T) || defaultValue;
    }
    return defaultValue;
  });

  const setUrlValue = useCallback((newValue: T) => {
    setValue(newValue);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (newValue === defaultValue || !newValue) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }
      
      const newSearch = params.toString();
      const newUrl = newSearch 
        ? `${window.location.pathname}?${newSearch}` 
        : window.location.pathname;
        
      window.history.replaceState(null, '', newUrl);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setValue((params.get(key) as T) || defaultValue);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [key, defaultValue]);

  return [value, setUrlValue];
}

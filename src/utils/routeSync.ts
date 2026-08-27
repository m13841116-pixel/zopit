import { useEffect, useState, useCallback } from 'react';

export function useSyncTabWithUrl(
  baseUrl: string,
  activeTab: string,
  setActiveTab: (tab: string) => void,
  defaultTab: string = 'overview'
) {
  // 1. Sync React State -> Browser URL
  useEffect(() => {
    // We only update URL if we are actively matching the base path
    if (window.location.pathname.startsWith(baseUrl) || window.location.pathname === '/') {
      const cleanActiveTab = activeTab === defaultTab ? '' : activeTab;
      const newUrl = cleanActiveTab ? `${baseUrl}/${cleanActiveTab}${window.location.search}` : `${baseUrl}${window.location.search}`;
      
      if (window.location.pathname !== (cleanActiveTab ? `${baseUrl}/${cleanActiveTab}` : baseUrl)) {
        window.history.pushState(null, '', newUrl);
      }
    }
  }, [activeTab, baseUrl, defaultTab]);

  // 2. Sync Browser URL -> React State (on back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith(baseUrl)) {
        const urlTab = currentPath.replace(baseUrl, '').replace(/^\//, '');
        setActiveTab(urlTab || defaultTab);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [baseUrl, setActiveTab, defaultTab]);
}

/**
 * Syncs a piece of state with a URL query parameter (e.g. ?tab=orders).
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
      if (newValue === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }
      
      const newSearch = params.toString();
      const newUrl = newSearch 
        ? `${window.location.pathname}?${newSearch}` 
        : window.location.pathname;
        
      window.history.pushState(null, '', newUrl);
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

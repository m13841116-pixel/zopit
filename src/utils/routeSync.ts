import { useEffect } from 'react';

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
      const newUrl = cleanActiveTab ? `${baseUrl}/${cleanActiveTab}` : baseUrl;
      
      if (window.location.pathname !== newUrl) {
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

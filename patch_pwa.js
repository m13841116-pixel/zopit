const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const pwaLogic = `
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };
`;

if (!appContent.includes('const handleInstallClick')) {
  appContent = appContent.replace(
    /const \[loginPublicAnnouncementsOpen, setLoginPublicAnnouncementsOpen\] = useState\(false\);/,
    `const [loginPublicAnnouncementsOpen, setLoginPublicAnnouncementsOpen] = useState(false);${pwaLogic}`
  );
}

const installButton = `
                      {isInstallable && (
                        <button
                          type="button"
                          onClick={handleInstallClick}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-xs font-black transition-all cursor-pointer mr-2"
                          title="نصب اپلیکیشن زوپیت"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          <span>نصب اپلیکیشن</span>
                        </button>
                      )}
`;

if (!appContent.includes('handleInstallClick}')) {
  appContent = appContent.replace(
    /<span>اطلاعیه‌های عمومی<\/span>\s*<\/button>/,
    `<span>اطلاعیه‌های عمومی</span>\n                      </button>\n${installButton}`
  );
}

fs.writeFileSync('src/App.tsx', appContent, 'utf8');
console.log('PWA Install logic added.');

const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const pwaLogic = `  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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
  };`;

content = content.replace(pwaLogic, '');
// Also change the button I added to use `handleInstallPwa`
content = content.replace('onClick={handleInstallClick}', 'onClick={handleInstallPwa}');
content = content.replace('{isInstallable && (', '{(!isAppInstalled) && ('); // use original flag

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed PWA duplicates');

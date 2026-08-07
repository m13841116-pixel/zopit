import React, { useEffect } from "react";

interface CustomCodeInjectorProps {
  sysConfig: Record<string, any>;
}

export const CustomCodeInjector: React.FC<CustomCodeInjectorProps> = ({ sysConfig }) => {
  useEffect(() => {
    if (!sysConfig) return;

    // 1. Inject Custom CSS
    const customCss = sysConfig.CUSTOM_CSS_CODE;
    if (customCss && typeof customCss === "string" && customCss.trim()) {
      let styleEl = document.getElementById("Zopit-custom-css");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "Zopit-custom-css";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = customCss;
    }

    // 2. Inject Custom Header Code (HTML / Scripts / Styles)
    const headerCode = sysConfig.CUSTOM_CODE_HEADER;
    if (headerCode && typeof headerCode === "string" && headerCode.trim() && !headerCode.includes("کدهای فرانت‌اند هدر")) {
      let headerContainer = document.getElementById("Zopit-custom-header-container");
      if (!headerContainer) {
        headerContainer = document.createElement("div");
        headerContainer.id = "Zopit-custom-header-container";
        document.head.appendChild(headerContainer);
      }
      headerContainer.innerHTML = headerCode;
      // Execute any inline scripts in headerCode
      const scripts = headerContainer.getElementsByTagName("script");
      Array.from(scripts).forEach((script) => {
        const newScript = document.createElement("script");
        Array.from(script.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(script.innerHTML));
        script.parentNode?.replaceChild(newScript, script);
      });
    }

    // 3. Inject Custom Footer Code
    const footerCode = sysConfig.CUSTOM_CODE_FOOTER;
    if (footerCode && typeof footerCode === "string" && footerCode.trim() && !footerCode.includes("کدهای اسکریپت فوتر")) {
      let footerContainer = document.getElementById("Zopit-custom-footer-container");
      if (!footerContainer) {
        footerContainer = document.createElement("div");
        footerContainer.id = "Zopit-custom-footer-container";
        document.body.appendChild(footerContainer);
      }
      footerContainer.innerHTML = footerCode;
      const scripts = footerContainer.getElementsByTagName("script");
      Array.from(scripts).forEach((script) => {
        const newScript = document.createElement("script");
        Array.from(script.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(script.innerHTML));
        script.parentNode?.replaceChild(newScript, script);
      });
    }

    // 4. Inject Custom JS Code
    const customJs = sysConfig.CUSTOM_JS_CODE;
    if (customJs && typeof customJs === "string" && customJs.trim()) {
      try {
        let scriptEl = document.getElementById("Zopit-custom-js") as HTMLScriptElement | null;
        if (!scriptEl) {
          scriptEl = document.createElement("script");
          scriptEl.id = "Zopit-custom-js";
          document.body.appendChild(scriptEl);
        }
        scriptEl.textContent = customJs;
      } catch (e) {
        console.error("Error executing custom JS code from settings:", e);
      }
    }

    // 5. Inject Auto-Injected Files
    let injectedFiles: any[] = [];
    try {
      if (typeof sysConfig.CUSTOM_INJECTED_FILES === "string") {
        injectedFiles = JSON.parse(sysConfig.CUSTOM_INJECTED_FILES);
      } else if (Array.isArray(sysConfig.CUSTOM_INJECTED_FILES)) {
        injectedFiles = sysConfig.CUSTOM_INJECTED_FILES;
      }
    } catch {
      injectedFiles = [];
    }

    if (Array.isArray(injectedFiles) && injectedFiles.length > 0) {
      injectedFiles.forEach((file) => {
        if (!file || !file.data) return;
        const elemId = `Zopit-injected-file-${file.id}`;
        if (document.getElementById(elemId)) return;

        if (file.type === "css" && file.isText) {
          const styleEl = document.createElement("style");
          styleEl.id = elemId;
          styleEl.textContent = file.data;
          document.head.appendChild(styleEl);
        } else if (file.type === "js" && file.isText) {
          const scriptEl = document.createElement("script");
          scriptEl.id = elemId;
          scriptEl.textContent = file.data;
          document.body.appendChild(scriptEl);
        }
      });
    }
  }, [sysConfig]);

  return null;
};

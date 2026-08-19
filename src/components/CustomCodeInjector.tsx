import React, { useEffect } from "react";

interface CustomCodeInjectorProps {
  sysConfig: Record<string, any>;
}

// Safely execute custom script code with syntax validation and runtime error boundaries
function safeExecuteScript(code: string, sourceName = "CustomScript") {
  if (!code || !code.trim()) return;
  try {
    // 1. Syntax check before running
    new Function(code);
    // 2. Execute safely
    const fn = new Function(`try { ${code} } catch(err) { console.warn("[${sourceName} Runtime Error]:", err); }`);
    fn();
  } catch (syntaxError) {
    console.warn(`[${sourceName} Syntax Error - Ignored]:`, syntaxError);
  }
}

export const CustomCodeInjector: React.FC<CustomCodeInjectorProps> = ({ sysConfig }) => {
  useEffect(() => {
    if (!sysConfig) return;

    // 1. Inject Custom CSS
    const customCss = sysConfig.CUSTOM_CSS_CODE;
    if (customCss && typeof customCss === "string" && customCss.trim()) {
      try {
        let styleEl = document.getElementById("Zopit-custom-css");
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "Zopit-custom-css";
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = customCss;
      } catch (e) {
        console.warn("Error injecting custom CSS:", e);
      }
    }

    // 2. Inject Custom Header Code (HTML / Scripts / Styles)
    const headerCode = sysConfig.CUSTOM_CODE_HEADER;
    if (headerCode && typeof headerCode === "string" && headerCode.trim() && !headerCode.includes("کدهای فرانت‌اند هدر")) {
      try {
        let headerContainer = document.getElementById("Zopit-custom-header-container");
        if (!headerContainer) {
          headerContainer = document.createElement("div");
          headerContainer.id = "Zopit-custom-header-container";
          document.head.appendChild(headerContainer);
        }
        headerContainer.innerHTML = headerCode;
        // Execute any inline scripts in headerCode safely
        const scripts = headerContainer.getElementsByTagName("script");
        Array.from(scripts).forEach((script) => {
          if (script.src) {
            const newScript = document.createElement("script");
            Array.from(script.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            script.parentNode?.replaceChild(newScript, script);
          } else if (script.innerHTML && script.innerHTML.trim()) {
            safeExecuteScript(script.innerHTML, "CustomHeaderScript");
          }
        });
      } catch (e) {
        console.warn("Error processing custom header code:", e);
      }
    }

    // 3. Inject Custom Footer Code
    const footerCode = sysConfig.CUSTOM_CODE_FOOTER;
    if (footerCode && typeof footerCode === "string" && footerCode.trim() && !footerCode.includes("کدهای اسکریپت فوتر")) {
      try {
        let footerContainer = document.getElementById("Zopit-custom-footer-container");
        if (!footerContainer) {
          footerContainer = document.createElement("div");
          footerContainer.id = "Zopit-custom-footer-container";
          document.body.appendChild(footerContainer);
        }
        footerContainer.innerHTML = footerCode;
        const scripts = footerContainer.getElementsByTagName("script");
        Array.from(scripts).forEach((script) => {
          if (script.src) {
            const newScript = document.createElement("script");
            Array.from(script.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            script.parentNode?.replaceChild(newScript, script);
          } else if (script.innerHTML && script.innerHTML.trim()) {
            safeExecuteScript(script.innerHTML, "CustomFooterScript");
          }
        });
      } catch (e) {
        console.warn("Error processing custom footer code:", e);
      }
    }

    // 4. Inject Custom JS Code
    const customJs = sysConfig.CUSTOM_JS_CODE;
    if (customJs && typeof customJs === "string" && customJs.trim()) {
      safeExecuteScript(customJs, "CustomJSSetting");
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
          try {
            const styleEl = document.createElement("style");
            styleEl.id = elemId;
            styleEl.textContent = file.data;
            document.head.appendChild(styleEl);
          } catch (e) {
            console.warn(`Error injecting custom CSS file ${file.name || file.id}:`, e);
          }
        } else if (file.type === "js" && file.isText) {
          safeExecuteScript(file.data, `InjectedJSFile-${file.name || file.id}`);
        }
      });
    }
  }, [sysConfig]);

  return null;
};


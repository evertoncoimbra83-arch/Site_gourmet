import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BUILD_INFO } from "@/build-info";

export interface VersionInfo {
  version: string;
  commit: string;
  builtAt: string;
}

export function useAppVersionChecker() {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);
  const location = useLocation();

  const isDev = import.meta.env.DEV;
  const isVersionCheckEnabled =
    import.meta.env.PROD || import.meta.env.VITE_ENABLE_VERSION_CHECK === "true";

  const isCheckoutRoute = [
    "/carrinho",
    "/checkout",
    "/finalizar-pedido",
    "/success",
    "/sucesso",
    "/pagamento"
  ].some((path) => location.pathname.toLowerCase().startsWith(path));

  const checkVersion = async () => {
    if (!isVersionCheckEnabled) {
      if (isDev) {
        console.log("[useAppVersionChecker] Auto-check desabilitado localmente (desenvolvimento).");
      }
      return;
    }

    try {
      const res = await fetch("/version.json", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as VersionInfo;

      const localVersionId = BUILD_INFO.commit || BUILD_INFO.builtAt;
      const latestVersionId = data.commit || data.builtAt;

      // Compare versionId (commit || builtAt)
      if (latestVersionId && latestVersionId !== localVersionId) {
        if (isDev) {
          console.log(`[useAppVersionChecker] Nova versão detectada: local=${localVersionId}, latest=${latestVersionId}`);
        }
        setHasNewVersion(true);
        setLatestVersion(data);
      }
    } catch (err) {
      console.error("Erro ao verificar versão:", err);
    }
  };

  useEffect(() => {
    if (!isVersionCheckEnabled) return;

    // Check version immediately on mount
    checkVersion();

    // Check periodically every 2 minutes (120000ms)
    const interval = setInterval(checkVersion, 120000);

    return () => clearInterval(interval);
  }, [isVersionCheckEnabled]);

  const updateVersion = () => {
    window.location.reload();
  };

  return {
    hasNewVersion: isVersionCheckEnabled ? hasNewVersion : false,
    latestVersion,
    isCheckoutRoute,
    updateVersion,
    currentVersion: BUILD_INFO,
  };
}

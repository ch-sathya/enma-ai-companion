import { useState, useEffect, ReactNode } from "react";
import { 
  AppConfigContext, 
  AppConfig, 
  detectAppMode, 
  getAppConfig 
} from "@/config/appConfig";
import { toast } from "sonner";

interface AppConfigProviderProps {
  children: ReactNode;
}

export const AppConfigProvider = ({ children }: AppConfigProviderProps) => {
  const [config, setConfig] = useState<AppConfig>(() => getAppConfig("demo"));
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMode = async () => {
      try {
        const mode = await detectAppMode();
        const newConfig = getAppConfig(mode);
        setConfig(newConfig);
        
        // Show toast only on first load
        if (!isInitialized) {
          if (mode === "demo") {
            toast.info("Running in Demo Mode - data stored locally", {
              duration: 3000,
            });
          }
        }
      } catch (error) {
        console.error("Failed to detect app mode:", error);
        // Default to demo mode on error
        setConfig(getAppConfig("demo"));
      } finally {
        setIsInitialized(true);
      }
    };

    initializeMode();
  }, [isInitialized]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Initializing Enma...</p>
        </div>
      </div>
    );
  }

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
};

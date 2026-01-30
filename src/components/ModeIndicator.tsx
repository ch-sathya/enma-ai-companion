import { motion } from "framer-motion";
import { Wifi, WifiOff, Settings } from "lucide-react";
import { useAppConfig, setDemoModeForced, isDemoModeForced } from "@/config/appConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

interface ModeIndicatorProps {
  onModeChange?: () => void;
}

export const ModeIndicator = ({ onModeChange }: ModeIndicatorProps) => {
  const config = useAppConfig();
  const [forceDemoMode, setForceDemoMode] = useState(isDemoModeForced());

  useEffect(() => {
    setForceDemoMode(isDemoModeForced());
  }, []);

  const handleToggleDemoMode = (checked: boolean) => {
    setDemoModeForced(checked);
    setForceDemoMode(checked);
    // Trigger page reload to reinitialize with new mode
    if (onModeChange) {
      onModeChange();
    } else {
      window.location.reload();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            config.isDemo
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          } hover:opacity-80`}
          title={config.isDemo ? "Demo Mode - Data stored locally" : "Cloud Connected"}
        >
          {config.isDemo ? (
            <>
              <WifiOff size={12} />
              <span>Demo</span>
            </>
          ) : (
            <>
              <Wifi size={12} />
              <span>Cloud</span>
            </>
          )}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-72 bg-background/95 backdrop-blur-xl border border-white/10"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-muted-foreground" />
            <h4 className="font-medium text-sm">Connection Mode</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Force Demo Mode</p>
                <p className="text-xs text-muted-foreground">
                  Work offline with local storage
                </p>
              </div>
              <Switch
                checked={forceDemoMode}
                onCheckedChange={handleToggleDemoMode}
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-muted-foreground">
                {config.isDemo ? (
                  <>
                    <strong className="text-amber-400">Demo Mode Active</strong>
                    <br />
                    • All data stored locally in your browser
                    <br />
                    • Voice uses Web Speech API
                    <br />
                    • AI responses are simulated
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-400">Cloud Connected</strong>
                    <br />
                    • Data synced to cloud database
                    <br />
                    • Real AI models available
                    <br />
                    • ElevenLabs voice enabled
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

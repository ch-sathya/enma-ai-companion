import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Thermometer, Target, Hash } from "lucide-react";

interface ModelSettingsProps {
  temperature: number;
  topP: number;
  maxTokens: number;
  onTemperatureChange: (value: number) => void;
  onTopPChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
}

export const ModelSettings = ({
  temperature,
  topP,
  maxTokens,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
}: ModelSettingsProps) => {
  return (
    <div className="space-y-5 pt-2">
      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Thermometer size={12} />
            Temperature
          </Label>
          <span className="text-xs font-mono text-foreground">{temperature.toFixed(1)}</span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={([v]) => onTemperatureChange(v)}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-[10px] text-muted-foreground/60">
          Lower = focused & deterministic, Higher = creative & random
        </p>
      </div>

      {/* Top P */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target size={12} />
            Top P
          </Label>
          <span className="text-xs font-mono text-foreground">{topP.toFixed(2)}</span>
        </div>
        <Slider
          value={[topP]}
          onValueChange={([v]) => onTopPChange(v)}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <p className="text-[10px] text-muted-foreground/60">
          Nucleus sampling: lower = more deterministic
        </p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash size={12} />
            Max Tokens
          </Label>
          <span className="text-xs font-mono text-foreground">{maxTokens}</span>
        </div>
        <Slider
          value={[maxTokens]}
          onValueChange={([v]) => onMaxTokensChange(v)}
          min={256}
          max={8192}
          step={256}
          className="w-full"
        />
        <p className="text-[10px] text-muted-foreground/60">
          Maximum response length in tokens
        </p>
      </div>
    </div>
  );
};

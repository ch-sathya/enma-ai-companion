import { VoiceOrb } from "./VoiceOrb";

interface EnmaOrbProps {
  className?: string;
  interactive?: boolean;
}

// Thin wrapper kept for backwards-compatibility (e.g. landing page hero).
// Uses the shared VoiceOrb in its idle/ambient state.
export const EnmaOrb = ({ className }: EnmaOrbProps) => (
  <VoiceOrb className={className} active={false} level={0.12} />
);

export default EnmaOrb;

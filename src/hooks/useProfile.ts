import { useCallback, useEffect, useState } from "react";
import { AssistantProfile, DEFAULT_PROFILE, loadProfile, saveProfile } from "@/lib/assistant/profile";

const EVT = "enma:profile-change";

export const useProfile = () => {
  const [profile, setProfile] = useState<AssistantProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    setProfile(loadProfile());
    const onChange = () => setProfile(loadProfile());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((patch: Partial<AssistantProfile>) => {
    const next = { ...loadProfile(), ...patch };
    saveProfile(next);
    setProfile(next);
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { profile, update };
};

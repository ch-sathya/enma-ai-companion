import { useEffect, useCallback } from "react";

interface KeyboardShortcutsProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenModelPopup: () => void;
  onClosePopups: () => void;
}

export const useKeyboardShortcuts = ({
  onToggleSidebar,
  onNewChat,
  onOpenModelPopup,
  onClosePopups,
}: KeyboardShortcutsProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check for cmd/ctrl key
      const isMod = e.metaKey || e.ctrlKey;

      // Escape - close popups
      if (e.key === "Escape") {
        e.preventDefault();
        onClosePopups();
        return;
      }

      // Cmd/Ctrl + B - toggle sidebar
      if (isMod && e.key === "b") {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // Cmd/Ctrl + N - new chat
      if (isMod && e.key === "n") {
        e.preventDefault();
        onNewChat();
        return;
      }

      // Cmd/Ctrl + M - open model selector
      if (isMod && e.key === "m") {
        e.preventDefault();
        onOpenModelPopup();
        return;
      }
    },
    [onToggleSidebar, onNewChat, onOpenModelPopup, onClosePopups]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

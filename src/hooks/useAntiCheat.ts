import { useEffect, useRef, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseAntiCheatOptions {
  enabled: boolean;
  onAutoSubmit: () => void;
  maxViolations?: number;
}

export function useAntiCheat({ enabled, onAutoSubmit, maxViolations = 3 }: UseAntiCheatOptions) {
  const { toast } = useToast();
  const [violations, setViolations] = useState(0);
  const violationsRef = useRef(0);
  const autoSubmittedRef = useRef(false);

  // Tab-switch detection
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.hidden && !autoSubmittedRef.current) {
        violationsRef.current += 1;
        const v = violationsRef.current;
        setViolations(v);
        if (v >= maxViolations) {
          autoSubmittedRef.current = true;
          toast({
            title: "⚠️ Ujian otomatis disubmit",
            description: `Anda telah meninggalkan tab ${maxViolations} kali. Ujian dikirim secara otomatis.`,
            variant: "destructive",
          });
          onAutoSubmit();
        } else {
          toast({
            title: `⚠️ Peringatan (${v}/${maxViolations})`,
            description: "Jangan pindah tab saat ujian berlangsung!",
            variant: "destructive",
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, maxViolations, onAutoSubmit, toast]);

  // Fullscreen monitoring
  useEffect(() => {
    if (!enabled) return;
    const handleFsChange = () => {
      if (!document.fullscreenElement && !autoSubmittedRef.current) {
        violationsRef.current += 1;
        const v = violationsRef.current;
        setViolations(v);
        if (v >= maxViolations) {
          autoSubmittedRef.current = true;
          toast({
            title: "⚠️ Ujian otomatis disubmit",
            description: `Terlalu banyak pelanggaran. Ujian dikirim secara otomatis.`,
            variant: "destructive",
          });
          onAutoSubmit();
        } else {
          toast({
            title: `⚠️ Peringatan (${v}/${maxViolations})`,
            description: "Jangan keluar dari mode fullscreen!",
            variant: "destructive",
          });
          // Re-request fullscreen
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [enabled, maxViolations, onAutoSubmit, toast]);

  // Disable copy, cut, paste, right-click
  useEffect(() => {
    if (!enabled) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
    };
  }, [enabled]);

  const requestFullscreen = useCallback(() => {
    if (!enabled) return;
    document.documentElement.requestFullscreen?.().catch(() => {
      toast({
        title: "Fullscreen tidak tersedia",
        description: "Browser Anda mungkin tidak mendukung mode fullscreen.",
        variant: "destructive",
      });
    });
  }, [enabled, toast]);

  // Exit fullscreen on cleanup
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  return { violations, requestFullscreen };
}

import { useEffect, useRef } from "react";

// Hook minimalista para precargar y reproducir un sonido desde /public
export default function useSound(src, { volume = 1, loop = false } = {}) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = loop;
    audio.preload = "auto";
    audioRef.current = audio;

    // try to load (some browsers ignore until user gesture)
    // keep reference for play control
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
      } catch (e) {
        // noop
      }
      audioRef.current = null;
    };
  }, [src, volume, loop]);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {
      // play can fail without user gesture; ignore safely
    }
  };

  return { play };
}

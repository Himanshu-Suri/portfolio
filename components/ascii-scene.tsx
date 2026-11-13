"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  sway?: number;
  parallax?: number;
  padding?: number;
  lift?: number;
};

/**
 * The ASCII picture as a Three.js scene. Three.js is imported inside the
 * effect, so it is split into its own chunk and never runs on the server.
 */
export function AsciiScene({
  className = "",
  sway,
  parallax,
  padding,
  lift,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    import("@/lib/ascii-scene")
      .then(async (m) => {
        if (cancelled || !ref.current) return;
        const handle = await m.createAsciiScene(ref.current, {
          dataUrl: "/ascii-scene.json",
          fontUrl: "/fonts/helvetiker_regular.typeface.json",
          sway,
          parallax,
          padding,
          lift,
        });
        if (cancelled) handle.dispose();
        else dispose = handle.dispose;
      })
      .catch((err) => console.error("[ascii-scene]", err));

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [sway, parallax, padding, lift]);

  return <div ref={ref} className={className} aria-hidden="true" />;
}

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, Environment } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface VoiceOrbProps {
  active?: boolean;     // listening or speaking
  speaking?: boolean;   // tint accent when AI speaks
  level?: number;       // 0..1 audio level
  className?: string;
}

const Core = ({ activeRef, levelRef, speakingRef }: {
  activeRef: React.MutableRefObject<boolean>;
  levelRef: React.MutableRefObject<number>;
  speakingRef: React.MutableRefObject<boolean>;
}) => {
  const inner = useRef<THREE.Mesh>(null!);
  const wire = useRef<THREE.Mesh>(null!);
  const mat = useRef<any>(null);

  useFrame((_, dt) => {
    const lvl = levelRef.current;
    const base = activeRef.current ? 1 + lvl * 0.35 : 1;
    if (inner.current) {
      inner.current.rotation.y += dt * (0.15 + lvl * 0.8);
      inner.current.rotation.x += dt * 0.05;
      inner.current.scale.setScalar(THREE.MathUtils.lerp(inner.current.scale.x, base, 0.18));
    }
    if (wire.current) {
      wire.current.rotation.y -= dt * (0.08 + lvl * 0.4);
      wire.current.rotation.z += dt * 0.04;
      wire.current.scale.setScalar(THREE.MathUtils.lerp(wire.current.scale.x, base * 1.05, 0.12));
    }
    if (mat.current) {
      mat.current.distort = THREE.MathUtils.lerp(mat.current.distort, 0.32 + lvl * 0.5, 0.15);
      mat.current.speed = speakingRef.current ? 2.2 : 1.1;
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.9}>
      <Icosahedron ref={inner} args={[1, 5]}>
        <MeshDistortMaterial
          ref={mat}
          color="#0a0a0a"
          roughness={0.15}
          metalness={0.95}
          distort={0.38}
          speed={1.1}
          envMapIntensity={1.2}
        />
      </Icosahedron>
      <Icosahedron ref={wire} args={[1.35, 2]}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </Icosahedron>
      <pointLight position={[3, 2, 2]} intensity={1.4} color="hsl(var(--enma-purple-glow))" />
      <pointLight position={[-3, -1, -2]} intensity={1.1} color="hsl(var(--enma-gold-glow))" />
    </Float>
  );
};

export const VoiceOrb = ({ active = false, speaking = false, level = 0, className }: VoiceOrbProps) => {
  // Refs to avoid Canvas re-renders on prop changes
  const activeRef = useRef(active);
  const speakingRef = useRef(speaking);
  const levelRef = useRef(level);
  activeRef.current = active;
  speakingRef.current = speaking;
  levelRef.current = level;

  return (
    <div className={className} style={{ pointerEvents: "none" }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.2], fov: 38 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <Environment preset="city" />
          <Core activeRef={activeRef} levelRef={levelRef} speakingRef={speakingRef} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Hook: returns a smoothed mic level (0..1) while `enabled` is true.
export const useMicLevel = (enabled: boolean) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLevel(0);
      return;
    }
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!analyser) return;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          setLevel((prev) => prev * 0.7 + Math.min(1, rms * 3) * 0.3);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // permission denied — fall back to gentle idle pulse
        const start = performance.now();
        const tick = () => {
          const t = (performance.now() - start) / 1000;
          setLevel(0.05 + Math.abs(Math.sin(t * 1.4)) * 0.1);
          raf = requestAnimationFrame(tick);
        };
        tick();
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [enabled]);

  return level;
};

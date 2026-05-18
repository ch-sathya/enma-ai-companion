import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, Environment } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

interface EnmaOrbProps {
  className?: string;
  interactive?: boolean;
}

const Core = () => {
  const inner = useRef<THREE.Mesh>(null!);
  const wire = useRef<THREE.Mesh>(null!);

  useFrame((_, dt) => {
    if (inner.current) {
      inner.current.rotation.y += dt * 0.15;
      inner.current.rotation.x += dt * 0.05;
    }
    if (wire.current) {
      wire.current.rotation.y -= dt * 0.08;
      wire.current.rotation.z += dt * 0.04;
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.9}>
      {/* Solid distorted core */}
      <Icosahedron ref={inner} args={[1, 5]}>
        <MeshDistortMaterial
          color="#0a0a0a"
          roughness={0.15}
          metalness={0.95}
          distort={0.38}
          speed={1.1}
          envMapIntensity={1.2}
        />
      </Icosahedron>

      {/* Wireframe shell */}
      <Icosahedron ref={wire} args={[1.35, 2]}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.08} />
      </Icosahedron>

      {/* Subtle rim accents */}
      <pointLight position={[3, 2, 2]} intensity={1.4} color="#b794f6" />
      <pointLight position={[-3, -1, -2]} intensity={1.1} color="#e8c07a" />
    </Float>
  );
};

export const EnmaOrb = ({ className, interactive = false }: EnmaOrbProps) => {
  return (
    <div className={className} style={{ pointerEvents: interactive ? "auto" : "none" }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <Environment preset="city" />
          <Core />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default EnmaOrb;

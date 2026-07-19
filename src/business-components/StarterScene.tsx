import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

export function StarterScene() {
  const cubeRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!cubeRef.current) return;
    cubeRef.current.rotation.x += delta * 0.24;
    cubeRef.current.rotation.y += delta * 0.42;
  });

  return (
    <>
      <color attach="background" args={["#07111f"]} />
      <fog attach="fog" args={["#07111f", 8, 28]} />
      <PerspectiveCamera makeDefault fov={52} position={[0, 0.5, 6]} />
      <ambientLight intensity={1.1} />
      <directionalLight intensity={2.4} position={[4, 5, 3]} />
      <pointLight color="#22d3ee" intensity={18} position={[-4, 1, 2]} distance={15} />
      <mesh ref={cubeRef} rotation={[0.35, 0.6, 0]}>
        <icosahedronGeometry args={[1.45, 1]} />
        <meshStandardMaterial color="#67e8f9" emissive="#0e7490" emissiveIntensity={0.25} roughness={0.24} metalness={0.4} />
      </mesh>
    </>
  );
}

import { Grid, PerspectiveCamera, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

export function StarterScene() {
  const coreRef = useRef<Group>(null);
  const orbitOneRef = useRef<Mesh>(null);
  const orbitTwoRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.18;
    if (orbitOneRef.current) orbitOneRef.current.rotation.z += delta * 0.52;
    if (orbitTwoRef.current) orbitTwoRef.current.rotation.z -= delta * 0.34;
  });

  return (
    <>
      <color attach="background" args={["#07111f"]} />
      <fog attach="fog" args={["#07111f", 8, 26]} />
      <PerspectiveCamera makeDefault fov={48} position={[0, 0.45, 7.6]} />
      <ambientLight intensity={0.65} />
      <directionalLight color="#e0f2fe" intensity={2.2} position={[4, 5, 4]} />
      <pointLight color="#22d3ee" intensity={22} position={[-3, 1, 3]} distance={14} />
      <pointLight color="#67e8f9" intensity={10} position={[2, -1, 1]} distance={10} />
      <group ref={coreRef} position={[0, 0.35, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.18, 2]} />
          <meshStandardMaterial color="#67e8f9" emissive="#0e7490" emissiveIntensity={0.7} metalness={0.7} roughness={0.18} />
        </mesh>
        <mesh rotation={[0.38, 0.62, 0.12]} scale={[1.52, 1.52, 1.52]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.32} wireframe />
        </mesh>
        <mesh ref={orbitOneRef} rotation={[1.18, 0.18, 0]}>
          <torusGeometry args={[1.82, 0.035, 12, 96]} />
          <meshBasicMaterial color="#67e8f9" />
        </mesh>
        <mesh ref={orbitTwoRef} rotation={[0.52, 1.08, 0.45]}>
          <torusGeometry args={[2.18, 0.024, 12, 96]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
        </mesh>
      </group>
      <Sparkles count={72} scale={[10, 6, 8]} size={1.8} speed={0.24} opacity={0.68} color="#67e8f9" />
      <Grid position={[0, -2.25, 0]} args={[18, 18]} cellSize={0.6} cellThickness={0.5} cellColor="#155e75" sectionSize={3} sectionThickness={1.1} sectionColor="#67e8f9" fadeDistance={18} fadeStrength={1.4} infiniteGrid />
    </>
  );
}

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─── SECTION COLORS ─── */
const COLORS = [
  '#6366f1', '#06b6d4', '#8b5cf6', '#10b981',
  '#22d3ee', '#f59e0b', '#818cf8',
];

function getColor(progress) {
  const t = Math.min(Math.max(+progress || 0, 0), 0.99);
  const idx = t * (COLORS.length - 1);
  const i = Math.floor(idx);
  const j = Math.min(i + 1, COLORS.length - 1);
  const f = idx - i;
  const c1 = new THREE.Color(COLORS[i]);
  const c2 = new THREE.Color(COLORS[j]);
  return c1.clone().lerp(c2, f);
}

/* ─── STABLE CAMERA ───
   Barely moves — creates gentle ambient motion */
function StableCamera() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const s = Math.sin(clock.elapsedTime * 0.05) * 0.08;
    camera.position.set(s * 0.3, 0.3 + s * 0.2, 8);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ─── ATMOSPHERE ───
   Fog color follows active section */
function Atmosphere({ scrollRef }) {
  const { scene } = useThree();
  useFrame(() => {
    const c = getColor(scrollRef.current);
    scene.fog = new THREE.FogExp2(c, 0.015);
  });
  return null;
}

/* ─── PARTICLES ───
   1500 stars that slowly rotate */
const PARTICLE_COUNT = 1500;
function ParticleField({ scrollRef }) {
  const mesh = useRef();
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const siz = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 4 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.4 + Math.random() * 2 - 1;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 5;
      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.3, 0.5, 0.3 + Math.random() * 0.3);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      siz[i] = 0.02 + Math.random() * 0.06;
    }
    return { positions: pos, colors: col, sizes: siz };
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.004;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.02;
    const color = getColor(scrollRef.current);
    mesh.current.material.color.lerp(color, 0.01);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.04} vertexColors sizeAttenuation transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} color="#6366f1" />
    </points>
  );
}

/* ─── MORPHING STRUCTURE ───
   Floating geometry cluster that rearranges with scroll */
function MorphStructure({ scrollRef }) {
  const group = useRef();
  const objects = useMemo(() => {
    const configs = [
      { type: 'torus', args: [0.6, 0.04, 32, 48] },
      { type: 'icosahedron', args: [0.3, 0] },
      { type: 'torusKnot', args: [0.4, 0.06, 48, 6] },
      { type: 'octahedron', args: [0.25, 0] },
      { type: 'dodecahedron', args: [0.22, 0] },
      { type: 'torus', args: [0.35, 0.03, 24, 32] },
    ];
    return configs.map((cfg, i) => ({
      ...cfg,
      basePos: [Math.cos((i / configs.length) * Math.PI * 2) * 1.8, Math.sin((i / configs.length) * Math.PI * 4) * 0.5, Math.sin((i / configs.length) * Math.PI * 2) * 1.2],
      rotSpeed: 0.3 + i * 0.08,
    }));
  }, []);

  useFrame(() => {
    if (!group.current) return;
    const t = Math.min(Math.max(+scrollRef.current || 0, 0), 0.99);
    const spread = 1.2 + t * 1.5;
    group.current.children.forEach((child, i) => {
      if (i >= objects.length) return;
      const angle = (i / objects.length) * Math.PI * 2 + t * 0.5;
      const x = Math.cos(angle) * spread;
      const y = Math.sin(angle * 2 + t) * 0.6;
      const z = Math.sin(angle) * spread * 0.6;
      child.position.lerp(new THREE.Vector3(x, y, z - 2), 0.03);
      child.rotation.x += objects[i].rotSpeed * 0.008;
      child.rotation.y += objects[i].rotSpeed * 0.012;
    });
  });

  return (
    <group ref={group}>
      {objects.map((obj, i) => {
        let geom;
        switch (obj.type) {
          case 'torus': geom = <torusGeometry args={obj.args} />; break;
          case 'torusKnot': geom = <torusKnotGeometry args={obj.args} />; break;
          case 'icosahedron': geom = <icosahedronGeometry args={obj.args} />; break;
          case 'octahedron': geom = <octahedronGeometry args={obj.args} />; break;
          case 'dodecahedron': geom = <dodecahedronGeometry args={obj.args} />; break;
          default: geom = <boxGeometry args={[0.2, 0.2, 0.2]} />;
        }
        return (
          <mesh key={i} position={obj.basePos}>
            {geom}
            <meshPhysicalMaterial
              color="#a5b4fc" metalness={0.9} roughness={0.1}
              transparent opacity={0.6} emissive="#6366f1" emissiveIntensity={0.08}
              wireframe={i % 2 === 0} side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ─── AMBIENT RINGS ─── */
function AmbientRings() {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.03;
    group.current.children.forEach((child, i) => {
      child.rotation.x = Math.sin(state.clock.elapsedTime * 0.1 + i) * 0.1;
    });
  });
  return (
    <group ref={group} position={[0, 0, -3]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[i * 0.4, 0, 0]}>
          <ringGeometry args={[1.2 + i * 0.5, 1.22 + i * 0.5, 48]} />
          <meshBasicMaterial color="#818cf8" transparent opacity={0.04 + i * 0.02} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── FLOOR GLOW ─── */
function FloorGlow({ scrollRef }) {
  const mesh = useRef();
  useFrame(() => {
    if (!mesh.current) return;
    const color = getColor(scrollRef.current);
    mesh.current.material.color.lerp(color, 0.02);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial color="#0a0a1a" />
    </mesh>
  );
}

/* ─── LIGHTS ─── */
function SceneLights({ scrollRef }) {
  const dirLight = useRef();
  useFrame(() => {
    if (!dirLight.current) return;
    const color = getColor(scrollRef.current);
    dirLight.current.color.lerp(color, 0.02);
    dirLight.current.position.x = Math.sin(Date.now() * 0.0003) * 5;
    dirLight.current.position.z = Math.cos(Date.now() * 0.0003) * 5;
  });
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight ref={dirLight} position={[5, 8, 5]} intensity={1.2} color="#6366f1" />
      <hemisphereLight args={['#6366f1', '#0a0a1a', 0.3]} />
    </>
  );
}

/* ─── MAIN ─── */
export default function Portfolio3D({ scrollRef = { current: 0 } }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.3, 8], fov: 60, near: 0.1, far: 50 }}
        style={{ background: '#06060e' }}
      >
        <Atmosphere scrollRef={scrollRef} />
        <StableCamera />
        <SceneLights scrollRef={scrollRef} />
        <ParticleField scrollRef={scrollRef} />
        <FloorGlow scrollRef={scrollRef} />
        <AmbientRings />
        <MorphStructure scrollRef={scrollRef} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={256} intensity={0.35} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

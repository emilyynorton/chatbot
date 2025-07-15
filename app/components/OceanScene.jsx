'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

function AnimatedShape({ position, type, color, speed = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (ref.current) {
      ref.current.rotation.x = t;
      ref.current.rotation.y = t * 0.7;
      ref.current.scale.setScalar(1 + 0.3 * Math.sin(t));
    }
  });

  const geometry = type === 'torus'
    ? <Torus args={[0.5, 0.2, 16, 100]} />
    : <Sphere args={[0.4, 32, 32]} />;

  return (
    <Float speed={2} floatIntensity={2} rotationIntensity={1} position={position}>
      <mesh ref={ref}>
        {geometry}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.4} roughness={0.3} />
      </mesh>
    </Float>
  );
}

function KaleidoscopeObjects() {
  const shapes = useMemo(() =>
    Array.from({ length: 40 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
      ],
      type: Math.random() > 0.5 ? 'sphere' : 'torus',
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 70%)`,
      speed: Math.random() * 1.5 + 0.5,
    })), []);

  return (
    <>
      {shapes.map((props, i) => (
        <AnimatedShape key={i} {...props} />
      ))}
    </>
  );
}

export default function KaleidoscopeScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#0a0a23']} />
          <fog attach="fog" args={['#0a0a23', 10, 30]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 10, 5]} intensity={1.2} color="#ffffff" />
          <KaleidoscopeObjects />
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

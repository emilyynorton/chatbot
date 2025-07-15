'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, Box, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

function useDeviceTilt() {
  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });

  useEffect(() => {
    const handleOrientation = (event) => {
      setTilt({
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return tilt;
}

function AnimatedShape({ basePosition, type, color, speed, tilt }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (!ref.current) return;

    ref.current.rotation.x = t * 2;
    ref.current.rotation.y = t * 1.8;
    ref.current.scale.setScalar(1.2 + 0.6 * Math.sin(t * 3));

    ref.current.position.x = basePosition[0] + tilt.gamma * 0.05;
    ref.current.position.y = basePosition[1] + tilt.beta * 0.05;
    ref.current.position.z = basePosition[2] + Math.sin(t + basePosition[0]) * 0.8;
  });

  let geometry;
  switch (type) {
    case 'torus':
      geometry = <torusGeometry args={[0.4, 0.15, 16, 100]} />;
      break;
    case 'box':
      geometry = <boxGeometry args={[0.6, 0.6, 0.6]} />;
      break;
    default:
      geometry = <sphereGeometry args={[0.4, 32, 32]} />;
  }

  return (
    <Float speed={3} floatIntensity={4} rotationIntensity={2}>
      <mesh ref={ref} position={basePosition}>
        {geometry}
        <meshStandardMaterial
          color={color} // color must be a valid CSS string, e.g. '#ff0000'
          emissive={color}
          emissiveIntensity={1.4}
          metalness={0.5}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function KaleidoscopeObjects() {
  const tilt = useDeviceTilt();

  const shapes = useMemo(() => {
    return Array.from({ length: 150 }).map(() => {
      // Use THREE.Color but convert to hex string here
      const col = new THREE.Color().setHSL(Math.random(), 1, 0.6).getHexString();
      return {
        basePosition: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
        ],
        type: ['sphere', 'torus', 'box'][Math.floor(Math.random() * 3)],
        color: '#' + col, // <-- Pass hex color string like "#aabbcc"
        speed: Math.random() * 2 + 1.5,
      };
    });
  }, []);

  return (
    <>
      {shapes.map((props, i) => (
        <AnimatedShape key={i} {...props} tilt={tilt} />
      ))}
    </>
  );
}

export default function KaleidoscopeScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 16], fov: 80 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050011']} />
          <fog attach="fog" args={['#050011', 15, 45]} />

          <ambientLight intensity={0.7} />
          <pointLight position={[0, 10, 10]} intensity={2} color="#ffffff" />

          <KaleidoscopeObjects />

          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

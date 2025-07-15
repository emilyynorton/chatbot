'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sphere } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Note: We're using a .jsx file to avoid TypeScript errors with Three.js elements

function Bubble({ position, scale = 1, color = '#ccffff' }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Add a subtle bobbing motion
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.2 + position[0]) * 0.002;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5} position={position}>
      <Sphere args={[scale, 8, 8]} ref={meshRef}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </Sphere>
    </Float>
  );
}

function OceanObjects() {
  // Create an array of objects for the ocean scene
  const bubbles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 20, 
        (Math.random() - 0.5) * 20, 
        (Math.random() - 0.5) * 20
      ],
      scale: Math.random() * 0.3 + 0.1,
      color: i % 3 === 0 ? '#90cdf4' : i % 3 === 1 ? '#63b3ed' : '#a3bffa'
    }));
  }, []);

  return (
    <>
      {bubbles.map((bubble, i) => (
        <Bubble key={i} position={bubble.position} scale={bubble.scale} color={bubble.color} />
      ))}
      
      {/* Main center sphere */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5} position={[0, 0, -2]}>
        <Sphere args={[1.2, 32, 32]}>
          <meshStandardMaterial
            color="#4299e1"
            metalness={0.2}
            roughness={0.4}
            emissive="#2b6cb0"
            emissiveIntensity={0.2}
          />
        </Sphere>
      </Float>
    </>
  );
}

export default function OceanScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true }}
        dpr={[1, 1.5]} // Performance optimization
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#1a365d']} />
          
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 10, 2]} intensity={1} />
          
          {/* Fog effect for underwater feel */}
          <fog attach="fog" args={['#1a365d', 8, 30]} />
          
          {/* Ocean elements */}
          <OceanObjects />
          
          {/* Environment lighting and background */}
          <Environment preset="sunset" background={false} />
          
          {/* Camera controls */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2} 
            minPolarAngle={Math.PI / 2.5} 
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

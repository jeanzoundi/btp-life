'use client';
import { Environment, Lightformer } from '@react-three/drei';

/** One baked environment per renderer, no remote HDR dependency or per-frame cube capture. */
export function RefletsMonde(){return <Environment resolution={128} frames={1} environmentIntensity={.35}>
  <color attach="background" args={['#839cab']}/>
  <Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[20,20,1]} intensity={2} color="#cddce5"/>
  <Lightformer position={[5,4,-8]} scale={[5,8,1]} intensity={4} color="#ffe7c6"/>
  <Lightformer position={[-8,2,0]} rotation={[0,Math.PI/2,0]} scale={[10,6,1]} intensity={1} color="#aec9de"/>
</Environment>;}

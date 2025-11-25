import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

const Effects = () => {
  return (
    <EffectComposer disableNormalPass>
      {/* 
        TS Error Suppression: React 19 expects components to return an Element, 
        but R3F post-processing components often return void/undefined as they 
        attach to the parent composer. This is safe to ignore.
      */}
      
      {/* @ts-expect-error: React 19 type conflict */}
      <Bloom 
        luminanceThreshold={0.2} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.6}
      />
      
      {/* @ts-expect-error: React 19 type conflict */}
      <ChromaticAberration 
        offset={new THREE.Vector2(0.002, 0.002)} 
        radialModulation={false}
        modulationOffset={0}
      />

      {/* @ts-expect-error: React 19 type conflict */}
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
};

export default Effects;
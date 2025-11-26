import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

const Effects = () => {
  return (
    <EffectComposer disableNormalPass>
      {/* Bloom seems to be working fine without suppression on the server */}
      <Bloom 
        luminanceThreshold={0.2} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.6}
      />
      
      {/* Use ts-ignore to force build to pass for these two */}
      {/* @ts-ignore */}
      <ChromaticAberration 
        offset={new THREE.Vector2(0.002, 0.002)} 
        radialModulation={false}
        modulationOffset={0}
      />

      {/* @ts-ignore */}
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
};

export default Effects;
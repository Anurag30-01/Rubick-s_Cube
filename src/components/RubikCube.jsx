import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import Cubelet from './Cubelet';
import FaceRotator from './FaceRotator';
import { OrbitControls } from '@react-three/drei';

export default function RubikCube() {
  const cubeGroupRef = useRef();
  const { camera, scene, gl } = useThree();
  const orbitControlsRef = useRef();

  const cubelets = [];
  for (let x = -1; x <=1; x++) {
    for (let y = -1; y <=1; y++) {
      for (let z = -1; z <=1; z++) {
        const id = `${x},${y},${z}`;
        cubelets.push(
          <Cubelet key={id} position={[x, y, z]} />
        );
      }
    }
  }

  return (
    <>
      <group ref={cubeGroupRef}>
        {cubelets}
      </group>

      <FaceRotator
        camera={camera}
        scene={scene}
        cubeGroup={cubeGroupRef}
        orbitControlsRef={orbitControlsRef}
        domElement={gl.domElement}
      />
      <OrbitControls ref={orbitControlsRef} enablePan={false} />
    </>
  );
}

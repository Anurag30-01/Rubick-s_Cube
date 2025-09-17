import { useRef } from 'react';
 import { useFrame } from '@react-three/fiber';
  import * as THREE from 'three'; import { useCubeStore } from '../store/cubeStore';
   export default function Cubelet({ position, id }) 
   { 
    const ref = useRef();
     const setCubeRef = useCubeStore((state) => state.setCubeRef);
      useFrame(() => { if (ref.current) { setCubeRef(id, ref.current);

       } }); 
       const [x, y, z] = position; // Corrected face color mapping based on material index
       const faceColors = [
        // right (index 0)
        x === 1 ? 'rgba(246, 255, 0, 1)' : 'rgba(0, 0, 0, 1)', 
        // left (index 1)
        x === -1 ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)', 
        // top (index 2)
        y === 1 ? 'rgba(0, 0, 255, 1)' : 'rgba(0, 0, 0, 1)', 
        // bottom (index 3)
        y === -1 ? 'rgba(0, 128, 0, 1)' : 'rgba(0, 0, 0, 1)', 
        // front (index 4)
        z === 1 ?  'rgba(246, 102, 0, 1)' : 'rgba(0, 0, 0, 1)', 
        // back (index 5)
        z === -1 ? 'rgba(255, 0, 0, 1)' : 'rgba(0, 0, 0, 1)', 
      ];
      const materials = faceColors.map((color) => new THREE.MeshStandardMaterial({ color }));

      // Add borders by overlaying a slightly larger wireframe box
      const borderColor = 'black';
      const borderThickness = 0.02;
      // The border mesh is slightly larger than the cubelet
      const borderArgs = [0.93 + borderThickness, 0.93 + borderThickness, 0.93 + borderThickness];

      return (
        <mesh ref={ref} position={position} material-color="black">
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          {materials.map((mat, index) => (
        <primitive key={index} object={mat} attach={`material-${index}`} />
          ))}
        </mesh>
      );
    }
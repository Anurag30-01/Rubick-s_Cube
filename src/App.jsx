import { Canvas } from '@react-three/fiber';
import RubikCube from './components/RubikCube';
import { useRef } from 'react';
import './styles.css';
import { useCubeStore } from './store/cubeStore';
import { OrbitControls } from '@react-three/drei';
export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className="w-screen h-screen bg-black">
        <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
          {/* <Canvas  camera={{ position: [5, 5, 5], fov: 60 }}> */}
          <ambientLight intensity={1.8} />
    <pointLight position={[10, 10, 10]} intensity={1.8} />
    <RubikCube />
    {/* </Canvas> */}

    {/* <OrbitControls  enablePan={false} /> */}
  </Canvas>
  
</div>

    </div>
  );
}

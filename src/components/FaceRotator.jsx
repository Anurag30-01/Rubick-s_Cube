import { useRef, useEffect } from "react";
import * as THREE from "three";

const EPSILON = 0.1; // Small value for floating point comparison

// Map each face normal axis to which axes represent row, column and rotation
const FACE_CONFIG = {
  front:  { fixedAxis: "z", rowAxis: "x", colAxis: "y", rotateRow: "x", rotateCol: "y" },
  back:   { fixedAxis: "z", rowAxis: "x", colAxis: "y", rotateRow: "x", rotateCol: "y" },
  right:  { fixedAxis: "x", rowAxis: "z", colAxis: "y", rotateRow: "z", rotateCol: "y" },
  left:   { fixedAxis: "x", rowAxis: "z", colAxis: "y", rotateRow: "z", rotateCol: "y" },
  top:    { fixedAxis: "y", rowAxis: "x", colAxis: "z", rotateRow: "x", rotateCol: "z" },
  bottom: { fixedAxis: "y", rowAxis: "x", colAxis: "z", rotateRow: "x", rotateCol: "z" }
};

export default function FaceRotator({ scene, camera, cubeGroup, orbitControlsRef }) {
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  const selectedCubelet = useRef(null);
  const rowGroup = useRef([]);
  const colGroup = useRef([]);
  const rotatingGroup = useRef(null);
  const dragAxis = useRef(null);
  const dragAmount = useRef(0);
  const direction = useRef(null);

  const startPoint = useRef(null);
  const lastAngle = useRef(0);
  const selectedFaceName = useRef(null);

  // Detect which face has been clicked based on cubelet position and face normal in world space
  const getFaceFromNormal = (normal) => {
    if (Math.abs(normal.z - 1) < EPSILON) return "front";
    if (Math.abs(normal.z + 1) < EPSILON) return "back";
    if (Math.abs(normal.x - 1) < EPSILON) return "right";
    if (Math.abs(normal.x + 1) < EPSILON) return "left";
    if (Math.abs(normal.y - 1) < EPSILON) return "top";
    if (Math.abs(normal.y + 1) < EPSILON) return "bottom";
    return null;
  };

  // Get intersection info: picked cubelet and face normal in world coordinates
  const getIntersection = (event) => {
    const rect = event.target.getBoundingClientRect();
    pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(pointer.current, camera);
    const intersects = raycaster.current.intersectObjects(cubeGroup.current.children, true);
    if (intersects.length === 0) return null;

    const hit = intersects[0];
    const cubelet = hit.object;

    // Convert face normal to world space (account cubelet rotation)
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(cubelet.matrixWorld);
    const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).round();

    return { cubelet, normal: worldNormal };
  };

  const onPointerDown = (event) => {
    const intersection = getIntersection(event);
    if (!intersection) return;

    selectedCubelet.current = intersection.cubelet;
    selectedFaceName.current = getFaceFromNormal(intersection.normal);
    if (!selectedFaceName.current) return; // invalid face

    orbitControlsRef.current.enabled = false;

    startPoint.current = { x: event.clientX, y: event.clientY };
    const pos = selectedCubelet.current.position;

    const faceConfig = FACE_CONFIG[selectedFaceName.current];
    // console.log("Selected face:", selectedFaceName.current, "at position:", pos);
    

    const fixedPos = Math.round(pos[faceConfig.fixedAxis]);

    // console.log("Fixed position for face:", fixedPos); 
    const snappedPos = new THREE.Vector3(
      Math.round(pos.x),
      Math.round(pos.y),
      Math.round(pos.z)
    );
    rowGroup.current = cubeGroup.current.children.filter(c =>
  Math.abs(c.position[faceConfig.rowAxis] - snappedPos[faceConfig.rowAxis]) < EPSILON 
);

colGroup.current = cubeGroup.current.children.filter(c =>
  Math.abs(c.position[faceConfig.colAxis] - snappedPos[faceConfig.colAxis]) < EPSILON 
);
  // rowGroup.current.forEach(cubelet => {
  //   if (Array.isArray(cubelet.material)) {
  //     cubelet.material.forEach(mat => mat.color.set(0xffffff));
  //   } else if (cubelet.material && cubelet.material.color) {
  //     cubelet.material.color.set(0xffffff);
  //   }
  // });
  // colGroup.current.forEach(cubelet => {
  //   if (Array.isArray(cubelet.material)) {
  //     cubelet.material.forEach(mat => mat.color.set(0x00ffff));
  //   } else if (cubelet.material && cubelet.material.color) {
  //     cubelet.material.color.set(0x00ffff);
  //   }
  // });
  };

 const onPointerMove = (event) => {
  if (!selectedCubelet.current || !startPoint.current) return;

  const dx = event.clientX - startPoint.current.x;
  const dy = event.clientY - startPoint.current.y;
  const dragDistance = Math.sqrt(dx * dx + dy * dy);

  if (!rotatingGroup.current && dragDistance > 5) {
    rotatingGroup.current = new THREE.Group();

    const faceConfig = FACE_CONFIG[selectedFaceName.current];

    // Determine drag direction and pick which group to rotate
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal drag → rotate col group around col rotation axis
      dragAxis.current = faceConfig.rotateCol;
      colGroup.current.forEach(c => rotatingGroup.current.add(c));
      direction.current = dx > 0 ? 'rightToLeft' : 'leftToRight';
    } else {
      // Vertical drag → rotate row group around row rotation axis
      dragAxis.current = faceConfig.rotateRow;
      rowGroup.current.forEach(c => rotatingGroup.current.add(c));
      direction.current = dy > 0 ? 'bottomToTop' : 'topToBottom';
    }

    lastAngle.current = rotatingGroup.current.rotation[dragAxis.current] || 0;
    scene.add(rotatingGroup.current);
  }

  if (rotatingGroup.current) {
    // Pick drag amount according to direction
    let dragAmountRaw;
    if (direction.current === 'rightToLeft' || direction.current === 'leftToRight') {
      dragAmountRaw = dx;
    } else {
      dragAmountRaw = dy;
    }

    // Optionally flip drag sign for intuitive direction based on face (extend as needed)
    let dragAmountFinal = dragAmountRaw;
    // console.log(selectedFaceName.current, dragAxis.current, selectedCubelet.current.position);
    // console.log(selectedCubelet.current.position, rowGroup.current, colGroup.current);
    if (selectedFaceName.current === 'back' && dragAxis.current === 'x') {
      dragAmountFinal = -dragAmountRaw;
    }
    else if (selectedFaceName.current === 'right' && dragAxis.current === 'z') {
      dragAmountFinal = -dragAmountRaw;
    }
    // if(selectedFaceName.current === 'bottom')rowGroup.current.clear();
    if (
      selectedFaceName.current === 'bottom' &&
      selectedCubelet.current.position.z === 1 &&
      selectedCubelet.current.position.x === 1 &&  Math.abs(dy) > Math.abs(dx)
    ) {
      // const temp = rowGroup.current;
      // rowGroup.current = colGroup.current;
      // colGroup.current = temp;
      rowGroup.current.forEach(c => rotatingGroup.current.add(c));
      dragAxis.current = 'x';
      dragAmountFinal= dy >= 0? dragAmountRaw : -dragAmountRaw;
      console.log(dragAxis.current);
    }
    else if (
      selectedFaceName.current === 'bottom' &&
      selectedCubelet.current.position.z === 1 &&
      selectedCubelet.current.position.x === 1 && Math.abs(dy) < Math.abs(dx)
    ) {
      // const temp = rowGroup.current;
      // rowGroup.current = colGroup.current;
      // colGroup.current = temp;
      // console.log(dragAxis.current);
      colGroup.current.forEach(c => rotatingGroup.current.add(c));
      dragAxis.current = 'z';
      // dragAxis.current = 'x';
      dragAmountFinal= dx >= 0? dragAmountRaw : -dragAmountRaw;

    }
    scene.add(rotatingGroup.current);
    // if (selectedFaceName.current === 'bottom') {
    //   // if(dragAxis.current === 'x')dragAxis.current = 'z';
    //   console.log(dragAxis.current);
    //   dragAxis.current = dragAxis.current === 'x' ? 'x' : dragAxis.current;
    //   dragAmountFinal = dragAmountRaw;
    // }
    // else if (selectedFaceName.current === 'top' && dragAxis.current === 'z') {
    //   // rowAxis.current = 'z';
    //   dragAmountFinal = dragAmountRaw;
    // }

    const angleDelta = dragAmountFinal * 0.0005; // adjust sensitivity as needed
    const newAngle = lastAngle.current + angleDelta;

    rotatingGroup.current.rotation[dragAxis.current] = newAngle;
    // Update lastAngle to current delta for smooth continuous rotation
    lastAngle.current = newAngle;
  }
};


  const onPointerUp = () => {
    if (!rotatingGroup.current) {
      selectedCubelet.current = null;
      selectedFaceName.current = null;
      orbitControlsRef.current.enabled = true;
      return;
    }
    const snappedAngle = Math.round(rotatingGroup.current.rotation[dragAxis.current] / (Math.PI / 2)) * (Math.PI / 2);
    rotatingGroup.current.rotation[dragAxis.current] = snappedAngle;
    rotatingGroup.current.updateMatrixWorld(true);

    // Bake transforms and re-parent cubelets
    [...rotatingGroup.current.children].forEach(cubelet => {
      cubelet.applyMatrix4(rotatingGroup.current.matrix);
      cubelet.updateMatrixWorld();
      cubeGroup.current.add(cubelet);
    });

    scene.remove(rotatingGroup.current);
    rotatingGroup.current = null;
    rowGroup.current = [];
    colGroup.current = [];
    dragAxis.current = null;
    startPoint.current = null;
    lastAngle.current = 0;
    selectedCubelet.current = null;
    selectedFaceName.current = null;
    direction.current = null;
    orbitControlsRef.current.enabled = true;
  };

  useEffect(() => {
    const dom = scene.userData.canvas || document.querySelector("canvas");
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointerleave", onPointerUp);
    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointerleave", onPointerUp);
    };
  }, [scene, camera, cubeGroup, orbitControlsRef]);

  return null;
}

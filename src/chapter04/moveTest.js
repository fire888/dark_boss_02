import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// --------------------------------------------------
// БАЗОВЫЕ ОБЪЕКТЫ
// --------------------------------------------------

const bugRoot = new THREE.Object3D();
scene.add(bugRoot);

const yawPivot = new THREE.Object3D();
bugRoot.add(yawPivot);

const pitchPivot = new THREE.Object3D();
yawPivot.add(pitchPivot);

pitchPivot.add(camera);
camera.position.set(0, 0.15, 0); // небольшое смещение "головы"

// для отладки можно показать оси
const axes = new THREE.AxesHelper(0.5);
bugRoot.add(axes);

// --------------------------------------------------
// ПРИМЕР ГЕОМЕТРИИ: пол + стена + потолок
// --------------------------------------------------

const mat = new THREE.MeshNormalMaterial({ wireframe: false });

const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), mat);
floor.position.set(0, -0.5, 0);
scene.add(floor);

const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1), mat);
wall.position.set(0, 4.5, -5.5);
scene.add(wall);

const ceiling = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), mat);
ceiling.position.set(0, 9.5, 0);
scene.add(ceiling);

const walkable = [floor, wall, ceiling];

// --------------------------------------------------
// СВЕТ
// --------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 1.0));

// --------------------------------------------------
// СОСТОЯНИЕ
// --------------------------------------------------

bugRoot.position.set(0, 0.51, 0);

let yaw = 0;
let pitch = 0;
const pitchLimit = THREE.MathUtils.degToRad(85);

const mouseSensitivity = 0.0025;
const moveSpeed = 3.0;
const normalLerpSpeed = 12.0;
const positionSnapOffset = 0.08; // "высота" над поверхностью

//const worldUp = new THREE.Vector3(0, 1, 0);
const currentUp = new THREE.Vector3();
const targetNormal = new THREE.Vector3(0, 1, 0);
const smoothedNormal = new THREE.Vector3(0, 1, 0);

// const tempVecA = new THREE.Vector3();
// const tempVecB = new THREE.Vector3();
// const tempVecC = new THREE.Vector3();
// const tempMat = new THREE.Matrix4();
const tempQuat = new THREE.Quaternion();

const raycaster = new THREE.Raycaster();

// --------------------------------------------------
// INPUT
// --------------------------------------------------

const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  yaw -= e.movementX * mouseSensitivity;
  pitch -= e.movementY * mouseSensitivity;
  pitch = THREE.MathUtils.clamp(pitch, -pitchLimit, pitchLimit);
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --------------------------------------------------
// ПОИСК НОРМАЛИ ПОВЕРХНОСТИ
// --------------------------------------------------

// Для простоты: ищем поверхность "под брюхом"
// луч пускаем в направлении -localUp
function getSurfaceInfo() {
  currentUp.set(0, 1, 0).applyQuaternion(bugRoot.quaternion).normalize();

  const origin = bugRoot.position.clone().addScaledVector(currentUp, 0.2);
  const dir = currentUp.clone().negate();

  raycaster.set(origin, dir);
  raycaster.far = 1.0;

  const hits = raycaster.intersectObjects(walkable, false);
  if (!hits.length) return null;

  const hit = hits[0];

  // face.normal локальная -> переводим в world
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();

  return {
    point: hit.point.clone(),
    normal: worldNormal
  };
}

// --------------------------------------------------
// ВЫРАВНИВАНИЕ ПО НОРМАЛИ
// --------------------------------------------------

function alignToSurfaceNormal(dt, desiredNormal) {
  // сглаживаем нормаль
  smoothedNormal.lerp(desiredNormal, 1 - Math.exp(-normalLerpSpeed * dt)).normalize();

  // текущий "up" объекта
  currentUp.set(0, 1, 0).applyQuaternion(bugRoot.quaternion).normalize();

  // quaternion, который довернёт текущий up в новую нормаль
  tempQuat.setFromUnitVectors(currentUp, smoothedNormal);

  // premultiply = повернуть в world-space
  bugRoot.quaternion.premultiply(tempQuat).normalize();
}

// --------------------------------------------------
// ПОСТРОЕНИЕ ВРАЩЕНИЯ ГОЛОВЫ ОТНОСИТЕЛЬНО НОРМАЛИ
// --------------------------------------------------

function updateViewRotation() {
  // yawPivot вращаем вокруг локального up персонажа
  yawPivot.quaternion.identity();
  yawPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), yaw);

  // pitchPivot вращаем вокруг локальной оси X
  pitchPivot.quaternion.identity();
  pitchPivot.rotateOnAxis(new THREE.Vector3(1, 0, 0), pitch);
}

// --------------------------------------------------
// ДВИЖЕНИЕ ПО КАСАТЕЛЬНОЙ ПЛОСКОСТИ
// --------------------------------------------------

function moveOnSurface(dt) {
  let inputX = 0;
  let inputZ = 0;

  if (keys['KeyW']) inputZ -= 1;
  if (keys['KeyS']) inputZ += 1;
  if (keys['KeyA']) inputX -= 1;
  if (keys['KeyD']) inputX += 1;

  if (inputX === 0 && inputZ === 0) return;

  // Направления берём от yawPivot, а не от всей камеры,
  // чтобы взгляд вверх/вниз не влиял на движение.
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(yawPivot.getWorldQuaternion(tempQuat));
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(yawPivot.getWorldQuaternion(tempQuat));
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(bugRoot.quaternion).normalize();

  // Проецируем на плоскость поверхности
  forward.projectOnPlane(up).normalize();
  right.projectOnPlane(up).normalize();

  const moveDir = new THREE.Vector3()
    .addScaledVector(right, inputX)
    .addScaledVector(forward, inputZ);

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    bugRoot.position.addScaledVector(moveDir, moveSpeed * dt);
  }
}

// --------------------------------------------------
// ПРИКЛЕЙКА К ПОВЕРХНОСТИ
// --------------------------------------------------

function snapToSurface(surfacePoint, surfaceNormal) {
  bugRoot.position.copy(surfacePoint).addScaledVector(surfaceNormal, positionSnapOffset);
}

// --------------------------------------------------
// LOOP
// --------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  const surface = getSurfaceInfo();
  if (surface) {
    targetNormal.copy(surface.normal);
    alignToSurfaceNormal(dt, targetNormal);
    snapToSurface(surface.point, smoothedNormal);
  }

  updateViewRotation();
  moveOnSurface(dt);

  renderer.render(scene, camera);
}

animate();
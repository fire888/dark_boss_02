import { _M } from '_CORE/_M/_m'
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createArrow, createMeshArrow } from '../geometry/arrow/arrow'

const scene = new THREE.Scene()
        
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, .1, 1000)
camera.position.set(30, 20, 0)
camera.lookAt(new THREE.Vector3(0, 1, -1))

scene.add(camera)

const amb = new THREE.AmbientLight(0xffffff, 1) 
scene.add(amb)

const dirLight = new THREE.DirectionalLight()
dirLight.position.set(100, 100, 0)
scene.add(dirLight)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
const containerDom = document.getElementById('container-game')
if (containerDom) containerDom.appendChild(renderer.domElement)
renderer.render(scene, camera)

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener( 'resize', onWindowResize)
onWindowResize()

const axesHelper = new THREE.AxesHelper(10)
axesHelper.position.set(.1, .1, .1)
scene.add(axesHelper)

const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}
animate()

///////////////////////////////////////////////////

// const b = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshNormalMaterial()
// )
// scene.add(b)

//////////////////////////////////////////////////

// const controls = new OrbitControls(camera, renderer.domElement)
// controls.target.set( 0, 0.5, 0 )
// controls.update()

/////////////////////////////////////////////////

const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide })
const arrowV = createArrow(15, 1)
const arrow = _M.createMesh({ v: arrowV.v, material: mat })
//arrow.scale.set(0, 0, -1)
scene.add(arrow)

const floor = new THREE.GridHelper(100, 10, 0xbbbbbb, 0x808080)
floor.position.y = 0
floor.position.x = 0
scene.add(floor)

const createBox = (pos: THREE.Vector3) => {
    const b = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 5),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    )
    b.position.copy(pos)
    scene.add(b)
}

for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 1000 - 500
    const y = Math.random() * 1000 - 500
    const z = Math.random() * 1000 - 500
    createBox(new THREE.Vector3(x, y, z))
}

///////////////////////////////////////////////////

class Player extends THREE.Object3D {
    dirUp: THREE.Object3D
    dir1: THREE.Object3D
    dir2: THREE.Object3D
    
    zeroObj: THREE.Object3D

    floor: THREE.GridHelper

    camArrow: THREE.Mesh

    _controls: PointerLockControls

    spdForward = 0
    spdLeft = 0

    constructor() {
        super()

        this.floor = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080)
        this.add(this.floor)

        this.dir1 = new THREE.Object3D()
        this.dir1.position.set(0, .5, .5).normalize()
        const dir1Arrow = createMeshArrow({ 
            endPos: new THREE.Vector3().copy(this.dir1.position).multiplyScalar(3), 
            color: new THREE.Color().setRGB(.3, .3, .3) 
        })
        scene.add(dir1Arrow)

        this.dir2 = new THREE.Object3D()
        this.dir2.position.set(.5, 0, 0).normalize()
        const dir2Arrow = createMeshArrow({ 
            endPos: new THREE.Vector3().copy(this.dir2.position).multiplyScalar(3), 
            color: new THREE.Color().setRGB(.3, .3, .5) 
        })
        scene.add(dir2Arrow)

        this.dirUp = new THREE.Object3D()
        this.dirUp.position.copy(this.dir1.position).cross(this.dir2.position).normalize()
        const dirUpArrow = createMeshArrow({ 
            endPos: new THREE.Vector3().copy(this.dirUp.position).multiplyScalar(15), 
            color: new THREE.Color().setRGB(.7, .7, .7) 
        })
        scene.add(dirUpArrow)


        this.zeroObj = new THREE.Object3D()
        
        const camArrowV = createArrow(5, 1)
        this.camArrow = _M.createMesh({ v: camArrowV.v, material: new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }) })
        this.camArrow.scale.z = -1
        this.zeroObj.add(this.camArrow)


        // @ts-ignore
        this._controls = new PointerLockControls(this.camArrow, renderer.domElement)
        this._controls.maxPolarAngle = Math.PI - .01
        this._controls.minPolarAngle = .01

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'KeyW') this.spdForward = -.5
            if (e.code === 'KeyS') this.spdForward = .5
            if (e.code === 'KeyA') this.spdLeft = -.5
            if (e.code === 'KeyD') this.spdLeft = .5
        })
        document.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.code === 'KeyW') this.spdForward = 0
            if (e.code === 'KeyS') this.spdForward = 0
            if (e.code === 'KeyA') this.spdLeft = 0
            if (e.code === 'KeyD') this.spdLeft = 0
        })
    }

    update() {
        this._controls.moveForward(this.spdForward)
        this._controls.moveRight(this.spdLeft)

        this.zeroObj.up.copy(this.dirUp.position)
        this.zeroObj.lookAt(this.dir1.position)

        this.floor.quaternion.copy(this.zeroObj.quaternion)
        
        //const applyTo = camera        
        const applyTo = arrow
        const wQ = new THREE.Quaternion()
        this.camArrow.getWorldQuaternion(wQ)
        applyTo.quaternion.copy(wQ)
        const p = new THREE.Vector3()
        this.camArrow.getWorldPosition(p)
        applyTo.position.copy(p)
    }

    lock() {
        this._controls.lock()
    }
    
    
}

const p = new Player()
p.position.set(15, 0, 15)
scene.add(p)

const animate2 = () => {
    requestAnimationFrame(animate2)
    p.update()
}
animate2()

document.addEventListener('click', () => p.lock())

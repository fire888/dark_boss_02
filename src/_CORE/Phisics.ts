import { 
    Body, 
    World, 
    GSSolver, 
    SplitSolver, 
    NaiveBroadphase,
    Material,
    ContactMaterial,
    Trimesh,
    //Box,
    //Vec3,
    Sphere,
} from 'cannon-es'
import { Object3D } from 'three'
import CannonDebugger from 'cannon-es-debugger'
import * as THREE from 'three'
import { Core } from './types'

const Q_ZERO = new THREE.Quaternion()
const V3_TOP = new THREE.Vector3(0, 1, 0)

class BodyN extends Body {
    myName: string = 'none'
}

const createTrimesh = (geometry: THREE.BufferGeometry) => {
    const vertices = geometry.attributes.position.array
    const vv: number[] = []
    for (let i = 0; i < vertices.length; ++i) {
        vv[i] = vertices[i]
    }
    const indices = Object.keys(vertices).map(Number)
    return new Trimesh(vv, indices)
}

export class Phisics {
    _cbsOnBeginEndContacts: { 
        [key: string]: { begin?: () => void, end?: () => void } 
    } = {}
    _bodies: BodyN[] = []
    _bodiesToRemove: BodyN[] = []
    isUpdate = true
    world: World
    isGround = false
    physicsMaterial: Material
    ground: BodyN
    playerBody: BodyN
    carBody: BodyN
    cannonDebugger: any

    init (root: Core) {
        this.world = new World()
        //this.world.gravity.set(0, -9.82, 0)
        this.world.gravity.set(0, 0, 0)
        this.world.quatNormalizeSkip = 0
        this.world.quatNormalizeFast = false

        var solver = new GSSolver()

        this.world.defaultContactMaterial.contactEquationStiffness = 1e9
        this.world.defaultContactMaterial.contactEquationRelaxation = 4

        solver.iterations = 7
        solver.tolerance = 0.1
        this.world.solver = new SplitSolver(solver);

        this.world.broadphase = new NaiveBroadphase();
        this.world.broadphase.useBoundingBoxes = true;

        // Create a slippery material (friction coefficient = 0.0)
        this.physicsMaterial = new Material("slipperyMaterial")
        var physicsContactMaterial = new ContactMaterial(
            this.physicsMaterial,
            this.physicsMaterial,
            {
                //friction: 0.1, // friction coefficient
               // restitution: 1  // restitution
                friction: 0.0,
                restitution: 1.0
            },

        );
        // We must add the contact materials to the world
        this.world.addContactMaterial(physicsContactMaterial);

        // DEBUGGER PHISICS
        // @ts-ignore
        // this.cannonDebugger = new CannonDebugger(root.studio.scene, this.world, {})
    }

    createPlayer () {
        const sphere = new Sphere(.5)
        this.playerBody = new BodyN({ 
            mass: 5,
            linearDamping: 0.9,
        })
        this.playerBody.myName = 'playerBody'
        this.playerBody.addShape(sphere)

        this.world.addBody(this.playerBody)

        this.world.addEventListener('beginContact', (event: any) => {
            const { bodyA, bodyB } = event;
            if (bodyA.id === 0 && bodyB.id !== 0) {
                this.isGround = true 
            }
            this._checkCbsContacts('playerBody', 'beginContact', event)
        })
        this.world.addEventListener('endContact', (event: any) => {
            const { bodyA, bodyB } = event;
            if (bodyA && bodyB && bodyA.id === 0 && bodyB.id !== 0) {
                this.isGround = false
            }
            this._checkCbsContacts('playerBody', 'endContact', event)
        })
    }

    createCar () {
        const sphere = new Sphere(2)
        this.carBody = new BodyN({ 
            mass: 100,
            linearDamping: .99,
        })
        this.carBody.myName = 'carBody'
        this.carBody.addShape(sphere)

        this.world.addBody(this.carBody)

        this.world.addEventListener('beginContact', (event: any) => {
            this._checkCbsContacts('carBody', 'beginContact', event)
        })
        this.world.addEventListener('endContact', (event: any) => {
            this._checkCbsContacts('carBody', 'endContact', event)
        })
    }
    
    addMeshToCollision (mesh: THREE.Mesh, stopIfCollide: boolean = true) {
        const cannonShape = createTrimesh(mesh.geometry)
        const body = new BodyN({ 
            mass: 0, 
            type: Body.STATIC, 
        })
        body.addShape(cannonShape)
        body.myName = mesh.name
        // body.collisionResponse = 0;

        body.position.x = mesh.position.x
        body.position.y = mesh.position.y
        body.position.z = mesh.position.z

        body.quaternion.x = mesh.quaternion.x
        body.quaternion.y = mesh.quaternion.y
        body.quaternion.z = mesh.quaternion.z
        body.quaternion.w = mesh.quaternion.w

        if (!stopIfCollide) { 
            body.collisionResponse = false 
        }
 
        this.world.addBody(body)
        this._bodies.push(body)
    }

    addListen(nameBody: string, nameEvent: string, f: () => void) {
        if (nameEvent === 'beginContact') {
            if (!this._cbsOnBeginEndContacts[nameBody]) this._cbsOnBeginEndContacts[nameBody] = {}
            this._cbsOnBeginEndContacts[nameBody].begin = f
        }

        if (nameEvent === 'endContact') {
            if (!this._cbsOnBeginEndContacts[nameBody]) this._cbsOnBeginEndContacts[nameBody] = {}
            this._cbsOnBeginEndContacts[nameBody].end = f
        }
    }

    onCollision (meshNameIncludeStr: string, f: (name: string) => void) {
        for (let i = 0; i < this._bodies.length; ++i) {
            if (!this._bodies[i].myName.includes(meshNameIncludeStr)) {
                continue;
            }
            this._bodies[i].addEventListener("collide", (e: any) => {
                f(e.target.myName)
            })
        }
    }

    removeMeshFromCollision (name: string) {
        for (let i = 0; i < this._bodies.length; ++i) {
            if (this._bodies[i].myName !== name) {
                continue
            }
            this._bodiesToRemove.push(this._bodies[i])
        }
    }

    update () {
        if (!this.playerBody) {
            return
        }
        if (!this.isUpdate) {
            return
        }
        this.world.fixedStep()
        if (this.cannonDebugger) this.cannonDebugger.update()

        if (this._bodiesToRemove.length > 0) {
            for (let i = 0; i < this._bodiesToRemove.length; ++i) {
                this.world.removeBody(this._bodiesToRemove[i])
            }
            this._bodiesToRemove = []
        }
    }

    setPlayerPosition (x: number, y: number, z: number) {
        this.playerBody.position.x = x
        this.playerBody.position.y = y
        this.playerBody.position.z = z
    }

    stopPlayerBody () {
        this.playerBody.velocity.x = 0
        this.playerBody.velocity.z = 0
    }

    sleepPlayerBody () {
        this.playerBody.sleep()
    }

    setIsUpdate(is: boolean) {
        this.isUpdate = is
    }

    switchToAntiGravity () {
        this.world.gravity.set(0, 5, 0)
    }
    switchToGravity () {
        this.world.gravity.set(0, -9.82, 0)
    }

    switchToGravityGorizontalBoost () {
        this.world.gravity.set(0, 0, 75)
    }

    setPositionByKey(key: string, x: number, y: number, z: number, rotY = 0) {
        const q = Q_ZERO.clone().setFromAxisAngle(V3_TOP, rotY)
        for (let i = 0; i < this._bodies.length; ++i) {
            if (this._bodies[i].myName === key) {
                this._bodies[i].position.set(x, y, z)
                this._bodies[i].quaternion.x = q.x
                this._bodies[i].quaternion.y = q.y
                this._bodies[i].quaternion.z = q.z
                this._bodies[i].quaternion.w = q.w
                this._bodies[i].updateAABB()
            }
        }
    }

    _checkCbsContacts(name1: string, keyEvent: string, event: any) {
        const { bodyA, bodyB } = event
        
        let playerBody 
        let anotherBody
        if (bodyA && bodyA.myName === name1) { 
            playerBody = bodyA
            anotherBody = bodyB
        }
        if (bodyB && bodyB.myName === name1) { 
            playerBody = bodyB
            anotherBody = bodyA 
        }
        if (playerBody && anotherBody) {
            for (const key in this._cbsOnBeginEndContacts) {
                if (anotherBody.myName.includes(key)) {
                    if (keyEvent === 'beginContact') { 
                        this._cbsOnBeginEndContacts[key]?.begin && this._cbsOnBeginEndContacts[key]?.begin()  
                    }
                    if (keyEvent === 'endContact') { 
                        this._cbsOnBeginEndContacts[key]?.end && this._cbsOnBeginEndContacts[key]?.end() 
                    } 
                }
            }
        }
    }
    
}

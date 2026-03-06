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
import { Root } from 'index'
import { IS_PHISICS_DEBUG } from 'constants/CONSTANTS'

class BodyN extends Body {
    myName: string
    myObject3D: THREE.Object3D
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
    _cbsOnCollision: (() => void)[] = []
    _bodies: BodyN[] = []
    _bodiesToRemove: BodyN[] = []
    world: World
    isGround = false
    physicsMaterial: Material
    ground: BodyN
    playerBody: BodyN
    cannonDebugger: any

    init (root: Root) {
        this.world = new World()
        this.world.gravity.set(0, -9.82, 0)
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

        if (IS_PHISICS_DEBUG) {
            // @ts-ignore
            this.cannonDebugger = new CannonDebugger(root.studio.scene, this.world, {})
        }
    }

    createPlayerPhisicsBody (playerPosition: number[]) {
        const sphere = new Sphere(.5);
        this.playerBody = new BodyN({ 
            mass: 5,
            linearDamping: 0.9,
        })
        this.playerBody.myName = 'playerBody'
        this.playerBody.addShape(sphere)

        this.playerBody.position.x = playerPosition[0]
        this.playerBody.position.y = playerPosition[1]
        this.playerBody.position.z = playerPosition[2]

        this.playerBody.myObject3D = new Object3D()
        this.playerBody.myObject3D.position.set(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z)

        this.playerBody.myObject3D.rotation.y = Math.PI

        this.playerBody.myObject3D.position.set(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z)
        this.playerBody.quaternion.set(
            this.playerBody.myObject3D.quaternion.x,
            this.playerBody.myObject3D.quaternion.y,
            this.playerBody.myObject3D.quaternion.z,
            this.playerBody.myObject3D.quaternion.w,
        )


        this.world.addBody(this.playerBody)

        this.world.addEventListener('beginContact', (event: any) => {
            const { bodyA, bodyB } = event;
            if (bodyA.id === 0 && bodyB.id !== 0) {
                this.isGround = true 
            }
        })
        this.world.addEventListener('endContact', (event: any) => {
            const { bodyA, bodyB } = event;
            if (bodyA && bodyB && bodyA.id === 0 && bodyB.id !== 0) {
                this.isGround = false
            }
        })
    }
    
    addMeshToCollision (mesh: THREE.Mesh) {
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
 
        this.world.addBody(body)
        this._bodies.push(body)
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
        this.world.fixedStep()
        if (this.cannonDebugger) this.cannonDebugger.update()

        if (this._bodiesToRemove.length > 0) {
            for (let i = 0; i < this._bodiesToRemove.length; ++i) {
                this.world.removeBody(this._bodiesToRemove[i])
            }
            this._bodiesToRemove = []
        }
    }

    setPlayerPosition (x: number, y: number, z: number, rotY = Math.PI) {
        this.playerBody.position.x = x
        this.playerBody.position.y = y
        this.playerBody.position.z = z

        this.playerBody.myObject3D.rotation.y = rotY

        this.playerBody.myObject3D.position.set(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z)
        this.playerBody.quaternion.set(
            this.playerBody.myObject3D.quaternion.x,
            this.playerBody.myObject3D.quaternion.y,
            this.playerBody.myObject3D.quaternion.z,
            this.playerBody.myObject3D.quaternion.w,
        )
        
    }

    stopPlayerBody () {
        this.playerBody.velocity.x = 0
        this.playerBody.velocity.z = 0
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
}

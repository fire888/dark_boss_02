import { 
    Body, 
    World, 
    GSSolver, 
    SplitSolver, 
    NaiveBroadphase,
    Material,
    ContactMaterial,
    Trimesh,
    Box,
    Vec3,
    Sphere,
} from 'cannon-es'
import { Object3D } from 'three'
import CannonDebugger from 'cannon-es-debugger'

const createTrimesh = geometry => {
    const vertices = geometry.attributes.position.array
    const indices = Object.keys(vertices).map(Number)
    return new Trimesh(vertices, indices)
}

export class Phisics {
    _cbsOnCollision = []
    _bodies = []
    _bodiesToRemove = []
    isGround = false

    init (root) {
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

        this.ground = new Body({
            type: Body.STATIC,
            shape: new Box(new Vec3(500, 0.1, 500)),
        })
        //this.ground.scale.set(1000, 1, 1000)
        this.ground._myName = 'ground'
        //this.ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        this.world.addBody(this.ground)

        this._levelsPhisicsMeshes = []


        if (root.CONSTANTS.PHISICS_CONF.IS_DEBUG) {
            this.cannonDebugger = new CannonDebugger(root.studio.scene, this.world, {})
        }
    }

    createPlayerPhisicsBody (playerPosition) {
        const sphere = new Sphere(.5);
        this.playerBody = new Body({ 
            mass: 5,
            linearDamping: 0.9,
        })
        this.playerBody._myName = 'playerBody'
        this.playerBody.addShape(sphere)

        this.playerBody.position.x = playerPosition[0]
        this.playerBody.position.y = playerPosition[1]
        this.playerBody.position.z = playerPosition[2]

        this.playerBody._object3D = new Object3D()
        this.playerBody._object3D.position.set(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z)
        this.playerBody._object3D.rotation.y = Math.PI

        this.world.addBody(this.playerBody)

        this.world.addEventListener('beginContact', (event) => {
            const { bodyA, bodyB } = event;
            if (bodyA.id === 0 && bodyB.id === 1) {
                this.isGround = true 
            }
        })
        this.world.addEventListener('endContact', (event) => {
            const { bodyA, bodyB } = event;
            if (bodyA.id === 0 && bodyB.id === 1) {
                this.isGround = false
            }
        })
    }
    
    addMeshToCollision (mesh) {
        const cannonShape = createTrimesh(mesh.geometry)
        const body = new Body({ 
            mass: 0, 
            type: Body.STATIC, 
        })
        mesh.geometry.dispose()
        body.addShape(cannonShape)
        body._myName = mesh.name
        //body.collisionResponse = 0;

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

    onCollision (meshNameIncludeStr, f) {
        for (let i = 0; i < this._bodies.length; ++i) {
            if (!this._bodies[i]._myName.includes(meshNameIncludeStr)) {
                continue;
            }
            this._bodies[i].addEventListener("collide", e => {
                f(e.target._myName)
            })
        }
    }

    removeMeshFromCollision (name) {
        for (let i = 0; i < this._bodies.length; ++i) {
            if (this._bodies[i]._myName !== name) {
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

    setPlayerPosition (x, y, z) {
        this.playerBody.position.x = x
        this.playerBody.position.y = y
        this.playerBody.position.z = z

        this.playerBody._object3D.position.set(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z)
        this.playerBody._object3D.rotation.y = Math.PI
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

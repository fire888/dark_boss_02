import { 
    Object3D, 
    Mesh, 
    MeshPhongMaterial, 
    MeshBasicMaterial,
    Vector3,
} from 'three'
import { LabLevel } from './LabLevel'
import { createStair } from '../../geometry/stair'
import { TopTunnel } from './TopTunnel'
import { createRandomDataForLine } from '../../geometry/_lineGeom'
import { _M } from "../../geometry/_m"
import { Root } from '../../index'
import { PosesSleepEnds, Dir, DataToCreateLine } from './types'
import * as THREE from 'three'

const LEVEL_H = 5
const W = 3
const N = 7

export class Lab {
    mesh: Object3D
    nameSpace = 'collision_lab_'
    lastDir: Dir = null
    posesSleepEnds: PosesSleepEnds[] = []

    private _namesMeshes: string[] = []
    private _meshes: Mesh[] = []
    private _root: Root

    private _material: MeshPhongMaterial
    private _collisionMaterial: MeshBasicMaterial

    private _topTunnel: TopTunnel

    async init (root: Root, params = { TILES_X: 11, TILES_Z: 13, FLOORS_NUM: 5 }) {
        const {
            TILES_X,
            TILES_Z,
            FLOORS_NUM,
        } = params


        this._root = root

        const { phisics } = root

        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(500, 0.1, 500),
            new THREE.MeshBasicMaterial()
        )
        ground.name = 'ground'
        root.phisics.addMeshToCollision(ground)

        if (!this.mesh) {
            this.mesh = new Object3D()
        }

        this.posesSleepEnds = []

        if (!this._material) {
            this._material = new MeshPhongMaterial({ 
                color: 0xFFFFFF, 
                vertexColors: true,
                envMap: root.assets.sky,
                reflectivity: .6,
            })
            this._collisionMaterial = new MeshBasicMaterial({ color: 0xFFFF00 })
        }


        // start stair *******************************************/

        const stairDataBottom: DataToCreateLine = createRandomDataForLine()
        stairDataBottom.dir = Dir.NORTH
        const stairDataCenterB: DataToCreateLine = createRandomDataForLine()
        const stairDataCenterT: DataToCreateLine = createRandomDataForLine()
        const stairDataTop: DataToCreateLine = createRandomDataForLine()
        stairDataTop.dir = Dir.SOUTH

        const startStair = createStair({ 
            stairDataBottom, 
            stairDataCenterB,
            stairDataCenterT,
            stairDataTop, 
            n: N, 
            w: W, 
            h: LEVEL_H,
        })
        const stairMesh = _M.createMesh({
            v: startStair.v,
            c: startStair.c,
            material: this._material,
        })
        stairMesh.position.x = W * 5
        stairMesh.position.z = W
        stairMesh.name = 'view_start_stair'
        this.mesh.add(stairMesh)
        this._meshes.push(stairMesh)

        const collisionStairMesh = _M.createMesh({
            v: startStair.vC,
            material: this._collisionMaterial,
        })
        collisionStairMesh.name = this.nameSpace + 'start_stair'
        this._namesMeshes.push(collisionStairMesh.name)
        collisionStairMesh.position.x = W * 5
        collisionStairMesh.position.z = W
        phisics.addMeshToCollision(collisionStairMesh)


        // levels *******************************************/

        let posStart: [number, number] = [5, 1]
        let posStartDir: Dir = stairDataTop.dir
        let dataForEnter = stairDataTop


        // level 
        for (let i = 0; i < FLOORS_NUM; ++i) {
            // create level
            const labLevel = new LabLevel()
            await labLevel.init(root, {
                posStart,
                posStartDir, 
                dataForEnter,
                numTilesX: TILES_X, 
                numTilesZ: TILES_Z,
                w: W,
                n: N,
                material: this._material, 
                collisionMaterial: this._collisionMaterial,
            })
            labLevel.mesh.position.y = LEVEL_H * i + LEVEL_H
            labLevel.mesh.name = 'view_lab_level_' + i
            this.mesh.add(labLevel.mesh)
            this._meshes.push(labLevel.mesh)

            labLevel.collisionMesh.position.y = LEVEL_H * i + LEVEL_H
            labLevel.collisionMesh.name = this.nameSpace + i
            this._namesMeshes.push(labLevel.collisionMesh.name)
            phisics.addMeshToCollision(labLevel.collisionMesh)


            // create stair
            const stairDataTopExit = createRandomDataForLine()
            let bottomDir = null
            if (labLevel.dirToPosEnd === Dir.NORTH) {
                bottomDir = Dir.SOUTH
            }
            if (labLevel.dirToPosEnd === Dir.SOUTH) {
                bottomDir = Dir.NORTH
            }
            if (labLevel.dirToPosEnd === Dir.WEST) {
                bottomDir = Dir.EAST
            }
            if (labLevel.dirToPosEnd === Dir.EAST) {
                bottomDir = Dir.WEST
            }

            let topDirFull = [Dir.NORTH, Dir.WEST, Dir.SOUTH, Dir.EAST]
            topDirFull = topDirFull.filter(elem => elem !== bottomDir)
            if (labLevel.posEnd[0] < 3) {
                topDirFull = topDirFull.filter(elem => elem !== Dir.WEST)
            }
            if (labLevel.posEnd[1] < 3) {
                topDirFull = topDirFull.filter(elem => elem !== Dir.NORTH)
            }
            if (labLevel.posEnd[0] > TILES_X - 3) {
                topDirFull = topDirFull.filter(elem => elem !== Dir.EAST)
            }
            if (labLevel.posEnd[1] > TILES_Z - 3) {
                topDirFull = topDirFull.filter(elem => elem !== Dir.SOUTH)
            }
            const dirTop = topDirFull[Math.floor(Math.random() * topDirFull.length)]
            stairDataTopExit.dir = dirTop

            const stair = createStair({
                stairDataBottom: {
                    path: labLevel.pathToPosEnd,
                    form: labLevel.formToPosEnd,
                    color: labLevel.colorToPosEnd,
                    dir: bottomDir,
                }, 
                stairDataCenterB: createRandomDataForLine(), 
                stairDataCenterT: createRandomDataForLine(), 
                stairDataTop: stairDataTopExit, 
                n: N, 
                w: W, 
                h: LEVEL_H,                
            })
            const stairMesh = _M.createMesh({
                v: stair.v,
                c: stair.c,
                material: this._material,
            })
            stairMesh.position.x = W * labLevel.posEnd[0]
            stairMesh.position.z = W * labLevel.posEnd[1]
            stairMesh.position.y = (i + 1) * LEVEL_H
            stairMesh.name = 'view_lab_stair_' + i
            this.mesh.add(stairMesh)
            this._meshes.push(stairMesh)

            const collisionMesh = _M.createMesh({
                v: stair.vC,
                material: this._collisionMaterial,
            })
            collisionMesh.name = this.nameSpace + 'collision_' + i
            this._namesMeshes.push(collisionMesh.name)
            collisionMesh.position.x = W * labLevel.posEnd[0]
            collisionMesh.position.z = W * labLevel.posEnd[1]
            collisionMesh.position.y = (i + 1) * LEVEL_H
            phisics.addMeshToCollision(collisionMesh)

            // save for next level
            posStart = labLevel.posEnd
            posStartDir = stairDataTopExit.dir
            dataForEnter = stairDataTopExit

            // save poses for energy 
            for (let j = 0; j < labLevel.posesSleepEnds.length; ++j) {
                labLevel.posesSleepEnds[j].x = labLevel.posesSleepEnds[j].xI * W 
                labLevel.posesSleepEnds[j].z = (labLevel.posesSleepEnds[j].yI - 1) * W 
                labLevel.posesSleepEnds[j].y = LEVEL_H * (i + 1)
            }

            this.posesSleepEnds.push(labLevel.posesSleepEnds)
        }


        // top tunnel ***********************************************************/

        this._topTunnel = new TopTunnel()
        this._topTunnel.init(
            root,
            {
                ...dataForEnter,
                material: this._material, 
                collisionMaterial: this._collisionMaterial, 
                w: W,
                posStartDir,
            } 
        )
        const pos = new Vector3(posStart[0] * W,  (FLOORS_NUM + 1) * LEVEL_H, posStart[1] * W)
        const offset = W + (this._topTunnel.W / 2) + W / 2
        const doorCollisionPos = new Vector3().copy(pos)
        let rotationCollision = 0

        if (posStartDir === 'n') {
            rotationCollision = Math.PI / 2
            doorCollisionPos.z -= W * 7
            pos.z -= offset
        }
        if (posStartDir === 'e') {
            pos.x += offset
            doorCollisionPos.x += W * 7
        }
        if (posStartDir === 's') {
            rotationCollision = Math.PI / 2
            pos.z += offset
            doorCollisionPos.z += W * 7
        }
        if (posStartDir === 'w') {
            pos.x -= offset
            doorCollisionPos.x -= W * 7
        }


        // phisics close dooor
        this._topTunnel.meshDoorCollision.name = this.nameSpace + 'top_tunnel_door'
        this._namesMeshes.push(this._topTunnel.meshDoorCollision.name) 
        this._topTunnel.meshDoorCollision.position.copy(doorCollisionPos)
        phisics.addMeshToCollision(this._topTunnel.meshDoorCollision)

        // phisics corridor collision
        this._topTunnel.meshCollision.name = this.nameSpace + 'top_tunnel'
        this._namesMeshes.push(this._topTunnel.meshCollision.name)
        this._topTunnel.meshCollision.rotation.y = rotationCollision
        this._topTunnel.meshCollision.position.copy(pos)
        phisics.addMeshToCollision(this._topTunnel.meshCollision)

        // tunnel mesh
        this._topTunnel.mesh.position.copy(pos)
        this.mesh.add(this._topTunnel.mesh)
        this._meshes.push(this._topTunnel.mesh)

        this.lastDir = posStartDir
    } 

    async openDoor () {
        this._root.phisics.removeMeshFromCollision('collision_lab_door')
        await this._topTunnel.openDoor()
    }

    destroy() {
        this.posesSleepEnds = []
        for (let i = 0; i < this._namesMeshes.length; ++i) {
            this._root.phisics.removeMeshFromCollision(this._namesMeshes[i])
        }
        this.mesh.remove(this._topTunnel.mesh)
        this._topTunnel.destroy()
        

        this._meshes.forEach(m => {
            m.geometry.dispose()
            this.mesh.remove(m)
        })
        this._meshes = []
    }
}
import * as THREE from 'three'
import { tunnel00 } from 'geometry/04_tunnel00/tunnel00'
import { room00 } from 'geometry/05_room00/room_00'
import { _M, IArraysGeom } from '_CORE/_M/_m'
import { Root } from '../../../index'
import { Scheme } from './Scheme'

const ZERO_Y = -2.5

export class InnerLab {
    _root: Root
    mesh: THREE.Mesh
    meshCollision: THREE.Mesh

    constructor(root: Root) {
        this._root = root
        const { studio, materials, phisics } = this._root

        /////////////////////////////////

        this.#calcLevel()

        ////////////////////////////////

        const W = 100, H = 100, D = -150
        
        const g: IArraysGeom = { v: [], c: [], index: [] } 

        const t = tunnel00({
            w0: 2, h0: 4, 
            w1: 2, h1: 4, 
            d: 30 
        })
        _M.translateVertices(t.v, 0, 4.5, D)
        _M.mergeIndexedArrays(g, t)

        const r = room00()
        _M.translateVertices(r.v, 0, 4, D - 30 - 15)
        _M.mergeIndexedArrays(g, r)

        this.mesh = _M.createMesh({ ...g, material: materials.levelMatNorm })
        this.mesh.position.set(0, ZERO_Y, 0)
        this.mesh.geometry.computeVertexNormals()
        studio.add(this.mesh)

        const collG1 = this.mesh.geometry.clone().toNonIndexed()
        this.meshCollision = new THREE.Mesh(collG1, materials.collision)
        this.meshCollision.position.set(0, ZERO_Y, 0)
        phisics.addMeshToCollision(this.meshCollision, true)
    }

    async #calcLevel() {
        const sh = new Scheme(this._root)
        await sh.create()
        
        console.log('sh !!!!', sh)


        // MAKE NODE PLATFORMS
        const RADIUS_NODE = 2
        const W_SIDE = .5

        const v: number[] = []
        const c: number[] = [] 

        for (let key in sh.points) {
            const p = sh.points[key]

            const nData = []

            // добавляем направления к соседям
            for (let i = 0; i < p.neighbors.length; ++i) {
                const nId = p.neighbors[i]
                const n = sh.points[nId]
                
                const directToNeighbor = n.pos.clone().sub(p.pos).setY(0).normalize()

                const perp = directToNeighbor.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(W_SIDE)
                const leftPLocal = directToNeighbor.clone().multiplyScalar(RADIUS_NODE).add(perp)
                const rightPLocal = directToNeighbor.clone().multiplyScalar(RADIUS_NODE).sub(perp)
                const angle = _M.angleFromCoords2(directToNeighbor.x, directToNeighbor.z)
                const angleLeft = _M.angleFromCoords2(leftPLocal.x, leftPLocal.z)
                const angleRight = _M.angleFromCoords2(rightPLocal.x, rightPLocal.z)
                nData.push({
                    nId,
                    directToNeighbor,
                    angle,
                    leftPLocal, angleLeft,
                    rightPLocal, angleRight
                })



                const yL = _M.createLabel('left', [1, 0, 0], 5)
                const yLP = new THREE.Vector3(2, 1.5, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleLeft).add(p.pos)
                yL.position.copy(yLP)
                this._root.studio.add(yL)
            }

            nData.sort((a, b) => a.angle - b.angle)

 
            for (let i = 0; i < nData.length; ++i) {
                const curr = nData[i]

                //в сторону соседа
                v.push(
                    ...p.pos.toArray(),
                    ...curr.rightPLocal.clone().add(p.pos).toArray(),
                    ...curr.leftPLocal.clone().add(p.pos).toArray()
                )
                c.push(
                    1, 1, 0,
                    1, 1, 0,
                    1, 1, 0
                )

                // закрыть пустоту
                let next = nData[i + 1] 
                if (!next) next = nData[0]

                let currAngleLeft = curr.angleLeft
                let nextAngleRight = next.angleRight
                if (nextAngleRight < currAngleLeft) nextAngleRight += Math.PI * 2
                
                while (currAngleLeft < nextAngleRight) {
                    let localRightAngle = currAngleLeft + .3
                    if (localRightAngle > nextAngleRight) localRightAngle = nextAngleRight

                    const lP = currAngleLeft === curr.angleLeft 
                        ? curr.leftPLocal.clone().add(p.pos) 
                        : new THREE.Vector3(RADIUS_NODE, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), currAngleLeft).add(p.pos)
                    const rP = localRightAngle === nextAngleRight 
                        ? next.rightPLocal.clone().add(p.pos)
                        : new THREE.Vector3(RADIUS_NODE, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), localRightAngle).add(p.pos)

                    v.push(...rP.toArray(), ...p.pos.toArray(), ...lP.toArray())
                    c.push(
                        0, 1, 1,
                        0, 1, 1,
                        0, 1, 1,
                    )
                    currAngleLeft = localRightAngle
                }
            }
        }

        const m = _M.createMesh({ 
            v, c, 
            material: new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }) 
        })
        this._root.studio.add(m)
        this.#testRotate()
    }


    #testRotate() {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshNormalMaterial()
        )
        this._root.studio.add(m)

        const v = new THREE.Vector3(0, 0, -5)

        const animate = () => {
            v.applyAxisAngle(new THREE.Vector3(0, 1, 0), .01)
            m.position.copy(v)
            console.log(m.rotation.y)

            requestAnimationFrame(animate)
        }

        animate()

        // {
        //     const v = new THREE.Vector3(1, 0, -.01).normalize()
        //     let angle = Math.atan2(-v.z, v.x);
        //     if (angle < 0) angle += 2 * Math.PI; // привести к [0, 2π)
        // }



    } 
}

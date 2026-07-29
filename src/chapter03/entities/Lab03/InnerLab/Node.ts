import * as THREE from 'three'
import { TSchemePoint, Scheme } from './Scheme'
import { _M, IArraysGeom } from '_CORE/_M/_m'
import { Root } from '../../../index' 


type Neighbor = {
    id: string
    dir: THREE.Vector3, angle: number
    leftPLocal: THREE.Vector3, angleLeft: number
    rightPLocal: THREE.Vector3, angleRight: number
}

// MAKE NODE PLATFORMS
const RADIUS_NODE = 4
const W_SIDE = 1.3

export class Node {
    id: string
    pos: THREE.Vector3
    visible: boolean
    neighbors: {
        [key: string]: Neighbor
    } = {}
    _root: Root

    constructor(key: string, sh: Scheme, root: Root) {
        this._root = root
        
        this.id = key
        this.pos = sh.points[key].pos
        this.visible = sh.points[key].visible

        const neighbors = sh.points[key].neighbors

        // добавляем направления к соседям
        for (let i = 0; i < neighbors.length; ++i) {
            const nId = neighbors[i]
            const n = sh.points[nId]
            
            const dir = n.pos.clone().sub(this.pos).setY(0).normalize()

            const perp = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(W_SIDE)
            const leftPLocal = dir.clone().multiplyScalar(RADIUS_NODE).add(perp)
            const rightPLocal = dir.clone().multiplyScalar(RADIUS_NODE).sub(perp)
            const angle = _M.angleFromCoords2(dir.x, dir.z)
            const angleLeft = _M.angleFromCoords2(leftPLocal.x, leftPLocal.z)
            const angleRight = _M.angleFromCoords2(rightPLocal.x, rightPLocal.z)
            this.neighbors[nId] = {
                id: nId,
                dir,
                angle,
                leftPLocal, angleLeft,
                rightPLocal, angleRight
            }

            //const yL = _M.createLabel('left', [1, 0, 0], 5)
            //const yLP = new THREE.Vector3(2, 1.5, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleLeft).add(p.pos)
            //yL.position.copy(yLP)
            //this._root.studio.add(yL)
        }
    }

    getAttr() {
        const v: number[] = []
        const c: number[] = []
        const index: number[] = []

        if (this.visible) {
            let currInd = 0 

            const neighbors: Neighbor[] = []
            for (let key in this.neighbors) {
                neighbors.push(this.neighbors[key])
            }
            neighbors.sort((a, b) => a.angle - b.angle)

            for (let i = 0; i < neighbors.length; ++i) {
                const curr = neighbors[i]

                //в сторону соседа низ
                v.push(
                    ...this.pos.toArray(),
                    ...curr.rightPLocal.clone().add(this.pos).toArray(),
                    ...curr.leftPLocal.clone().add(this.pos).toArray()
                )
                c.push(
                    1, 1, 0,
                    1, 1, 0,
                    1, 1, 0
                )
                index.push(currInd, currInd + 1, currInd + 2)
                currInd += 3


                // в сторону соседа верх
                v.push(
                    ...new THREE.Vector3(0, 2.5, 0).add(this.pos).toArray(),
                    ...new THREE.Vector3(0, 2.5, 0).add(curr.leftPLocal).add(this.pos).toArray(),
                    ...new THREE.Vector3(0, 2.5, 0).add(curr.rightPLocal).add(this.pos).toArray()
                )
                c.push(
                    .1, .1, .1,
                    .1, .1, .1,
                    .1, .1, .1,
                )
                index.push(currInd, currInd + 1, currInd + 2)
                currInd += 3


                // закрыть пустоту нежду проемами
                let next = neighbors[i + 1] 
                if (!next) next = neighbors[0]

                let currAngleLeft = curr.angleLeft
                let nextAngleRight = next.angleRight
                if (nextAngleRight < currAngleLeft) nextAngleRight += Math.PI * 2
                
                while (currAngleLeft < nextAngleRight) {
                    let localRightAngle = currAngleLeft + .5
                    if (localRightAngle > nextAngleRight) localRightAngle = nextAngleRight

                    const lP = currAngleLeft === curr.angleLeft 
                        ? curr.leftPLocal.clone().add(this.pos) 
                        : new THREE.Vector3(RADIUS_NODE, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), currAngleLeft).add(this.pos)
                    const rP = localRightAngle === nextAngleRight 
                        ? next.rightPLocal.clone().add(this.pos)
                        : new THREE.Vector3(RADIUS_NODE, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), localRightAngle).add(this.pos)

                    v.push(...rP.toArray(), ...this.pos.toArray(), ...lP.toArray())
                    c.push(
                        0, 1, 1,
                        0, 1, 1,
                        0, 1, 1,
                    )
                    index.push(currInd, currInd + 1, currInd + 2)
                    currInd += 3

                    const topLP = lP.clone()
                    topLP.y += 2.5
                    const topRP = rP.clone()
                    topRP.y += 2.5

                    { // стена
                        const _v = _M.createPolygonV(rP, lP, topLP, topRP)
                        _M.fill(_v, v)
                        const _c = _M.fillColorFace([1, 1, 1])
                        _M.fill(_c, c)
                        index.push(currInd, currInd + 1, currInd + 2, currInd + 3, currInd + 4, currInd + 5)
                        currInd += 6
                    }

                    { // верх
                        const topP = new THREE.Vector3(0, 2.5, 0).add(this.pos)

                        const _v = [
                            ...topP.toArray(),
                            ...topRP.toArray(),
                            ...topLP.toArray(),
                        ]
                        _M.fill(_v, v)

                        const _c = [
                            .1, .1, .1,
                            .1, .1, .1,
                            .1, .1, .1,
                        ]
                        _M.fill(_c, c)

                        index.push(currInd, currInd + 1, currInd + 2)
                        currInd += 3
                    }

                    currAngleLeft = localRightAngle
                }
            }

        }


        return { v, c, index }
    }
}
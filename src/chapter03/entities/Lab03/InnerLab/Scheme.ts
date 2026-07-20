import * as THREE from 'three'
import { _M, IArraysGeom } from '_CORE/_M/_m'
import { Root } from '../../../index'

import { distanceBetweenSegments3D } from './distLines'

export class Scheme {
    #pointCount = -1
    #lineCount = -1
    #materialBox: THREE.MeshBasicMaterial | null = null
    #MAX_POINTS = 30

    _root: Root

    points: { 
        [key: string]: { 
            pos: THREE.Vector3,
            neighbors: string[]
        }
    } = {}

    lines: { 
        [key: string]: {
            p0: string, 
            p1: string, 
            dist: number 
        } 
    } = {}

    bounds: THREE.Box3 = new THREE.Box3(
        new THREE.Vector3(-50, -100, -50), 
        new THREE.Vector3(50, 0, 50)
    )

    agent = {
        pos: new THREE.Vector3(0, 0, 50),
        dir: new THREE.Vector3(0, 0, -1),
        currentPointId: this.#calkPointId()
    }

    constructor(root: Root) {
        this._root = root
    }

    async create() {
        // вставляем стартовую точку
        this.points[this.agent.currentPointId] = { 
            pos: this.agent.pos.clone(), 
            neighbors: [] 
        }

        await this.#createBranch(20)

        for (let key in this.points) {
            if (Math.random() < .3 && this.points[key].neighbors?.length === 2) {
                const posP0 = this.points[this.points[key].neighbors![0]].pos.clone()
                const posP2 = this.points[this.points[key].neighbors![1]].pos.clone()
                const dir = posP2.clone().sub(posP0).normalize()

                dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)
                this.agent.pos.copy(this.points[key].pos.clone())
                this.agent.dir.copy(dir)
                this.agent.currentPointId = key

                await this.#createBranch(5 + Math.floor(Math.random() * 60))
            }
        }

        for (let key in this.points) {
            if (Math.random() < .3 && this.points[key].neighbors.length === 2) {
                const posP0 = this.points[this.points[key].neighbors![0]].pos.clone()
                const posP2 = this.points[this.points[key].neighbors![1]].pos.clone()
                const dir = posP2.clone().sub(posP0).normalize()

                dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)
                this.agent.pos.copy(this.points[key].pos.clone())
                this.agent.dir.copy(dir)
                this.agent.currentPointId = key

                await this.#createBranch(1)
            }
        }
    }

    #calkPointId() { 
        return `p${++this.#pointCount}` 
    }

    #calkLineId() { 
        return `l${++this.#lineCount}` 
    }

    #calcNewPoint(maxAngle: number = Math.PI * .5) {
        const dist = Math.random() * 5 + 5
        const h = Math.random() * dist * .5 * (Math.random() < .5 ? 1 : -1)

        const dir = 
            this.agent.dir.clone()
                .applyAxisAngle(
                    new THREE.Vector3(0, 1, 0), 
                    Math.random() * maxAngle * .5 * (Math.random() < .5 ? 1 : -1)
                )

        const newPos = 
            this.agent.pos.clone()
                .add(dir.clone().multiplyScalar(dist))
                .add(new THREE.Vector3(0, h, 0))

        return { newPos, dir, dist }
    }

    #checkIsPointInLabirinthBounds(newPos: THREE.Vector3) { 
        return this.bounds.containsPoint(newPos)
    }

    #checkIsPointNearAnotherPoints(newPos: THREE.Vector3) {
        for (let pointId in this.points) {
            const p = this.points[pointId]
            if (newPos.distanceTo(p.pos) < 3) { 
                return pointId
            }
        }
        return false
    }

    #checkLineNearLine(newlp0: THREE.Vector3, newlp1: THREE.Vector3): string | false {
        // проверяем новую гипотетическую линию на пересечение с новой линией
        const tryNewLinePoints = { p1: newlp0, p2: newlp1 }

        // TODO: может быть несколько пересечений
        for (let key in this.lines) {
            const { p0, p1 } = this.lines[key]

            const distToExistsLine = distanceBetweenSegments3D(
                tryNewLinePoints, 
                { p1: this.points[p0].pos, p2: this.points[p1].pos }
            )

            if (distToExistsLine > 0.01 && distToExistsLine < 3) {
                let pId

                const d_lp0_newlp0 = this.points[p0].pos.clone().distanceTo(newlp0)
                const d_lp1_newlp0 = this.points[p1].pos.clone().distanceTo(newlp0)
                const d_lp0_newlp1 = this.points[p0].pos.clone().distanceTo(newlp1)
                const d_lp1_newlp1 = this.points[p1].pos.clone().distanceTo(newlp1)

                if (d_lp0_newlp0 < 2 || d_lp0_newlp1 < 2) {
                    pId = p0                    
                }

                if (d_lp1_newlp0 < 2 || d_lp1_newlp1 < 2) {
                    pId = p1
                }

                if (pId) {
                    return pId
                }
            }
        }
        
        return false
    }

    #makePoint() {
        if (Object.keys(this.points).length > this.#MAX_POINTS) {
            return null
        }

        const maxAttempts = 10
        let count = 0

        while (count < maxAttempts) { 
            ++count

            let { newPos, dir, dist } = this.#calcNewPoint(count / maxAttempts * Math.PI * 4)

            if (this.#checkIsPointInLabirinthBounds(newPos)) { 
                let pointId = this.#checkIsPointNearAnotherPoints(newPos) 
            
                if (!pointId) { 
                    pointId = this.#checkLineNearLine(this.agent.pos, newPos)
                }

                if (!pointId) {
                    pointId = this.#calkPointId()   
                } else { 
                    newPos = this.points[pointId].pos.clone()
                    dist = newPos.distanceTo(this.agent.pos)
                }

                return { newPos, dir, dist, pointId }
            }
        }

        return null
    }

    async #createPointAndLine() {
        const nextPoint = this.#makePoint()
        if (nextPoint) { 
            let { newPos, dir, dist, pointId } = nextPoint
            
            if (!this.points[pointId]) {
                this.points[pointId] = { 
                    pos: newPos.clone(),
                    neighbors: [] 
                }
            }

            // проверяем что новой линии нет в сохраненных (возможно по точкам возвращение назад)
            if (this.#checkIsLineNoExists(this.agent.currentPointId, pointId)) {
                this.lines[this.#calkLineId()] = { p0: this.agent.currentPointId, p1: pointId, dist }
            }

            this.#addMeshLineAndPoint({ label: pointId, p0: this.agent.pos.clone(), p1: newPos.clone() })

            this.agent.pos.copy(newPos)
            this.agent.dir.copy(dir)
            this.agent.currentPointId = pointId

            this.#updatePointsNeighbors()

            //await _M.waitClickNext('next')
            //console.log('next')
        } 

        return !!nextPoint
    }

    async #createBranch(MAX_POINTS: number = 20) {
        let count = 0
        while (count < MAX_POINTS) {
            ++count

            const isCreated = await this.#createPointAndLine()
            
            if (!isCreated) break
        }
    }

    #updatePointsNeighbors() {
        for (let key in this.lines) {
            const { p0, p1 } = this.lines[key]

            if (this.points[p0] && !this.points[p0].neighbors.includes(p1)) { 
                this.points[p0].neighbors.push(p1) 
            }

            if (this.points[p1] && !this.points[p1].neighbors.includes(p0)) { 
                this.points[p1].neighbors.push(p0) 
            }
        }
    }

    #checkIsLineNoExists(p1Id: string, p2Id: string) { 
        for (let key in this.lines) {
            if (
                (p1Id === this.lines[key].p0 && p2Id === this.lines[key].p1) ||
                (p1Id === this.lines[key].p1 && p2Id === this.lines[key].p0)
            ) {
                return false
            }
        }
        return true
    }

    // #region view

    makeSchemeMesh() {
        const group = new THREE.Group()

        const v: number[] = []

        const mat = this.#getMaterialBox()

        for (let key in this.lines) {
            const { p0, p1 } = this.lines[key]

            const vPrev = this.points[p0]
            const vCurr = this.points[p1]

            if (!vPrev || !vCurr) {
                console.warn('Invalid line:', key, this.lines[key])
                continue
            }

            const l = _M.createLabel(p1, [1, 0, 0], 10)
            l.position.copy(vCurr.pos)
            group.add(l)
            
            const dir = new THREE.Vector3().copy(vCurr.pos).sub(vPrev.pos).normalize()
            const w = .1
            const vp0 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).multiplyScalar(w).add(vPrev.pos) 
            const vp1 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(w).add(vPrev.pos) 
            const vp2 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(w).add(vCurr.pos) 
            const vp3 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).multiplyScalar(w).add(vCurr.pos)

            const _v = _M.createPolygonV(vp0, vp1, vp2, vp3)
            _M.fill(_v, v)
        }

        const mesh = _M.createMesh({ v, material: mat })
        group.add(mesh)

        return group
    }

    #addMeshLineAndPoint({ label, p0, p1 }: { label: string, p0: THREE.Vector3, p1: THREE.Vector3 }) {
        const l = _M.createLabel(label, [1, 0, 0], 10)
        l.position.copy(p1)
        this._root.studio.add(l)

        const dir = new THREE.Vector3().copy(p1).sub(p0).normalize()
        const w = .1
        const vp0 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).multiplyScalar(w).add(p0) 
        const vp1 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(w).add(p0) 
        const vp2 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5).multiplyScalar(w).add(p1) 
        const vp3 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * .5).multiplyScalar(w).add(p1)

        const _v = _M.createPolygonV(vp0, vp1, vp2, vp3)
        const mesh = _M.createMesh({ v: _v, material: this.#getMaterialBox() })

        this._root.studio.add(mesh)
    }

    #getMaterialBox() {
        if (!this.#materialBox) {
            this.#materialBox = new THREE.MeshBasicMaterial({ color: 0xffffff, side: 2 })
        }
        return this.#materialBox
    }

    // #endregion

}   
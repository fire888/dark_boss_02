import { createTileI } from "../../geometry/tile_I"
import { _M, A3 } from "../../geometry/_m"
import { createRandomDataForLine } from "../../geometry/_lineGeom"
import { Dir } from "../../entities/labyrinth/types"
import {
    MeshBasicMaterial,
    MeshPhongMaterial,
    Mesh,
    Object3D,
    BufferAttribute,
} from 'three'
import { createDoor } from "../../geometry/door"
import { Root } from "../../index"
import { Tween, Interpolation, Easing } from '@tweenjs/tween.js'
import { vC_H } from "../../constants/CONSTANTS"
import * as THREE from 'three'

type TopTunnelStartData = {
    color: [number, number, number],
    form: number[],
    path: A3[],
    material: MeshBasicMaterial | MeshPhongMaterial,
    collisionMaterial: MeshBasicMaterial,
    w: number,
    posStartDir: Dir,
}

type GeometryData = {
    v: number[],
    c?: number[],
    vC?: number[], 
}


export class TopTunnel {
    W = 60
    N = 140
    mesh: Mesh
    meshCollision: THREE.Mesh
    meshDoorCollision: THREE.Mesh
    _doorMesh: Mesh
    _doorDataOpened: GeometryData

    init (root: Root, startData: TopTunnelStartData) {
        const { posStartDir } = startData

        // corridor view mesh *************************************/
        const randomData2 = createRandomDataForLine()
        
        let dataI = null
        if (posStartDir === Dir.NORTH) {
            dataI = {
                e: null,
                w: null,
                n: randomData2,
                s: startData,
                num: this.N,
                width: this.W,
            }
        }
        if (posStartDir === Dir.SOUTH) {
            dataI = {
                e: null,
                w: null,
                n: startData,
                s: randomData2,
                num: this.N,
                width: this.W,
            }
        }
        if (posStartDir === Dir.EAST) {
            dataI = {
                e: randomData2,
                w: startData,
                n: null,
                s: null,
                num: this.N,
                width: this.W,
            }
        }
        if (posStartDir === Dir.WEST) {
            dataI = {
                e: startData,
                w: randomData2,
                n: null,
                s: null,
                num: this.N,
                width: this.W,
            }
        }

        if (dataI) {
            const e = createTileI(dataI)
            this.mesh = _M.createMesh({ v: e.v, c: e.c, material: startData.material })
        } else {
            this.mesh = _M.createMesh({ v: [], c: [], material: startData.material })
        }

        // collision corridor *************************************/
        const vC = [
            ..._M.createPolygon(
                [-this.W / 2, 0, -1.5],
                [-this.W / 2, 0, 1.5],
                [this.W / 2, 0, 1.5],
                [this.W / 2, 0, -1.5],
            ),
            ..._M.createPolygon(
                [-this.W / 2, 0, -1.5],
                [this.W / 2, 0, -1.5],
                [this.W / 2, vC_H, -1.5],
                [-this.W / 2, vC_H, -1.5],
            ),
            ..._M.createPolygon(
                [this.W / 2, 0, 1.5],
                [-this.W / 2, 0, 1.5],
                [-this.W / 2, vC_H, 1.5],
                [this.W / 2, vC_H, 1.5],
            ),
        ]
        this.meshCollision = _M.createMesh({ v: vC, material: startData.collisionMaterial })
        this.meshCollision.name = 'collision_lab_tunnel'

        const doorData = createDoor({
            color: startData.color,
            form: startData.form,
            width: 5,
        })
        
        this._doorDataOpened = createDoor({
            color: startData.color,
            form: startData.form,
            width: .2,
        })
        _M.translateVertices(this._doorDataOpened.v, 0, 1, 0)

        // door ***************************************************/ 
        this._doorMesh = _M.createMesh({
            v: doorData.v,
            c: doorData.c,
            material: startData.material
        })
        this.mesh.add(this._doorMesh)

        this.meshDoorCollision = _M.createMesh({ 
            v: _M.createPolygon(
                [-3, -1, 0],
                [3, -1, 0],
                [3, 3, 0],
                [-3, 3, 0],
            ) 
        })
        this.meshDoorCollision.name = 'collision_lab_door'

        if (posStartDir === Dir.NORTH) {
            this._doorMesh.position.z = startData.w * 4
        }
        if (posStartDir === Dir.SOUTH) {
            this._doorMesh.position.z = -startData.w * 4
        }
        if (posStartDir === Dir.EAST) {
            this._doorMesh.position.x = -startData.w * 4
            this._doorMesh.rotation.y = Math.PI / 2 
            this.meshDoorCollision.rotation.y = Math.PI / 2   
        }
        if (posStartDir === Dir.WEST) {
            this._doorMesh.position.x = startData.w * 4
            this._doorMesh.rotation.y = Math.PI / 2
            this.meshDoorCollision.rotation.y = Math.PI / 2   
        }
    }

    async openDoor () {
        this.meshDoorCollision.position.y = -500000

        return new Promise((resolve, reject) => {
            const vZ: number[] = []
            const { array } = this._doorMesh.geometry.attributes.position

            const obj = { v: 0 }
            new Tween(obj)
                .easing(Easing.Exponential.InOut)
                .to({ v: 1 }, 1000)
                .onUpdate(() => {
                    const mV = []
                    for (let i = 0; i < array.length; ++i) {
                        mV.push(
                            array[i] + (this._doorDataOpened.v[i] - array[i]) * obj.v, 
                        )
                    }
                    this._doorMesh.geometry.setAttribute('position', new BufferAttribute(new Float32Array(mV), 3))
                    this._doorMesh.geometry.computeVertexNormals()
                    this._doorMesh.geometry.attributes.position.needsUpdate = true
                })
                .onComplete(() => {
                    const { array } = this._doorMesh.geometry.attributes.position
                    const target: number[] = []

                    for (let i = 0; i < array.length; i += 3) {
                        target.push(
                            array[i],
                            0,
                            array[i + 2], 
                        )
                    }

                    const obj = { v: 0 }
                    new Tween(obj)
                        .easing(Easing.Exponential.InOut)
                        .to({ v: 1 }, 1000)
                        .onUpdate(() => {
                            const mV = []
                            for (let i = 0; i < array.length; ++i) {
                                mV.push(array[i] + (target[i] - array[i]) * obj.v,)
                            }
                            this._doorMesh.geometry.setAttribute('position', new BufferAttribute(new Float32Array(mV), 3))
                            this._doorMesh.geometry.computeVertexNormals()
                            this._doorMesh.geometry.attributes.position.needsUpdate = true
                        })
                        .onComplete(() => {
                            this._doorMesh.position.y = -10000
                            resolve(true)
                        })
                        .start()
                })
                .start()
        })
    }

    destroy () {
        this.mesh.remove(this._doorMesh)
        this._doorMesh.geometry.dispose()
        this.mesh.geometry.dispose()
    }
}
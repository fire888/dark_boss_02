import { Root } from "../index";
import { _M } from "../geometry/_m";
import { Mesh, MeshBasicMaterial, Color } from 'three'
import { createEnergyV } from "../geometry/energy/energy"
import { Tween, Interpolation} from '@tweenjs/tween.js'
import * as THREE from 'three'

type Energy = {
    collisionName: string,
    isActive: boolean,
    startIndex: number,
    len: number,
    p: THREE.Vector3
}

export class EnergySystem {
    nameSpace: string = 'collision_energy_'
    _root: Root
    _v: number[] = []
    _collisionMaterial: MeshBasicMaterial
    _items: Energy[] = []
    _m: Mesh | null
    _material: MeshBasicMaterial = new MeshBasicMaterial({ color: 0xFFFF00, vertexColors: true })

    init (root: Root, points: THREE.Vector3[]) {
        this._root = root

        if (!this._collisionMaterial) {
            this._collisionMaterial = new MeshBasicMaterial({ color: 0xFFFF00 })
        }

        let namePrefix = 0
        const _v: number[] = []
        const _c: number[] = []

        for (let i = 0; i < points.length; ++i) {
            const p = points[i]

            const { v, c } = createEnergyV({ 
                t: _M.ran(.5, 2),
                rad: _M.ran(.1, .2),
                l: _M.ran(.2, .3),
            })

            const startIndex = _v.length / 3
            const len = v.length / 3

            for (let i = 0; i < v.length; i += 3) {
                v[i] = v[i] * .3 + p.x
                v[i + 1] = v[i + 1] * .3 + p.y + .4
                v[i + 2] = v[i + 2] * .3 + p.z

                _v.push(v[i], v[i + 1], v[i + 2])
            }
            _c.push(...c)

            const vCol = _M.createPolygon(
                [p.x - .8, p.y + .2, p.z + .8],
                [p.x + .8, p.y + .2, p.z + .8],
                [p.x + .8, p.y + .2, p.z - .8],
                [p.x - .8, p.y + .2, p.z - .8],
            )
            const collisionM = _M.createMesh({
                v: vCol,
                material: this._collisionMaterial,
            })
            const collisionName = this.nameSpace + namePrefix
            collisionM.name = collisionName
            this._root.phisics.addMeshToCollision(collisionM)

            this._items.push({ collisionName, isActive: true, startIndex, len, p: p.clone().add(new THREE.Vector3(0, .4, 0)) })

            ++namePrefix
        }

        this._m = _M.createMesh({ 
            v: _v,
            c: _c, 
            material: this._material
        })
        this._m.frustumCulled = false
        root.studio.add(this._m)
    }

    animateMovieHide (name: string) {
        let item = null
        for (let i = 0; i < this._items.length; ++i) {
            if (this._items[i].collisionName === name) {
                item = this._items[i] 
            }
        }
        if (!item) {
            console.log('not find to hide', name)
        }

        item.isActive = false

        const { startIndex, len, p } = item
        const vertices = this._m.geometry.attributes.position

        const obj = { v: 1 }
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: 0 }, 500)
            .onUpdate(() => {
                for (let i = startIndex; i < startIndex +len; ++i) {
                    const x = vertices.getX(i)
                    const y = vertices.getY(i)
                    const z = vertices.getZ(i)
                    vertices.setX(i, p.x + (x - p.x) * obj.v)
                    vertices.setY(i, p.y + (y - p.y) * obj.v + (1 - obj.v) * .5)
                    vertices.setZ(i, p.z + (z - p.z) * obj.v)
                }
                vertices.needsUpdate = true 
            })
            .onComplete(() => {})
            .start()
    }

    getPercentageItemsGetted () {
        let count = 0 
        for (let i = 0; i < this._items.length; ++i) {
            if (this._items[i].isActive) {
                continue;
            }
            ++count
        }
        return count / this._items.length
    }

    destroy () {
        this._root.studio.remove(this._m)
        this._m.geometry.dispose()
        this._m = null

        for (let i = 0; i < this._items.length; ++i) {
            const { collisionName } = this._items[i]
            this._root.phisics.removeMeshFromCollision(collisionName)
        }
        this._items = []
    }
}
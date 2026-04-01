import * as THREE from 'three'
import { createDataUnit } from './geometry/dataUnit'
import { Root } from '../index'
import  * as TWEEN from '@tweenjs/tween.js'


const createS = (root: Root, { r = 15, s = .5, mKey = 'testGreen'  }) => {
    const v = []
    const rh = r / 2

    for (let i = 0; i < 100; ++i) {
        const x = Math.random() * r - rh 
        const y = Math.random() * r - rh
        const z = Math.random() * r - rh

        for (let i = 0; i < 3; ++i) {
            v.push(
                x + Math.random() * s,
                y + Math.random() * s,
                z + Math.random() * s,
            )
        }
    } 

    const vertices = new Float32Array(v)
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    return new THREE.Mesh(geometry, root.materials.unitCenter)
}

export class Pers {
    geometry: THREE.BufferGeometry
    s1: THREE.Mesh
    s2: THREE.Mesh
    s3: THREE.Mesh
    s4: THREE.Mesh
    star: THREE.Mesh
    mesh: THREE.Object3D
    phase = 0
    phaseMesh = 0
    mode = 'idle'
    strength = 0
    spd = 0.05
    starQSaved = new THREE.Quaternion()
    meshQSaved = new THREE.Quaternion()
    q0 = new THREE.Quaternion()

    arr1: number[]
    arr2: number[]  

    isRotate = true

    dataUnit1: any
    dataUnit2: any
    dataUnit3: any
    dataUnit4: any

    #defaultScale = .1

    init (root: Root) {
        this.dataUnit1 = createDataUnit({ 
            r: 15,
            cone: 12,
            w: 2,
            wt: 3,
            wtr: 5,
            htr: 5,
            rInner: -5,
            hhh: 8,
        })
        this.dataUnit2 = createDataUnit({ 
            cone: 20,
            r: 13,
            w: .5,
            wt: .7, 
            wtr: 2,
            htr: 0,
            rInner: -5, 
            hhh: 12,
            hh: 16,
            hhD: -12,
        })
        this.dataUnit3 = createDataUnit({ 
            r: 16,
            cone: 9,
            w: 1,
            wt: 5,
            wtr: 6,
            htr: 6,
            rInner: -3,
            hhh: 8,
        }) 
        this.dataUnit4 = createDataUnit({ 
            r: 16,
            cone: 15,
            w: 1.5,
            wt: 8,
            wtr: 6,
            htr: 6,
            rInner: -3,
            hhh: 8,
        }) 

        const v = new Float32Array(this.dataUnit1.v)
        const c =  new Float32Array(this.dataUnit2.c)

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(v, 3))
        this.geometry.setAttribute('color', new THREE.BufferAttribute( c, 3 ))
        this.geometry.computeVertexNormals()

        this.mesh = new THREE.Object3D()
        this.mesh.scale.set(this.#defaultScale, this.#defaultScale, this.#defaultScale)
        this.star = new THREE.Mesh(this.geometry, root.materials.unit)
        this.mesh.add(this.star)
        this.s1 = createS(root, { mKey: 'testWhite' })
        this.mesh.add(this.s1) 
        this.s2 = createS(root, { mKey: 'testWhite' })
        this.mesh.add(this.s2) 
        this.s3 = createS(root, { mKey: 'testWhite' })
        this.mesh.add(this.s3) 

        this.s4 = createS(root, { r: 50, s: .5 })
        this.mesh.add(this.s4) 

        this.phase = 0
        this.phaseMesh = 0
        this.mode = 'idle'
        this.strength = 0
        this.spd = 0.05
        this.starQSaved = new THREE.Quaternion()
        this.meshQSaved = new THREE.Quaternion()
        this.q0 = new THREE.Quaternion()

        this.arr1 = this.dataUnit1.v
        this.arr2 = this.dataUnit2.v 

        this.isRotate = true

        root.studio.add(this.mesh)
    }

    update() {
        this.phaseMesh += 0.05
        this.s1.rotation.y = - this.phaseMesh * 2
        this.s2.rotation.x = - this.phaseMesh * 2
        this.s3.rotation.z= - this.phaseMesh * 2 
        this.s4.rotation.y = this.phaseMesh / 4
        this.mesh.rotation.y = this.phaseMesh / 5

        if (this.mode === 'idle') {
            const t = Math.sin(this.phase)

            this.phase += 0.05
            if (this.isRotate) {
                this.star.rotation.y = this.phase / 2
                this.star.rotation.x = this.phase / 1.33
                this.star.rotation.z = this.phase / 1.88
            }

            for (let i = 0; i < this.dataUnit1.v.length; ++i) {
                this.geometry.attributes.position.array[i] = this.arr1[i] * (1 - t) + this.arr2[i] * t
            }
            this.star.geometry.attributes.position.needsUpdate = true
        }

        if (this.mode === 'toDialog') {
            this.strength += this.spd
            if (this.strength > 1) this.strength = 1
            this.star.quaternion.slerpQuaternions(this.starQSaved, this.q0, this.strength)
            for (let i = 0; i < this.dataUnit1.v.length; ++i) {
                this.geometry.attributes.position.array[i] = this.arr1[i] * (1 - this.strength) + this.arr2[i] * this.strength
            }
            this.star.geometry.attributes.position.needsUpdate = true
            if (this.strength === 1) {
                this.isRotate = false
                this.mode = 'idle'
                this.phase = 0
                this.arr1 = this.dataUnit3.v
                this.arr2 = this.dataUnit4.v
            }
        }

        if (this.mode === 'fromDialog') {
            this.strength += this.spd
            if (this.strength > 1) this.strength = 1
            for (let i = 0; i < this.dataUnit1.v.length; ++i) {
                this.geometry.attributes.position.array[i] = this.arr1[i] * (1 - this.strength) + this.arr2[i] * this.strength
            }
            this.star.geometry.attributes.position.needsUpdate = true
            if (this.strength === 1) {
                this.mode = 'idle'
                this.phase = 0
                this.arr1 = this.dataUnit1.v
                this.arr2 = this.dataUnit2.v
                this.isRotate = true
            }
        }
    }
    
    hide(time = 1000) {
        const obj = { v: 0 }
        new TWEEN.Tween(obj)
            .easing(TWEEN.Easing.Exponential.InOut)
            .to({ v: 1 }, time)
            .onUpdate(() => {
                const s = this.#defaultScale * (1 - obj.v)
                this.mesh.scale.set(s, s, s)
            })
            .onComplete(() => {})
            .start()
    }

    show(time = 1000) {
        const obj = { v: 0 }
        new TWEEN.Tween(obj)
            .easing(TWEEN.Easing.Exponential.InOut)
            .to({ v: 1 }, time)
            .onUpdate(() => {
                const s = this.#defaultScale * obj.v
                this.mesh.scale.set(s, s, s)
            })
            .onComplete(() => {})
            .start()
    }

}

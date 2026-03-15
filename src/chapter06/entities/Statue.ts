import * as THREE from "three"
import * as TWEEN from '@tweenjs/tween.js'
import { Root } from "chapter06"
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'

type T_ArrayAnimate = [
    number[],
    number[],
    number[],
    number[],
]

const generate = (count: number, r: number, s: number = 1) => {
    const v = []

    for (let i = 0; i < count; ++i) {
        const radius = Math.random() * r
        const angle = Math.random() * Math.PI * 2
        const angle2 = Math.random() * Math.PI * 2

        const x = Math.sin(angle) * radius
        const y = Math.sin(angle2) * Math.random() * 50
        const z = Math.cos(angle) * radius


        for (let i = 0; i < 3; ++i) {
            v.push(
                x + Math.random() * s,
                y + Math.random() * s,
                z + Math.random() * s,
            )
        }
    }

    return v
}

const startWaiter = (time: number, onWait: () => void) => {
    const timer = setTimeout(() => {
        onWait()
    }, time)

    return () => clearTimeout(timer)
}

const createStatue = (root: Root) => {
    /** mesh */
    const modelSrc = root.assets.staueObj.children[0]
    const mesh = new THREE.Mesh(modelSrc.geometry, root.materials.body)
    const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        root.materials.bodyShadow,
    )
    shadow.rotation.x = -Math.PI/ 2
    shadow.position.y = .1
    shadow.position.z = -.8
    mesh.add(shadow)
    const meshCollision = new THREE.Mesh(
        new THREE.BoxGeometry(.5, 3, .5).translate(0, .5, 0),
        root.materials.bodyShadow,
    )
    meshCollision.name = 'statueCollision'
    //mesh.add(meshCollision)
    //meshCollision.visible = false
    root.phisics.addMeshToCollision(meshCollision)

    mesh.position.set(10, 0, 10)
    mesh.scale.set(.14, .14, .14)
    mesh.position.y = -1.5
    mesh.rotation.y = Math.PI

    root.studio.add(mesh)

    //if (
    //    root.system_Sound &&
    //    root.system_Sound.setMeshStatue
    //) {
    //    root.system_Sound.setMeshStatue(mesh)
    //}

    const arrAppear: T_ArrayAnimate = [
        generate(mesh.geometry.attributes.position.array.length / 9, 200 * Math.random(), 0),
        generate(mesh.geometry.attributes.position.array.length / 9, 50 * Math.random(), Math.random() + 1),
        generate(mesh.geometry.attributes.position.array.length / 9, 20 * Math.random(), Math.random() + 2),
        [...modelSrc.geometry.attributes.position.array],
    ]
    const arrHide: T_ArrayAnimate = [
        [...modelSrc.geometry.attributes.position.array],
        generate(mesh.geometry.attributes.position.array.length / 9, 15 * Math.random(), Math.random() + 2),
        generate(mesh.geometry.attributes.position.array.length / 9, 2 * Math.random(), Math.random() + 1),
        generate(mesh.geometry.attributes.position.array.length / 9, Math.random(), 0),
    ]


    const startIterate = (key: 'show' | 'hide', arr: T_ArrayAnimate, x: number, z: number, onComplete = () => {}) => {
        const TIME_SINGLE_ITERATION = 300
        // @ts-ignore
        let tween: TWEEN.Tween = null

        const iterate = (n: number) => {
            if (!arr[n]) {
                onComplete()
                return;
            }

            const v = { v : 0 }
            tween = new TWEEN.Tween(v)
                .to({
                    v: 1,
                }, TIME_SINGLE_ITERATION)
                .onUpdate(() => {
                    for (let i = 0; i < mesh.geometry.attributes.position.array.length; ++i) {
                        mesh.geometry.attributes.position.array[i] = v.v * arr[n][i] + (1 - v.v) * arr[n - 1][i]
                    }
                    if (key === 'show' && n === arrAppear.length - 1) {
                        shadow.material.opacity = v.v
                    }
                    if (key === 'hide' && n === 1) {
                        shadow.material.opacity = 1 - v.v
                    }
                    mesh.geometry.attributes.position.needsUpdate = true
                })
                .onComplete(() => {
                    iterate(n + 1)
                })
                .start()
        }

        iterate(1)

        setTimeout(() => {
            if (!x && !z) {
                return;
            }
            shadow.material.opacity = 0
            mesh.position.x = x
            mesh.position.z = z
            mesh.rotation.y = Math.random() * Math.PI * 2
        }, 50)

        return () => {
            tween.stop()
        }
    }


    let stopperTween = () => {}
    let inverted = false

    return {
        m: mesh,
        mCollision: meshCollision,
        update: () => {},
        appear (x: number, z: number) {
            //root.system_Sound.playStatue()
            stopperTween()
            stopperTween = startIterate('show', arrAppear, x, z, () => {})
        },
        hide () {
            //root.system_Sound.playStatue()
            stopperTween()
            stopperTween = startIterate('hide', arrHide, null, null,() => {})
        },
        invert () {
              if (inverted) {
              //    mesh.material = root.materials.body
              } else {
              //    mesh.material = root.materials.bodyRed
              }
              mesh.material.needsUpdate = true
              inverted = !inverted
        },
        toRed () {
            // mesh.material = root.materials.bodyRed
            mesh.material.needsUpdate = true
        },
        toBlack () {
            mesh.material = root.materials.body
            mesh.material.needsUpdate = true
        },
        toWhite () {
            //mesh.material = root.materials.bodyWhite
            mesh.material.needsUpdate = true
        },
        setPosition (x: number, z: number) {
            mesh.position.set(x, -1.5, z)
            root.phisics.setPositionByKey('statueCollision', x, -1.5, z)
        }
    }
}


export class Statue {
    _st: any
    _root: Root
    async init (root: Root) {
        this._root = root
        this._st = createStatue(root)
    }
    setPosition (x: number, z: number) { 
        this._st.appear(x, z)
        this._st.setPosition(x, z)
    }
} 


import * as THREE from 'three'
import {
    MeshBasicMaterial,
    MeshPhongMaterial,
    BufferGeometry,
    BufferAttribute,
    Mesh,
} from "three"
import { _GM } from "./_gm"

// Нечистые хелперы стенда и рендера: Mesh, Material, BufferGeometry, DOM.
// В фабриках src/geometry не используются — там только _gm.

let geomLabel: THREE.PlaneGeometry | null = null

export const _H = {
    createMesh: (data: {
        index?: number[],
        v: number[], 
        uv?: number[], 
        uv2?: number[], 
        c?: number[],
        forceMat?: number[],
        material?: MeshBasicMaterial | MeshPhongMaterial | THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial,
    }) => {

        const {
            index = undefined,
            v = [], 
            uv = [],
            uv2 = [], 
            c = [],
            forceMat = [],
            material = new MeshBasicMaterial({ color: 0x777777, vertexColors: !!(c && c.length > 0) }), 
        } = data

        const geometry = _H.createBufferGeometry({ index, v, uv, uv2, c, forceMat })
    
        return new Mesh(geometry, material)
    },
    createBufferGeometry: (data: {
        index?: number[],
        v: number[], 
        uv?: number[], 
        uv2?: number[], 
        c?: number[],
        forceMat?: number[],
    }): BufferGeometry => {
        const { index = null, v = [], uv = [], uv2 = [], c = [], forceMat = [] } = data

        const geometry = new BufferGeometry()
        const vF32 = new Float32Array(v)
        if (index) {
            geometry.setIndex(index)
        }
        geometry.setAttribute('position', new BufferAttribute(vF32, 3))
        geometry.computeVertexNormals()
        if (c.length > 0) {
            const cF32 = new Float32Array(c)
            geometry.setAttribute('color', new BufferAttribute(cF32, 3))
        }
        if (uv.length > 0) {
            const uvF32 = new Float32Array(uv)
            geometry.setAttribute('uv', new BufferAttribute(uvF32, 2))
        }
        if (uv2.length > 0) {
            const uv2F32 = new Float32Array(uv2)
            geometry.setAttribute('uv2', new BufferAttribute(uv2F32, 2))
        }
        if (forceMat.length > 0) {
            const forceMatF32 = new Float32Array(forceMat)
            geometry.setAttribute('forcemat', new BufferAttribute(forceMatF32, 1))
        }
        return geometry
    },
    createLabel(t: string, color: [number, number, number] = [1, 1, 1], scale = 1) {
        const canvas = document.createElement( 'canvas' );
        const ctx = canvas.getContext( '2d' );
        canvas.width = 128 * (t.length * .5);
        canvas.height = 128;

        const c = _GM.normRGBtoHex(...color)

        ctx.fillStyle = c
        ctx.font = 'bold 60pt arial'
        ctx.textAlign = "left"
        ctx.fillText(t, 0, 100)

        const map = new THREE.CanvasTexture( canvas )
        const material = new THREE.MeshBasicMaterial( { map: map, transparent: true } )
        if (!geomLabel) {
            geomLabel = new THREE.PlaneGeometry(.3, .3)
        }
        const mesh = new THREE.Mesh(geomLabel, material)
        mesh.scale.set((t.length * .5), 1, 1)
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(.04, .04, .04),
            new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(color[0], color[1], color[2]) })
        )
        mesh.position.set(0, .15, 0)
        box.scale.set(scale, scale, scale)
        box.add(mesh)

        return box
    },

    createLine (arr: [number, number][], color: [number, number, number] = [1, 1, 1]) {
        const linePoints1 = []
        for (let i = 0; i < arr.length; ++i) {
            linePoints1.push(new THREE.Vector3(arr[i][0], 0, arr[i][1]))
        }
        const geometry1 = new THREE.BufferGeometry().setFromPoints(linePoints1)
        const mat = new THREE.LineBasicMaterial({ color: new THREE.Color().setRGB(color[0], color[1], color[2]) })
        const line1 = new THREE.Line(geometry1, mat)
        return line1            
    },

    getAngleDirY(obj: THREE.Object3D) {
        const direction = new THREE.Vector3()
        obj.getWorldDirection(direction)
        const angle = Math.atan2(direction.x, direction.z)
        return angle
    },

    // #region click

    waitClickOnce(keyCode: string, cb: () => void) {
        const f = (event: KeyboardEvent) => {
            if (event.code === keyCode) {
                cb()
                document.removeEventListener('keydown', f)
            }
        }
        document.addEventListener('keydown', f)
    },

    waitClickNext: (t: string = 'next') => new Promise((resolve) => {
        const button = document.createElement('button')
        button.style.position = 'absolute'
        button.style.left = '50%'
        button.style.top = '0'
        button.innerText = t
        button.classList.add('debug-button')
        document.body.appendChild(button)
        button.addEventListener('pointerdown', () => {
            document.body.removeChild(button)
            resolve(true)
        })
    }),

    // #endregion

}

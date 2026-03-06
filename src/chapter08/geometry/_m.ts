import { 
    Matrix4, 
    Vector3,
    MeshBasicMaterial,
    MeshPhongMaterial,
    BufferGeometry,
    BufferAttribute,
    Mesh,
    // LineBasicMaterial,
    // Line,
} from "three";

export type A3 = [number, number, number]


export const _M = {
    createPolygon: function(v0: A3, v1: A3, v2: A3, v3: A3) { return  [...v0, ...v1, ...v2, ...v0, ...v2, ...v3] },
    fillColorFace: (c: A3) => [...c, ...c, ...c, ...c, ...c, ...c],
    createUv: (v1: A3, v2: A3, v3: A3, v4: A3) => [...v1, ...v2, ...v3, ...v1, ...v3, ...v4],
    applyMatrixToArray(m: Matrix4, arr: number[]) {
        const v3 = new Vector3()
        for (let i = 0; i < arr.length; i += 3) {
            v3.fromArray(arr, i)
            v3.applyMatrix4(m)
            arr[i] = v3.x
            arr[i + 1] = v3.y
            arr[i + 2] = v3.z
        }
    },
    translateVertices(v: number[], x: number, y: number, z: number) {
        const m4 = new Matrix4().makeTranslation(x, y, z)
        this.applyMatrixToArray(m4, v)
    },
    rotateVerticesX(v: number[], angle: number) {
        const m4 = new Matrix4().makeRotationX(angle)
        this.applyMatrixToArray(m4, v)
    },
    rotateVerticesY(v: number[], angle: number) {
        const m4 = new Matrix4().makeRotationY(angle)
        this.applyMatrixToArray(m4, v)
    },
    rotateVerticesZ(v: number[], angle: number) {
        const m4 = new Matrix4().makeRotationZ(angle)
        this.applyMatrixToArray(m4, v)
    },
    angleFromCoords (x: number, y: number) {
        let rad = Math.atan(y / x)
        x < 0 && y > 0 && (rad = Math.PI - Math.abs(rad))
        x < 0 && y <= 0 && (rad = Math.PI + Math.abs(rad))
        rad += Math.PI * 6
        rad = rad % (Math.PI * 2)
        return rad
    },
    // mirrorZ: (arr) => {
    //     const arr2 = []
    //     for (let i = 0; i < arr.length; i += 18) {
    //         //if (!arr[i + 1]) {
    //         //    continue;
    //         //}
    //         arr2.push(
    //             arr[i + 3], arr[i + 4], -arr[i + 5],
    //             arr[i], arr[i + 1], -arr[i + 2],
    //             arr[i + 15], arr[i + 16], -arr[i + 17],
    //             arr[i + 3], arr[i + 4], -arr[i + 5],
    //             arr[i + 15], arr[i + 16], -arr[i + 17],
    //             arr[i + 12], arr[i + 13], -arr[i + 14],
    //         )
    //     }
    //     arr.push(...arr2)
    // },
    mirrorZ: (arr: number[]) => {
        const arr2 = []

       // 0 1 2   3 4 5    6 7 8

        for (let i = 0; i < arr.length; i += 9) {
            arr2.push(
                arr[i + 6], arr[i + 7], -arr[i + 8],
                arr[i + 3], arr[i + 4], -arr[i + 5],
                arr[i], arr[i + 1], -arr[i + 2],
            )
        }
        arr.push(...arr2)
    },
    getUvByLen: (arr: number[]) => {
        const uv = []
        let minX = 1000
        let minY = 1000
        let maxX = -1000
        let maxY = -1000
        for (let i = 0; i < arr.length; i += 3) {
            if (minX > arr[i]) {
                minX = arr[i]
            }
            if (maxX < arr[i]) {
                maxX = arr[i]
            }
            if (minY > arr[i + 1]) {
                minY = arr[i + 1]
            }
            if (maxY < arr[i + 1]) {
                maxY = arr[i + 1]
            }
        }

        const lx = maxX - minX
        const ly = maxY - minY

        for (let i = 0; i < arr.length; i += 3) {
            const x = (arr[i] - minX) / lx
            const y = (arr[i + 1] - minY) / ly
            uv.push(x, y)
        }
        return uv
    },
    ran: function (start: number, end: number = null) {
        if (end === null) {
            return Math.random() * start;
        } 
        return start + Math.random() * (end - start) 
    },
    fillColorFaceWithSquare: function(c1: A3, c2: A3){ return [
        ...this.fillColorFace(c1),
        ...this.fillColorFace(c2),
        ...this.fillColorFace(c2),
        ...this.fillColorFace(c2),
        ...this.fillColorFace(c2),
    ]},
    createFaceWithSquare: function (v1: A3, v2: A3, v3: A3, v4: A3, color1: A3, color2: A3) {
        const maxW = v2[0] - v1[0]
        const maxH = v3[1] - v1[1]

        const innerW = this.ran(maxW * 0.3, maxW * 0.7)
        const innerH = this.ran(maxH * 0.3, maxH * 0.7)

        const x1 = v1[0] + (maxW - innerW) / 2
        const x2 = v2[0] - (maxW - innerW) / 2
        const y1 = v1[1] + (maxH - innerH) / 2
        const y2 = v3[1] - (maxH - innerH) / 2

        const v1_i = [x1, y1, v1[2]]
        const v2_i = [x2, y1, v1[2]]
        const v3_i = [x2, y2, v1[2]]
        const v4_i = [x1, y2, v1[2]]

        const vArr = []
        vArr.push(
            ...this.createPolygon(v1_i, v2_i, v3_i, v4_i),
            ...this.createPolygon(v1, v2, v2_i, v1_i),
            ...this.createPolygon(v2_i, v2, v3, v3_i),
            ...this.createPolygon(v4_i, v3_i, v3, v4),
            ...this.createPolygon(v1, v1_i, v4_i, v4),
        )

        const cArr = this.fillColorFaceWithSquare(color1, color2)

        const uArr = [
            ...this.createUv(
                [.5, .5],
                [1, .5],
                [1, 1],
                [.5, 1],
            ),
            ...this.createUv(
                [0, .5],
                [.5, .5],
                [.4, .6],
                [.1, .6],
            ),
            ...this.createUv(
                [.4, .6],
                [.5, .5],
                [.5, 1],
                [.4, .9],
            ),
            ...this.createUv(
                [.1, .9],
                [.4, .9],
                [.5, 1],
                [0, 1],
            ),
            ...this.createUv(
                [0, .5],
                [.1, .6],
                [.1, .9],
                [0, 1],
            )
        ]
        return { vArr, cArr, uArr }
    },
    createBox: (
        v1: A3, v2: A3, v3: A3, v4: A3,
        v5: A3, v6: A3, v7: A3, v8: A3,
    ) => {
        const vArr = [
            ..._M.createPolygon(v1, v2, v3, v4), // f
            ..._M.createPolygon(v6, v5, v8, v7), // back
            ..._M.createPolygon(v4, v3, v7, v8), // top
            ..._M.createPolygon(v2, v1, v5, v6), // bottom
            ..._M.createPolygon(v5, v1, v4, v8), // left
            ..._M.createPolygon(v2, v6, v7, v3), // right
        ]

        return {
            vArr
        }
    },

    interpolateArrays: (data: { 
        paths: A3[][], 
        forms: number[][], 
        colors: A3[], 
        n: number }
    ) => {
        const { paths, forms, colors, n } = data

        const formsReal = []
        const pathsReal = []
        const colorsReal = []
    
        const nInForms = n / (forms.length - 1)
        const nInPaths = n / (paths.length - 1)
        const nInColors = n / (colors.length - 1)

        for (let i = 0; i < n; ++i) {
            {  // create forms
                const prevFormIndex = Math.floor(i / nInForms)
                const nextFormIndex = prevFormIndex + 1
                const phasePrevNext = i % nInForms / nInForms
    
                if (!forms[prevFormIndex]) {
                    console.log('error data in interpolate')
                    return { paths: [], forms: [], colors: [] }
                }

                const prevForm = forms[prevFormIndex]
                const nextForm = forms[nextFormIndex] ? forms[nextFormIndex] : forms[forms.length - 1]
    
                const form = []
                for (let j = 0; j < prevForm.length; ++j) {
                    form.push(prevForm[j] + phasePrevNext * (nextForm[j] - prevForm[j]))
                }
                formsReal.push(form)
            }
    
            { // create paths
                const prevPathIndex = Math.floor(i / nInPaths)
                const nextPathIndex = prevPathIndex + 1
                const phasePrevNext = i % nInPaths / nInPaths

                if (!paths[prevPathIndex]) {
                    console.log('error data in interpolate')
                    return { paths: [], forms: [], colors: [] }
                }
    
                const prevPath = paths[prevPathIndex]
                const nextPath = paths[nextPathIndex] ? paths[nextPathIndex] : paths[paths.length - 1]
    
                const path: A3[] = []
                if (!nextPath.length) {
                    pathsReal.push(path)
                    continue;
                }
    
                for (let j = 0; j < prevPath.length; ++j) {
                    const p: A3 = [null, null, null]
                    for (let k = 0; k < prevPath[j].length; ++k) {
                        p[k] = prevPath[j][k] + phasePrevNext * (nextPath[j][k] - prevPath[j][k])
                    }
                    path.push(p)
                }
                pathsReal.push(path)
            }
    
            { // create colors
                const prevCIndex = Math.floor(i / nInColors)
                const nextCIndex = prevCIndex + 1
                const phasePrevNext = (i % nInColors) / nInColors

                if (!colors[prevCIndex]) {
                    console.log('error data in interpolate')
                    return { paths: [], forms: [], colors: [] }
                }

    
                const prevC: A3 = colors[prevCIndex]
                const nextC: A3 = colors[nextCIndex] ? colors[nextCIndex] : colors[colors.length - 1]
    
                const color: A3 = [null, null, null]
                for (let j = 0; j < prevC.length; ++j) {
                    color[j] = prevC[j] + phasePrevNext * (nextC[j] - prevC[j])
                }
                colorsReal.push(color)
            }
        }

        return { paths: pathsReal, forms: formsReal, colors: colorsReal }
    },

    createMesh: (data: {
        v: number[], 
        uv?: number[], 
        c?: number[], 
        material?: MeshBasicMaterial | MeshPhongMaterial,
    }) => {

        const { 
            v = [], 
            uv = [], 
            c = [],
            material = new MeshBasicMaterial({ color: 0x777777 }) 
        } = data
    
        const geometry = new BufferGeometry()
        const vF32 = new Float32Array(v)
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
        return new Mesh(geometry, material)
    },
    
    // makeCreaterSquare: (data: { w: number }) => {
    //     const { w } = data 
    //     const lineMaterial = new LineBasicMaterial({ color: 0x0000ff })
    //     const linePoints = [
    //         new Vector3(-w / 2, 0, -w / 2),
    //         new Vector3(-w / 2, 0, w / 2),
    //         new Vector3(w / 2, 0, w / 2),
    //         new Vector3(w / 2, 0, -w / 2),
    //         new Vector3(-w / 2, 0, -w / 2),
    //     ]
    //     const geometry = new BufferGeometry().setFromPoints(linePoints)
    
    //     return () => {
    //         return new Line(geometry, lineMaterial)
    //     }
    // }
}


import * as THREE from 'three'
import { 
    Matrix4, 
    Vector3,
    MeshBasicMaterial,
    MeshPhongMaterial,
    BufferGeometry,
    BufferAttribute,
    Mesh,
} from "three"

export type A3 = [number, number, number]
export type A2 = [number, number]

let geomLabel: THREE.PlaneGeometry | null = null

export const _M = {
    createPolygon: function(v0: A3, v1: A3, v2: A3, v3: A3) { return  [...v0, ...v1, ...v2, ...v0, ...v2, ...v3] },
    fillColorFace: (c: A3) => [...c, ...c, ...c, ...c, ...c, ...c],
    createUv: (v1: A2, v2: A2, v3: A2, v4: A2) => [...v1, ...v2, ...v3, ...v1, ...v3, ...v4],
    createBevel4P: function (v0: A3, v1: A3, v2: A3, v3: A3, height: number = 1, isCap: boolean = false): number[] {
        const v: number[] = []
        v.push(
            ..._M.createPolygon(
                v0, 
                v1,
                [v1[0], v1[1] + height, v1[2]],
                [v0[0], v0[1] + height, v0[2]],
            ),
            ..._M.createPolygon(
                v1, 
                v2,
                [v2[0], v2[1] + height, v2[2]],
                [v1[0], v1[1] + height, v1[2]],
            ),
            ..._M.createPolygon(
                v2, 
                v3,
                [v3[0], v3[1] + height, v3[2]],
                [v2[0], v2[1] + height, v2[2]],
            ),
            ..._M.createPolygon(
                v3, 
                v0,
                [v0[0], v0[1] + height, v0[2]],
                [v3[0], v3[1] + height, v3[2]],
            ),
            ...(isCap ? _M.createPolygon(
                [v0[0], v0[1] + height, v0[2]],
                [v1[0], v1[1] + height, v1[2]],
                [v2[0], v2[1] + height, v2[2]],
                [v3[0], v3[1] + height, v3[2]],
            ) : [])
        )
        return v
    },
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
        uv2?: number[], 
        c?: number[],
        forceMat?: number[],
        material?: MeshBasicMaterial | MeshPhongMaterial | THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial,
    }) => {

        const { 
            v = [], 
            uv = [],
            uv2 = [], 
            c = [],
            forceMat = [],
            material = new MeshBasicMaterial({ color: 0x777777 }) 
        } = data

        const geometry = _M.createBufferGeometry({ v, uv, uv2, c, forceMat })
    
        return new Mesh(geometry, material)
    },
    createBufferGeometry: (data: {
        v: number[], 
        uv?: number[], 
        uv2?: number[], 
        c?: number[],
        forceMat?: number[],
    }): BufferGeometry => {
        const { v = [], uv = [], uv2 = [], c = [], forceMat = [] } = data

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

        const c = _M.normRGBtoHex(...color)

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

    dist (v1: [number, number], v2: [number, number]) {
        return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]))
    },

    componentToHex (c: number) {
        c *= 256
        c = Math.floor(c) - 1
        if (c < 0) c = 0
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    },

    normRGBtoHex(r: number, g: number, b: number): string {
        const rN = _M.componentToHex(r)
        const gN = _M.componentToHex(g)
        const bN = _M.componentToHex(b)
        return "#" + rN + gN + bN
    },  

    hexToNormalizedRGB(hex: string): [number, number, number] {
        // Remove any leading # if present
        const sanitizedHex = hex.replace(/^#/, '');
        
        // Parse the r, g, b values from the hex string
        const r = parseInt(sanitizedHex.substring(0, 2), 16) / 255;
        const g = parseInt(sanitizedHex.substring(2, 4), 16) / 255;
        const b = parseInt(sanitizedHex.substring(4, 6), 16) / 255;
      
        return [r, g, b];
    },

    area (vertices: [number, number][]) {
        var total = 0;
    
        for (var i = 0, l = vertices.length; i < l; i++) {
            var addX = vertices[i][0];
            var addY = vertices[i == vertices.length - 1 ? 0 : i + 1][1];
            var subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
            var subY = vertices[i][1];
    
            total += (addX * addY * 0.5);
            total -= (subX * subY * 0.5);
        }
    
        return Math.abs(total)
    },

    center: (points: [number, number][]): [number, number] => {
        let area = 0
        let Cx = 0
        let Cy = 0
        const n = points.length
        
        for (let i = 0; i < n; i++) {
            const [x0, y0] = points[i]
            const [x1, y1] = points[(i + 1) % n]
        
            const cross = (x0 * y1) - (x1 * y0)
            area += cross
            Cx += (x0 + x1) * cross
            Cy += (y0 + y1) * cross
        }
        
        area /= 2
        
        if (area === 0) {
            throw new Error('Area of polygon is zero (possibly degenerate polygon)')
        }
        
        Cx /= (6 * area)
        Cy /= (6 * area)
        
        return [Cx, Cy]
    },

    getLastAndFirstCoordsPath: (p1: number[], p2: number[]): number[] => {
        return [
            p1[p1.length - 3],
            p1[p1.length - 2],
            p1[p1.length - 1],
            p2[0],
            p2[1],
            p2[2],
        ]
    },

    convertSimpleProfileToV3: (path: number[][]): number[] => {
        const path0 = []
        for (let i = 0; i < path.length; ++i) {
            path0.push(0, path[i][1], path[i][0])
        }
        return path0
    },

    isEqualsV3: (v1_1: any, v1_2: any, v1_3: any, v2_1: any, v2_2: any , v2_3: any): boolean => {
        return (v1_1 === v2_1 && v1_2 === v2_2 && v1_3 === v2_3)
    }, 

    fillPoligonsV3: (
        path1: number[],
        pathR: number[], 
        l: number,
        uvData: number[], 
        color: A3,
        maxH: number = 1.5,
        isCanRepeatFill: boolean = true 
    ) => {
        const v = []
        const uv = []
        const c = []
        const path2 = [...pathR]
        _M.translateVertices(path2, l, 0, 0)
    
        for (let i = 3; i < path1.length; i += 3) {

            const isEqualsBottom = _M.isEqualsV3(path1[i - 3], path1[i - 2], path1[i - 1], path2[i - 3], path2[i - 2], path2[i - 1])
            const isEqualsTop = _M.isEqualsV3(path1[i], path1[i + 1], path1[i + 2], path2[i], path2[i + 1], path2[i + 2])
            if (isEqualsBottom && isEqualsTop) {
                continue;
            }

            const n = Math.floor((path1[i + 1] - path2[i - 2]) / maxH) + 1 // делим в высоту чтобы текстура не была вытянута
            const d = (path1[i + 1] - path1[i - 2]) / n

            if (path1[i - 2] > path1[i + 1]) {
               v.push(..._M.createPolygon(
                    [path1[i - 3] , path1[i - 2], path1[i - 1]],
                    [path2[i - 3], path2[i - 2], path2[i - 1]],
                    [path2[i], path2[i + 1], path2[i + 2]],
                    [path1[i], path1[i + 1], path1[i + 2]],
                ))
                uv.push(...uvData)
                c.push(..._M.fillColorFace(color))
            } else {
                if (isCanRepeatFill && path1[i - 3] === path1[i] && path2[i - 3] === path2[i]) { // элемент не трапеция 
                    let nW = 1
                    let dW = path2[i - 3] - path1[i - 3]
    
                    nW = Math.floor((path2[i - 3] - path1[i - 3]) / maxH) + 1
                    dW = (path2[i - 3] - path1[i - 3]) / nW
    
                    for (let j = 0; j < n; ++j) {
                        for (let k = 0; k < nW; ++k) {
                            v.push(..._M.createPolygon(
                                [path1[i - 3] + (k * dW), path1[i - 2] + j * d, path1[i - 1]],
                                [path1[i - 3] + (k + 1) * dW, path2[i - 2] + j * d, path2[i - 1]],
                                [path1[i] + (k + 1) * dW, path2[i - 2] + (j + 1) * d, path2[i + 2]],
                                [path1[i]  + (k * dW), path1[i - 2] + (j + 1) * d, path1[i + 2]],
                            ))
                            uv.push(...uvData)
                            c.push(..._M.fillColorFace(color))
                        }
                    }
                } else {
                    for (let j = 0; j < n; ++j) {
                        v.push(..._M.createPolygon(
                            [path1[i - 3] , path1[i - 2] + j * d, path1[i - 1]],
                            [path2[i - 3], path2[i - 2] + j * d, path2[i - 1]],
                            [path2[i], path2[i - 2] + (j + 1) * d, path2[i + 2]],
                            [path1[i], path1[i - 2] + (j + 1) * d, path1[i + 2]],
                        ))
                        uv.push(...uvData)
                        c.push(..._M.fillColorFace(color))
                    }
                }
            }
        }
    
        return { v, uv, c }
    },

    lathePath: (path: [number, number][], resolution: number, color: A3, uvTile: number[]): { v: number[], uv: number[], c: number[] } => {
        const v: number[] = []
        const uv: number[] = []
        const c: number[] = []

        const n = resolution
        const angle = Math.PI * 2 / n
        let save = null
        let saveStart = null
        for (let i = 0; i < n; ++i) {
            const pX = Math.cos(-angle * i + angle * .5) 
            const pZ = Math.sin(-angle * i + angle * .5)

            const curr = []
            for (let j = 0; j < path.length; ++j) {
                curr.push([
                    pX * path[j][0], 
                    path[j][1], 
                    pZ * path[j][0], 
                ])

                if (save && j > 0) {
                    v.push(..._M.createPolygon(
                        [save[j - 1][0], save[j - 1][1], save[j - 1][2]],
                        [curr[j - 1][0], curr[j - 1][1], curr[j - 1][2]],
                        [curr[j][0], curr[j][1], curr[j][2]],
                        [save[j][0], save[j][1], save[j][2]],
                    ))
                    c.push(..._M.fillColorFace(color))
                    uv.push(...uvTile)
                }

                if (save && j === path.length - 1) { // cap top
                    v.push(
                        curr[j][0], curr[j][1], curr[j][2],
                        0, curr[j][1], 0, 
                        save[j][0], save[j][1], save[j][2],

                    ) 
                    c.push(...color, ...color, ...color)
                    uv.push(0, 0, 0, 0, 0, 0)
                }
            }
            save = curr
            if (i === 0) {
                saveStart = curr
            }

            if (i === n - 1) {
                for (let j = 1; j < path.length; ++j) {    
                    v.push(..._M.createPolygon(
                        [curr[j - 1][0], curr[j - 1][1], curr[j - 1][2]],
                        [saveStart[j - 1][0], saveStart[j - 1][1], saveStart[j - 1][2]],
                        [saveStart[j][0], saveStart[j][1], saveStart[j][2]],
                        [curr[j][0], curr[j][1], curr[j][2]],
                    ))
                    c.push(..._M.fillColorFace(color))
                    uv.push(...uvTile)

                    if (save && j === path.length - 1) { // cap top
                        v.push(
                            0, curr[j][1], 0, 
                            curr[j][0], curr[j][1], curr[j][2],
                            saveStart[j][0], saveStart[j][1], saveStart[j][2],
                        ) 
                        c.push(...color, ...color, ...color)
                        uv.push(0, 0, 0, 0, 0, 0)
                    }
                }
            }
        }

        return { v, uv, c }
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

    toleranceToZero: (num: number, tolerance = 1e-10) => Math.abs(num) < tolerance ? 0 : num,

    appendMirrorX: (v: number[], c: number[], uv: number[]) => {
        const copyV = []
        const copyC = []
        for (let i = 0; i < v.length; i += 18) {
            const p0 = [-v[i], v[i + 1], v[i + 2]]
            const p1 = [-v[i + 3], v[i + 4], v[i + 5]]
            const p4 = [-v[i + 12], v[i + 13], v[i + 14]]    
            const p5 = [-v[i + 15], v[i + 16], v[i + 17]]
            copyV.push(...p1)
            copyV.push(...p0)
            copyV.push(...p5)
            copyV.push(...p1)
            copyV.push(...p5)
            copyV.push(...p4)

            const c0 = [c[i], c[i + 1], c[i + 2]]
            const c1 = [c[i + 3], c[i + 4], c[i + 5]]
            const c4 = [c[i + 12], c[i + 13], c[i + 14]]    
            const c5 = [c[i + 15], c[i + 16], c[i + 17]]
            copyC.push(...c1)
            copyC.push(...c0)
            copyC.push(...c5)
            copyC.push(...c1)
            copyC.push(...c5)
            copyC.push(...c4)
        }
        const copyUV = [...uv]

        v.push(...copyV)
        c.push(...copyC)
        uv.push(...copyUV)
    },

    fillUvByPositionsXZ (v: number[]) {
        let minX = Infinity
        let maxX = -Infinity
        let minZ = Infinity
        let maxZ = -Infinity

        for (let j = 0; j < v.length; j += 3) {
            if (minX > v[j]) {
                minX = v[j]
            }
            if (maxX < v[j]) {
                maxX = v[j]
            }
            if (minZ > v[j + 2]) {
                minZ = v[j + 2]
            }
            if (maxZ < v[j + 2]) {
                maxZ = v[j + 2]
            }
        }
        const lx = maxX - minX
        const lz = maxZ - minZ

        const uv1: number[] = []
        for (let j = 0; j < v.length; j += 3) {
            const x = (v[j] - minX) / lx
            const z = (v[j + 2] - minZ) / lz
            uv1.push(z, x)
        }

        return uv1
    }
}
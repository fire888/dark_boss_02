import { Matrix4, Vector3 } from "three"

// Чистая часть _GM для фабрик геометрии: только математика (Vector3, Matrix4) и массивы чисел.
// Без Mesh, Material, Texture, BufferGeometry и DOM — модуль должен грузиться в Web Worker и в Node.
// Рендер-хелперы (createMesh, createBufferGeometry, createLabel, createLine, getAngleDirY, waitClick*)
// — в _helpers.ts (_H).

// точка или вектор в 3D и точка в uv
export type A3 = [number, number, number]
export type A2 = [number, number]
// Массивы геометрии; любой может отсутствовать, кроме v.
//   v        — координаты вершин, по 3 числа на вершину
//   index    — номера вершин, по 3 на треугольник; без index каждые 3 вершины v — треугольник
//   uv       — координаты в атласе цвета, по 2 на вершину
//   uv2      — координаты в атласе затенения (aoMap), по 2 на вершину
//   c        — цвет вершины с запечённым светом, по 3 на вершину (r, g, b в [0, 1])
//   vCollide — прокси для физики: triangle soup без index, по 9 чисел на треугольник
export type IArraysGeom = {
    index?: number[],
    v: number[],
    uv?: number[],
    uv2?: number[],
    c?: number[],
    vCollide?: number[],
}
// возврат фабрик src/geometry: все шесть массивов обязательны
export type IBuffersGeom = {
    index: number[],
    v: number[],
    uv: number[],
    uv2: number[],
    c: number[],
    vCollide: number[],
}

export type IArrayForBuffers = {
    v: number[]
    uv: number[]
    c: number[]
    vCollide?: number[]
    forceMat?: number[]
    w?: number
    h?: number
    d?: number
}

export type IDebugArraysResult = {
    ok: boolean
    errors: string[]
}

// Регион тайла атласа в uv: [uLeft, vBottom, uRight, vTop]. Текстура грузится с flipY,
// поэтому верх картинки — v = 1.
export type T_TileRect = [number, number, number, number]

// отступ внутрь региона в пикселях: мипмапы и фильтрация не подтягивают соседний тайл
const TILE_INSET = 2

// #region builder

// Нормаль поверхности в заданной точке. Для изогнутых граней свет запекается от нормали в самой
// вершине, а не от одной нормали на грань, — так изгиб читается плавным
export type F_Nrm = (point: A3) => A3

export type T_LightOpts = {
    light?: A3,       // направление на «солнце», нормируется
    ambient?: number, // заполняющий свет: доля яркости, которая есть у грани в тени
    diffuse?: number, // доля яркости от «солнца» у грани, повёрнутой прямо к нему
}

// Сборщик индексированной геометрии по контракту src/geometry. Один вызов quad/tri — одна грань
// со своими вершинами; все массивы растут вместе и не расходятся
export type T_GeomBuilder = {
    // все шесть массивов; фабрика возвращает его как есть
    g: IBuffersGeom,
    // Четырёхугольная грань, вершины по контуру: bottomStart -> bottomEnd -> topEnd -> topStart.
    // bottomStart, bottomEnd ложатся на нижний край тайла, topEnd, topStart — на верхний.
    // outwardNormal — куда грань смотрит наружу от тела; по нему выбирается обход и считается свет.
    // uvQuad, aoUvQuad — по 8 чисел (uv четырёх вершин в том же порядке) для атласа цвета и затенения.
    // baseColor — цвет до освещения. normalAt — нормаль в вершине для изогнутой грани
    quad: (
        bottomStart: A3, bottomEnd: A3, topEnd: A3, topStart: A3, outwardNormal: A3,
        uvQuad: number[], aoUvQuad: number[], baseColor: A3, normalAt?: F_Nrm,
    ) => void,
    // Треугольная грань; uvTri, aoUvTri — по 6 чисел в порядке point0, point1, point2
    tri: (
        point0: A3, point1: A3, point2: A3, outwardNormal: A3,
        uvTri: number[], aoUvTri: number[], baseColor: A3, normalAt?: F_Nrm,
    ) => void,
    // прокси для физики: дописывают треугольники в vCollide (triangle soup без index), обход не важен
    collideQuad: (point0: A3, point1: A3, point2: A3, point3: A3) => void,
    collideTri: (point0: A3, point1: A3, point2: A3) => void,
    // запечённый свет с настройками этого сборщика
    lit: (baseColor: A3, normal: A3) => A3,
}

const normalize3 = (vector: A3): A3 => {
    const length = Math.hypot(...vector)
    return [vector[0] / length, vector[1] / length, vector[2] / length]
}

// Освещение запекается в цвет вершин, чтобы форма читалась и на MeshBasicMaterial:
// ламберт от одного направленного «солнца» плюс заполняющий свет. Общее для всех фабрик уровня
const LIGHT: A3 = normalize3([.6, .7, .45])
const AMBIENT = .4
const DIFFUSE = .6

// Смотрит ли треугольник point0 -> point1 -> point2 (против часовой стрелки — лицевая сторона)
// туда же, куда outwardNormal. Обход выбирается по этой подсказке, чтобы не выписывать его руками
const facesTo = (point0: A3, point1: A3, point2: A3, outwardNormal: A3): boolean => {
    const edge1 = [point1[0] - point0[0], point1[1] - point0[1], point1[2] - point0[2]]
    const edge2 = [point2[0] - point0[0], point2[1] - point0[1], point2[2] - point0[2]]
    // нормаль треугольника — векторное произведение рёбер edge1 × edge2
    const normalX = edge1[1] * edge2[2] - edge1[2] * edge2[1]
    const normalY = edge1[2] * edge2[0] - edge1[0] * edge2[2]
    const normalZ = edge1[0] * edge2[1] - edge1[1] * edge2[0]
    return normalX * outwardNormal[0] + normalY * outwardNormal[1] + normalZ * outwardNormal[2] >= 0
}

// цвет вершины: min(1, baseColor × (ambient + diffuse · max(0, normal · light)))
const lit = (
    baseColor: A3, normal: A3, light: A3 = LIGHT, ambient: number = AMBIENT, diffuse: number = DIFFUSE,
): A3 => {
    // освещённость от «солнца»: косинус угла между нормалью и направлением на него, обратная сторона — 0
    const sunAmount = Math.max(0, normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2])
    const brightness = ambient + diffuse * sunAmount
    return [
        Math.min(1, baseColor[0] * brightness),
        Math.min(1, baseColor[1] * brightness),
        Math.min(1, baseColor[2] * brightness),
    ]
}

// Каждая грань — один вызов: push-и в v, uv, uv2, c, index идут вместе, своя четвёрка (тройка)
// вершин на грань. При смене обхода вершины меняются местами вместе со своими uv и uv2,
// иначе ориентированный тайл (AO) ляжет транспонированным
const createGeomBuilder = (opts: T_LightOpts = {}): T_GeomBuilder => {
    const light = opts.light ? normalize3(opts.light) : LIGHT
    const ambient = opts.ambient ?? AMBIENT
    const diffuse = opts.diffuse ?? DIFFUSE

    const g: IBuffersGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
    const { index, v, uv, uv2, c, vCollide } = g

    const litWithOwnLight = (baseColor: A3, normal: A3): A3 => lit(baseColor, normal, light, ambient, diffuse)

    // Дописывает вершины грани. points — уже в итоговом обходе, uvOrder[i] — номер исходной вершины
    // для points[i]: по нему берутся её uv и uv2 из массивов в исходном порядке
    const pushVertices = (
        points: A3[], uvOrder: number[], uvs: number[], aoUvs: number[], baseColor: A3, normalAt: F_Nrm,
    ) => {
        for (let i = 0; i < points.length; ++i) {
            const source = uvOrder[i]
            v.push(...points[i])
            uv.push(uvs[source * 2], uvs[source * 2 + 1])
            uv2.push(aoUvs[source * 2], aoUvs[source * 2 + 1])
            c.push(...litWithOwnLight(baseColor, normalAt(points[i])))
        }
    }

    return {
        g,
        quad: (
            bottomStart, bottomEnd, topEnd, topStart, outwardNormal,
            uvQuad, aoUvQuad, baseColor, normalAt = () => outwardNormal,
        ) => {
            let points = [bottomStart, bottomEnd, topEnd, topStart]
            let uvOrder = [0, 1, 2, 3]
            // обход смотрит не туда — идём по контуру в обратную сторону от той же первой вершины
            if (!facesTo(bottomStart, bottomEnd, topEnd, outwardNormal)) {
                points = [bottomStart, topStart, topEnd, bottomEnd]
                uvOrder = [0, 3, 2, 1]
            }
            const firstIndex = v.length / 3
            pushVertices(points, uvOrder, uvQuad, aoUvQuad, baseColor, normalAt)
            // два треугольника веером из первой вершины
            index.push(firstIndex, firstIndex + 1, firstIndex + 2, firstIndex, firstIndex + 2, firstIndex + 3)
        },
        tri: (point0, point1, point2, outwardNormal, uvTri, aoUvTri, baseColor, normalAt = () => outwardNormal) => {
            let points = [point0, point1, point2]
            let uvOrder = [0, 1, 2]
            if (!facesTo(point0, point1, point2, outwardNormal)) {
                points = [point0, point2, point1]
                uvOrder = [0, 2, 1]
            }
            const firstIndex = v.length / 3
            pushVertices(points, uvOrder, uvTri, aoUvTri, baseColor, normalAt)
            index.push(firstIndex, firstIndex + 1, firstIndex + 2)
        },
        collideQuad: (point0, point1, point2, point3) => {
            vCollide.push(...point0, ...point1, ...point2, ...point0, ...point2, ...point3)
        },
        collideTri: (point0, point1, point2) => {
            vCollide.push(...point0, ...point1, ...point2)
        },
        lit: litWithOwnLight,
    }
}

// #endregion

export const _GM = {
    // #region builder
    facesTo,
    lit,
    createGeomBuilder,
    // #endregion

    // #region legacy — функции старых глав: неиндексированные массивы, по 6 вершин на квад.
    // Новые фабрики src/geometry их не используют; смысл не менять — на них стоят главы

    // квад v0 -> v1 -> v2 -> v3 как два треугольника (v0, v1, v2) и (v0, v2, v3) — 18 чисел
    createPolygon: function(v0: A3, v1: A3, v2: A3, v3: A3) { return  [...v0, ...v1, ...v2, ...v0, ...v2, ...v3] },
    createPolygonV: function(v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3) { return  [
        ...v0.toArray(), ...v1.toArray(), ...v2.toArray(), ...v0.toArray(), ...v2.toArray(), ...v3.toArray()
    ]},
    // один цвет на 6 вершин квада из createPolygon
    fillColorFace: (c: A3) => [...c, ...c, ...c, ...c, ...c, ...c],
    // uv четырёх углов квада, разложенные на 6 вершин в порядке createPolygon
    createUv: (v1: A2, v2: A2, v3: A2, v4: A2) => [...v1, ...v2, ...v3, ...v1, ...v3, ...v4],

    // #endregion

    // #region atlas

    // Регион тайла по его положению в пикселях картинки атласа размером atlasSize × atlasSize:
    // x вправо, y вниз от левого верхнего угла, width × height — размер тайла
    tileRect: (atlasSize: number, x: number, y: number, width: number, height: number): T_TileRect => [
        (x + TILE_INSET) / atlasSize,
        1 - (y + height - TILE_INSET) / atlasSize,
        (x + width - TILE_INSET) / atlasSize,
        1 - (y + TILE_INSET) / atlasSize,
    ],
    // 12 чисел — неиндексированный квад из 6 вершин (старый формат, для глав)
    rectUv: (rect: T_TileRect): number[] =>
        _GM.createUv([rect[0], rect[1]], [rect[2], rect[1]], [rect[2], rect[3]], [rect[0], rect[3]]),
    // 8 чисел — индексированный квад bottomStart, bottomEnd, topEnd, topStart: первые две — низ тайла,
    // вторые две — верх
    rectUvQ: (rect: T_TileRect): number[] =>
        [rect[0], rect[1], rect[2], rect[1], rect[2], rect[3], rect[0], rect[3]],
    // тот же квад с тайлом, перевёрнутым по вертикали: верх картинки ложится на нижнее ребро квада
    flipUvQ: (uvQuad: number[]): number[] =>
        [uvQuad[6], uvQuad[7], uvQuad[4], uvQuad[5], uvQuad[2], uvQuad[3], uvQuad[0], uvQuad[1]],
    // точка внутри региона: fractionX — доля ширины слева направо, fractionY — доля высоты снизу вверх
    rectPoint: (rect: T_TileRect, fractionX: number, fractionY: number): A2 =>
        [rect[0] + (rect[2] - rect[0]) * fractionX, rect[1] + (rect[3] - rect[1]) * fractionY],

    // #endregion

    // #region legacy

    // Боковые стенки призмы высотой height над четырёхугольником v0..v3 в основании;
    // isCap — добавить крышку сверху
    createBevel4P: function (v0: A3, v1: A3, v2: A3, v3: A3, height: number = 1, isCap: boolean = false): number[] {
        const v: number[] = []
        v.push(
            ..._GM.createPolygon(
                v0, 
                v1,
                [v1[0], v1[1] + height, v1[2]],
                [v0[0], v0[1] + height, v0[2]],
            ),
            ..._GM.createPolygon(
                v1, 
                v2,
                [v2[0], v2[1] + height, v2[2]],
                [v1[0], v1[1] + height, v1[2]],
            ),
            ..._GM.createPolygon(
                v2, 
                v3,
                [v3[0], v3[1] + height, v3[2]],
                [v2[0], v2[1] + height, v2[2]],
            ),
            ..._GM.createPolygon(
                v3, 
                v0,
                [v0[0], v0[1] + height, v0[2]],
                [v3[0], v3[1] + height, v3[2]],
            ),
            ...(isCap ? _GM.createPolygon(
                [v0[0], v0[1] + height, v0[2]],
                [v1[0], v1[1] + height, v1[2]],
                [v2[0], v2[1] + height, v2[2]],
                [v3[0], v3[1] + height, v3[2]],
            ) : [])
        )
        return v
    },
    // применяет матрицу к каждой тройке координат массива на месте
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
    // сдвиг и повороты вокруг осей — на месте, по каждой тройке координат
    translateVertices(v: number[], x: number, y: number, z: number) {
        const m4 = new Matrix4().makeTranslation(x, y, z)
        _GM.applyMatrixToArray(m4, v)
    },
    rotateVerticesX(v: number[], angle: number) {
        const m4 = new Matrix4().makeRotationX(angle)
        _GM.applyMatrixToArray(m4, v)
    },
    rotateVerticesY(v: number[], angle: number) {
        const m4 = new Matrix4().makeRotationY(angle)
        _GM.applyMatrixToArray(m4, v)
    },
    rotateVerticesZ(v: number[], angle: number) {
        const m4 = new Matrix4().makeRotationZ(angle)
        _GM.applyMatrixToArray(m4, v)
    },
    // угол точки (x, y) от оси x в [0, 2PI)
    angleFromCoords (x: number, y: number) {
        let rad = Math.atan(y / x)
        x < 0 && y > 0 && (rad = Math.PI - Math.abs(rad))
        x < 0 && y <= 0 && (rad = Math.PI + Math.abs(rad))
        rad += Math.PI * 6
        rad = rad % (Math.PI * 2)
        return rad
    },
    // угол точки (x, z) в плоскости пола от оси x в [0, 2PI), рост — от +x к −z
    angleFromCoords2 (x: number, z: number) {
        let angle = Math.atan2(-z, x)
        if (angle < 0) angle += 2 * Math.PI
        return angle
    },
    // дописывает в массив треугольников их отражение по z (с обратным обходом)
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
    // uv по координатам x, y вершин, растянутым на [0, 1] по габаритам
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
    // ran(max) — случайное в [0, max), ran(min, max) — в [min, max)
    ran: function (start: number, end: number | null = null) {
        if (end === null) {
            return Math.random() * start;
        } 
        return start + Math.random() * (end - start) 
    },
    // цвета для createFaceWithSquare: c1 — внутренний квадрат, c2 — четыре квада рамки
    fillColorFaceWithSquare: function(c1: A3, c2: A3){ return [
        ...this.fillColorFace(c1),
        ...this.fillColorFace(c2),
        ...this.fillColorFace(c2),
        ...this.fillColorFace(c2),
        ...this.fillColorFace(c2),
    ]},
    // плоская грань v1..v4 в плоскости xy: случайный квадрат внутри и рамка из 4 квадов вокруг
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
    // коробка по 8 углам: v1..v4 — передняя грань, v5..v8 — задняя
    createBox: (
        v1: A3, v2: A3, v3: A3, v4: A3,
        v5: A3, v6: A3, v7: A3, v8: A3,
    ) => {
        const vArr = [
            ..._GM.createPolygon(v1, v2, v3, v4), // f
            ..._GM.createPolygon(v6, v5, v8, v7), // back
            ..._GM.createPolygon(v4, v3, v7, v8), // top
            ..._GM.createPolygon(v2, v1, v5, v6), // bottom
            ..._GM.createPolygon(v5, v1, v4, v8), // left
            ..._GM.createPolygon(v2, v6, v7, v3), // right
        ]

        return {
            vArr
        }
    },

    // растягивает ключевые пути, профили и цвета на n шагов, линейно интерполируя между соседними ключами
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

    // расстояние между точками на плоскости
    dist (v1: [number, number], v2: [number, number]) {
        return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]))
    },

    // канал цвета [0, 1] в две hex-цифры
    componentToHex (c: number) {
        c *= 256
        c = Math.floor(c) - 1
        if (c < 0) c = 0
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    },

    // цвет [0, 1] в строку '#rrggbb' и обратно
    normRGBtoHex(r: number, g: number, b: number): string {
        const rN = _GM.componentToHex(r)
        const gN = _GM.componentToHex(g)
        const bN = _GM.componentToHex(b)
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

    // площадь многоугольника на плоскости (формула шнурования)
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

    // центр масс многоугольника на плоскости
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

    // последняя точка пути p1 и первая точка пути p2 — 6 чисел
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

    // профиль [[z, y], ...] в плоские координаты [0, y, z, ...]
    convertSimpleProfileToV3: (path: number[][]): number[] => {
        const path0 = []
        for (let i = 0; i < path.length; ++i) {
            path0.push(0, path[i][1], path[i][0])
        }
        return path0
    },

    // совпадают ли две точки, заданные покомпонентно
    isEqualsV3: (v1_1: any, v1_2: any, v1_3: any, v2_1: any, v2_2: any , v2_3: any): boolean => {
        return (v1_1 === v2_1 && v1_2 === v2_2 && v1_3 === v2_3)
    }, 

    // Стенка между профилем path1 и профилем pathR, сдвинутым на l по x; высокие куски режутся
    // по maxH, чтобы текстура не тянулась
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
        _GM.translateVertices(path2, l, 0, 0)
    
        for (let i = 3; i < path1.length; i += 3) {

            const isEqualsBottom = _GM.isEqualsV3(path1[i - 3], path1[i - 2], path1[i - 1], path2[i - 3], path2[i - 2], path2[i - 1])
            const isEqualsTop = _GM.isEqualsV3(path1[i], path1[i + 1], path1[i + 2], path2[i], path2[i + 1], path2[i + 2])
            if (isEqualsBottom && isEqualsTop) {
                continue;
            }

            const n = Math.floor((path1[i + 1] - path2[i - 2]) / maxH) + 1 // делим в высоту чтобы текстура не была вытянута
            const d = (path1[i + 1] - path1[i - 2]) / n

            if (path1[i - 2] > path1[i + 1]) {
               v.push(..._GM.createPolygon(
                    [path1[i - 3] , path1[i - 2], path1[i - 1]],
                    [path2[i - 3], path2[i - 2], path2[i - 1]],
                    [path2[i], path2[i + 1], path2[i + 2]],
                    [path1[i], path1[i + 1], path1[i + 2]],
                ))
                uv.push(...uvData)
                c.push(..._GM.fillColorFace(color))
            } else {
                if (isCanRepeatFill && path1[i - 3] === path1[i] && path2[i - 3] === path2[i]) { // элемент не трапеция 
                    let nW = 1
                    let dW = path2[i - 3] - path1[i - 3]
    
                    nW = Math.floor((path2[i - 3] - path1[i - 3]) / maxH) + 1
                    dW = (path2[i - 3] - path1[i - 3]) / nW
    
                    for (let j = 0; j < n; ++j) {
                        for (let k = 0; k < nW; ++k) {
                            v.push(..._GM.createPolygon(
                                [path1[i - 3] + (k * dW), path1[i - 2] + j * d, path1[i - 1]],
                                [path1[i - 3] + (k + 1) * dW, path2[i - 2] + j * d, path2[i - 1]],
                                [path1[i] + (k + 1) * dW, path2[i - 2] + (j + 1) * d, path2[i + 2]],
                                [path1[i]  + (k * dW), path1[i - 2] + (j + 1) * d, path1[i + 2]],
                            ))
                            uv.push(...uvData)
                            c.push(..._GM.fillColorFace(color))
                        }
                    }
                } else {
                    for (let j = 0; j < n; ++j) {
                        v.push(..._GM.createPolygon(
                            [path1[i - 3] , path1[i - 2] + j * d, path1[i - 1]],
                            [path2[i - 3], path2[i - 2] + j * d, path2[i - 1]],
                            [path2[i], path2[i - 2] + (j + 1) * d, path2[i + 2]],
                            [path1[i], path1[i - 2] + (j + 1) * d, path1[i + 2]],
                        ))
                        uv.push(...uvData)
                        c.push(..._GM.fillColorFace(color))
                    }
                }
            }
        }
    
        return { v, uv, c }
    },

    // Тело вращения: профиль [[радиус, высота], ...] поворачивается вокруг оси y за resolution шагов,
    // сверху — крышка
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
                    v.push(..._GM.createPolygon(
                        [save[j - 1][0], save[j - 1][1], save[j - 1][2]],
                        [curr[j - 1][0], curr[j - 1][1], curr[j - 1][2]],
                        [curr[j][0], curr[j][1], curr[j][2]],
                        [save[j][0], save[j][1], save[j][2]],
                    ))
                    c.push(..._GM.fillColorFace(color))
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
                    v.push(..._GM.createPolygon(
                        [curr[j - 1][0], curr[j - 1][1], curr[j - 1][2]],
                        [saveStart[j - 1][0], saveStart[j - 1][1], saveStart[j - 1][2]],
                        [saveStart[j][0], saveStart[j][1], saveStart[j][2]],
                        [curr[j][0], curr[j][1], curr[j][2]],
                    ))
                    c.push(..._GM.fillColorFace(color))
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

    // число, близкое к нулю, — ровно 0
    toleranceToZero: (num: number, tolerance = 1e-10) => Math.abs(num) < tolerance ? 0 : num,

    // дописывает отражение по x для неиндексированных квадов (по 18 чисел) с цветами и uv
    appendMirrorX: (v: number[], c: number[] = [], uv: number[] = []) => {
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

    // uv по координатам x, z вершин, растянутым на [0, 1] по габаритам
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
    },

    // нормаль каждого треугольника, повторённая на его три вершины
    computeNormals: (vertices: number[]) => {
        const normals = [];

        for (let i = 0; i < vertices.length; i += 9) {
            const p0 = [vertices[i], vertices[i+1], vertices[i+2]];
            const p1 = [vertices[i+3], vertices[i+4], vertices[i+5]];
            const p2 = [vertices[i+6], vertices[i+7], vertices[i+8]];

            // Векторы
            const u = [
                p1[0] - p0[0],
                p1[1] - p0[1],
                p1[2] - p0[2]
            ];
            const v = [
                p2[0] - p0[0],
                p2[1] - p0[1],
                p2[2] - p0[2]
            ];

            // Векторное произведение u × v
            const n = [
                u[1]*v[2] - u[2]*v[1],
                u[2]*v[0] - u[0]*v[2],
                u[0]*v[1] - u[1]*v[0]
            ];

            // Нормализация
            const len = Math.hypot(n[0], n[1], n[2]);
            const normal = len > 0 ? [n[0]/len, n[1]/len, n[2]/len] : [0,0,0];

            // Одна нормаль на все три вершины
            normals.push(...normal, ...normal, ...normal);
        }

        return normals;
    },

    // дописывает src в конец tgt
    fill(src: number[], tgt: number[]) {
        for (let i = 0; i < src.length; i++) {
            tgt.push(src[i])
        }
    },

    // записывает src в начало tgt поверх старых значений
    fillStart(src: number[], tgt: any) {
        for (let i = 0; i < src.length; i++) {
            tgt[i] = src[i]
        }
    },

    // как fillStart, а хвост tgt за src заполняет 1000 — уносит лишние вершины из вида
    fillStartAndThousandLast(src: number[], tgt: any) {
        let n = 0
        for (let i = 0; i < src.length; i++) {
            tgt[i] = src[i]
            n = i
        }

        if (tgt[n + 1]) {
            for (let i = n + 1; i < tgt.length; i++) {
                tgt[i] = 1000
            }
        }
    },

    // копия массива
    clone(src: number[]) {
        const a = []
        for (let i = 0; i < src.length; i++) {
            a.push(src[i])
        }
        return a
    },

    // #endregion

    // Дописывает геометрию part в target и возвращает target. Номера вершин part в index сдвигаются
    // на число вершин, уже занятых в target (наибольший номер + 1). Массив дописывается, только если
    // он есть у обоих
    mergeIndexedArrays: (target: IArraysGeom, part: IArraysGeom): IArraysGeom => {
        if (target.index && part.index) {
            let maxIndex = -1
            for (let i = 0; i < target.index.length; i++) {
                if (maxIndex < target.index[i]) {
                    maxIndex = target.index[i]
                }
            }

            const indexOffset = maxIndex + 1
            for (let i = 0; i < part.index.length; i++) {
                target.index.push(part.index[i] + indexOffset)
            }
        }
        for (let i = 0; i < part.v.length; i++) {
            target.v.push(part.v[i])
        }
        if (part.c && target.c) {
            for (let i = 0; i < part.c.length; i++) {
                target.c.push(part.c[i])
            }
        }
        if (part.uv && target.uv) {
            for (let i = 0; i < part.uv.length; i++) {
                target.uv.push(part.uv[i])
            }
        }
        if (part.uv2 && target.uv2) {
            for (let i = 0; i < part.uv2.length; i++) {
                target.uv2.push(part.uv2[i])
            }
        }
        // vCollide — triangle soup без index, поэтому склеивается простым дописыванием, без смещения
        if (part.vCollide && target.vCollide) {
            for (let i = 0; i < part.vCollide.length; i++) {
                target.vCollide.push(part.vCollide[i])
            }
        }
        return target
    },

    // #region legacy

    // то же, что computeNormals, через Vector3
    computeNormalsV: (v: number[]): number[] => { 
        const n = []
        const pA = new Vector3()
        const pB = new Vector3()
        const pC = new Vector3()

        const ab = new Vector3()
        const bc = new Vector3()
        const cb = new Vector3()

        for (let i = 0; i < v.length; i += 9) {
            pA.set(v[i], v[i + 1], v[i + 2])
            pB.set(v[i + 3], v[i + 4], v[i + 5])
            pC.set(v[i + 6], v[i + 7], v[i + 8])

        
            cb.subVectors(pC, pB)
            ab.subVectors(pA, pB)
            cb.cross(ab)
            
            n.push(
                cb.x, cb.y, cb.z, 
                cb.x, cb.y, cb.z, 
                cb.x, cb.y, cb.z, 
            )

        }

        for (let i = 0; i < n.length; i += 3) {
            pA.set(n[i], n[i + 1], n[i + 2])
            pA.normalize()
            n[i] = pA.x
            n[i + 1] = pA.y
            n[i + 2] = pA.z
        }

        return n
    },

    // #endregion

    // разворачивает индексированные вершины в неиндексированный triangle soup
    vToNonIndexed(v: number[], index: number[]): number[] {
        const r: number[] = []
        for (let i = 0; i < index.length; ++i) {
            const k = index[i] * 3
            r.push(v[k], v[k + 1], v[k + 2])
        }
        return r
    },

    // Проверка согласованности массивов: index ссылается на существующие вершины без пропусков,
    // длины c, uv, uv2 соответствуют числу вершин. Ошибки печатаются и возвращаются списком
    debugArrays: (g: IArraysGeom, message: string = 'result'): IDebugArraysResult => {
        const errors: string[] = []
        const fail = (errorText: string) => {
            errors.push(errorText)
            console.log(errorText)
        }
        const failCount = (name: string, need: number, curr: number) => {
            fail(`${name}: false, curr: ${curr.toFixed(2)}, need: ${need}`)
        }

        console.log('---- start: ' + message)

        const vertexCount = g.v.length / 3

        if (g.index) {
            // проверяем что в v есть вершина на которую ссылается index
            // сравнение с undefined, а не truthy: координата 0 — валидное значение
            const missing: number[] = []
            for (let i = 0; i < g.index.length; i++) {
                if (g.v[g.index[i] * 3] === undefined && missing.length < 10) {
                    missing.push(g.index[i])
                }
            }
            if (missing.length) {
                fail(`index value not in v: ${JSON.stringify(missing)}, max ${g.v.length / 3 - 1} }`)
            }


            // проверяем что нет пропущенных индексов 1, 2, 4: пропущен 3
            const uniqueSortedIndexes = [...new Set(g.index)].sort((a, b) => a - b)
            let isNotPrevPlusOne = false
            for (let i = 1; i < uniqueSortedIndexes.length; i++) {
                if (uniqueSortedIndexes[i - 1] + 1 !== uniqueSortedIndexes[i]) {
                    isNotPrevPlusOne = true
                }
            }
            if (isNotPrevPlusOne) fail('index not used contiguously values v')

            // проверяем что index начинается с 0: иначе первые вершины v висячие
            if (uniqueSortedIndexes.length && uniqueSortedIndexes[0] !== 0) {
                fail(`index starts from ${uniqueSortedIndexes[0]}, not 0: first vertices of v are unused`)
            }

            // проверяем что нет неиспользуемых вершин в v на которых нет ссылки в index
            const maxInd = uniqueSortedIndexes[uniqueSortedIndexes.length - 1]
            if (g.v.length !== 0 && g.index.length !== 0 && g.v.length / 3 - 1 !== maxInd) {
                fail('v has values more than used in index')
            }

            if (g.index.length === 0) fail('index length is 0')
            if (g.v.length === 0) fail('v length is 0')
        }

        // проверяем что v кратно 3
        if (vertexCount % 1 !== 0) fail('v need step 3')

        // проверяем что c кратно соответствует v
        if (g.c && g.c.length / 3 !== vertexCount) failCount('c', vertexCount, g.c.length / 3)
        // проверяем что uv кратно соответствует v
        if (g.uv && g.uv.length / 2 !== vertexCount) failCount('uv', vertexCount, g.uv.length / 2)
        // проверяем что uv2 кратно соответствует v
        if (g.uv2 && g.uv2.length / 2 !== vertexCount) failCount('uv2', vertexCount, g.uv2.length / 2)

        const ok = errors.length === 0
        console.log(`---- complete: ${message}: ${ok ? 'ok' : 'error'}`)
        return { ok, errors }
    },

}

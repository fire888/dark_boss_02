import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { _M } from '_CORE/_M/_m'
import * as ATLAS from 'atlases/atlas00/atlas00'
import * as ATLAS_AO from 'atlases/atlasAo00/atlasAo00'

// Validates a geometry factory by actually running it and inspecting the
// number arrays it returns. Geometry modules are pure and serializable
// (they run inside a Web Worker), so they load and execute fine in Node.
//
// Indexed geometry only (src/geometry, reference — 07_stairs00): all six arrays
// { index, v, uv, uv2, c, vCollide } are required, triangles come from `index`,
// every uv/uv2 triangle must sit inside one atlas region, vertices must not be
// shared between non-coplanar triangles.

const usage = `Usage:
  npm run check:geom -- <module-path> [exportName] [--runs=N] [--args='[...]']

  <module-path>  path to the module, e.g. src/geometry/07_stairs00/stairs00.ts
  [exportName]   factory to call; omitted = the export named like the file (stairs00.ts -> stairs00)
  --runs=N       how many times to call it (default 20; factories use Math.random)
  --args='[...]' JSON array of arguments, e.g. --args='[{"r": 4}]'
`

const positional = []
let runs = 20
let args = []

for (const a of process.argv.slice(2)) {
    if (a.startsWith('--runs=')) runs = Number(a.slice(7))
    else if (a.startsWith('--args=')) args = JSON.parse(a.slice(7))
    else positional.push(a)
}

const [modulePath, exportName] = positional
if (!modulePath) {
    console.error(usage)
    process.exit(2)
}

const mod = await import(pathToFileURL(path.resolve(modulePath)).href)

const factoryName = exportName ?? path.basename(modulePath, path.extname(modulePath))
const factory = mod[factoryName]
if (typeof factory !== 'function') {
    console.error(`Export "${factoryName}" is not a function. Exports: ${JSON.stringify(Object.keys(mod))}`)
    process.exit(2)
}

// atlas regions: every RECT_* export, [u0, v0, u1, v1]
const rectsOf = (m) => Object.entries(m).filter(([k]) => k.startsWith('RECT_')).map(([name, r]) => ({ name, r }))
const RECTS_UV = rectsOf(ATLAS)
const RECTS_UV2 = rectsOf(ATLAS_AO)

const EPS = 1e-9
const inRect = (r, u, v) => u >= r[0] - EPS && u <= r[2] + EPS && v >= r[1] - EPS && v <= r[3] + EPS

const NUM = (label, arr) => {
    const bad = []
    for (let i = 0; i < arr.length; i++) {
        if (!Number.isFinite(arr[i]) && bad.length < 5) bad.push(`${label}[${i}]=${arr[i]}`)
    }
    return bad
}

const bbox = (v) => {
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < v.length; i += 3) {
        for (let a = 0; a < 3; a++) {
            if (v[i + a] < min[a]) min[a] = v[i + a]
            if (v[i + a] > max[a]) max[a] = v[i + a]
        }
    }
    return { min, max, size: max.map((m, a) => m - min[a]) }
}

// triangles as triples of vertex numbers
const triangles = (g) => {
    const t = []
    for (let i = 0; i + 2 < g.index.length; i += 3) t.push([g.index[i], g.index[i + 1], g.index[i + 2]])
    return t
}

// unit normal of a triangle, null when the area is zero
const normal = (v, [a, b, c]) => {
    const ax = v[b * 3] - v[a * 3], ay = v[b * 3 + 1] - v[a * 3 + 1], az = v[b * 3 + 2] - v[a * 3 + 2]
    const bx = v[c * 3] - v[a * 3], by = v[c * 3 + 1] - v[a * 3 + 1], bz = v[c * 3 + 2] - v[a * 3 + 2]
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx
    const len = Math.hypot(nx, ny, nz)
    return len < 1e-12 ? null : [nx / len, ny / len, nz / len]
}

// does one region hold all three uv points of the triangle
const inOneRegion = (rects, uv, tri) =>
    rects.some(({ r }) => tri.every(i => inRect(r, uv[i * 2], uv[i * 2 + 1])))

const checkRange = (label, arr, errors, what) => {
    const out = []
    for (let i = 0; i < arr.length; i++) {
        if ((arr[i] < 0 || arr[i] > 1) && out.length < 5) out.push(`${label}[${i}]=${arr[i]}`)
    }
    if (out.length) errors.push(`${label} outside [0,1] — ${what}: ${out.join(', ')}`)
}

const checkOnce = (result) => {
    let g = result
    const errors = []
    const warnings = []

    if (!g || typeof g !== 'object') return { errors: ['factory did not return an object'], warnings }
    // composite factories return { geomData, segments } rather than the arrays directly
    if (!Array.isArray(g.v) && g.geomData) g = g.geomData
    if (!Array.isArray(g.v)) return { errors: [`result has no \`v\` array; keys: ${JSON.stringify(Object.keys(g))}`], warnings }
    if (g.v.length === 0) errors.push('`v` is empty — factory produced no geometry')

    const missing = ['index', 'uv', 'uv2', 'c', 'vCollide'].filter(k => !Array.isArray(g[k]))
    if (missing.length) {
        return { errors: [`geometry must return { index, v, uv, uv2, c, vCollide }; missing: ${missing.join(', ')}`], warnings }
    }
    if (g.index.length % 3 !== 0) errors.push(`index.length=${g.index.length} is not a multiple of 3`)

    // The shared core check: v/c/uv/uv2 lengths and index integrity.
    const dbg = _M.debugArrays(g, factoryName)
    errors.push(...dbg.errors)

    for (const [label, arr] of [['v', g.v], ['uv', g.uv], ['uv2', g.uv2], ['c', g.c], ['vCollide', g.vCollide], ['index', g.index]]) {
        const bad = NUM(label, arr)
        if (bad.length) errors.push(`non-finite values: ${bad.join(', ')}`)
    }
    if (g.index.some(i => !Number.isInteger(i) || i < 0)) errors.push('index has negative or fractional values')

    checkRange('uv', g.uv, errors, 'will sample the wrong atlas tile')
    checkRange('uv2', g.uv2, errors, 'will sample the wrong AO tile')
    checkRange('c', g.c, errors, 'vertex colors')

    if (g.vCollide.length % 9 !== 0) {
        errors.push(`vCollide must be whole triangles: length=${g.vCollide.length} is not a multiple of 9`)
    }

    // the rest walks triangles and needs consistent arrays
    if (errors.length) return { errors, warnings }

    const tris = triangles(g)
    const normals = tris.map(t => normal(g.v, t))

    const deg = normals.filter(n => !n).length
    if (deg > 0) warnings.push(`${deg} degenerate (zero-area) triangle(s) — normals there will be NaN`)

    // a vertex shared by non-coplanar triangles gets a smoothed normal from
    // computeVertexNormals(): faces must not be welded to each other
    const vn = new Map()
    let welded = 0
    for (let k = 0; k < tris.length; k++) {
        const n = normals[k]
        if (!n) continue
        for (const i of tris[k]) {
            const prev = vn.get(i)
            if (!prev) vn.set(i, n)
            else if (prev[0] * n[0] + prev[1] * n[1] + prev[2] * n[2] < 1 - 1e-4) welded++
        }
    }
    if (welded) errors.push(`${welded} vertex use(s) shared between non-coplanar triangles — faces are welded, the seam will be smoothed`)

    // uv only from the atlas: a triangle spanning two regions or none samples garbage
    for (const [label, uv, rects] of [['uv', g.uv, RECTS_UV], ['uv2', g.uv2, RECTS_UV2]]) {
        let outside = 0
        let sample = ''
        for (const t of tris) {
            if (inOneRegion(rects, uv, t)) continue
            if (!outside) sample = t.map(i => `(${uv[i * 2].toFixed(4)}, ${uv[i * 2 + 1].toFixed(4)})`).join(' ')
            outside++
        }
        if (outside) errors.push(`${outside} triangle(s) with ${label} outside any single RECT_* of its atlas, e.g. ${sample}`)
    }

    // baked lighting: one color for every vertex means it was not baked
    const c0 = g.c.slice(0, 3).join()
    let allSame = true
    for (let i = 3; i < g.c.length && allSame; i += 3) allSame = g.c.slice(i, i + 3).join() === c0
    if (allSame && tris.length > 1) warnings.push('all vertex colors are identical — lighting is not baked into `c`')

    const collideTris = g.vCollide.length / 9
    if (collideTris > 0 && collideTris >= tris.length) {
        warnings.push(`vCollide has ${collideTris} triangles, render geometry ${tris.length} — the proxy is not simpler`)
    }

    const b = bbox(g.v)
    for (const [dim, axis] of [['w', 0], ['h', 1], ['d', 2]]) {
        if (typeof g[dim] === 'number' && Math.abs(b.size[axis] - g[dim]) > 1e-6) {
            warnings.push(`declared ${dim}=${g[dim]} but bbox extent on that axis is ${b.size[axis].toFixed(4)}`)
        }
    }

    return { errors, warnings, bbox: b, verts: g.v.length / 3, tris: tris.length, collideTris }
}

const seen = new Map()
let firstOk = null
let failed = 0

const silence = console.log
console.log = () => {}
for (let run = 0; run < runs; run++) {
    let r
    try {
        r = checkOnce(factory(...args))
    } catch (e) {
        r = { errors: [`threw: ${e.message}`], warnings: [] }
    }
    if (r.errors.length) failed++
    else if (!firstOk) firstOk = r
    for (const m of r.errors) seen.set('ERROR  ' + m, (seen.get('ERROR  ' + m) || 0) + 1)
    for (const m of r.warnings) seen.set('WARN   ' + m, (seen.get('WARN   ' + m) || 0) + 1)
}
console.log = silence

console.log(`${modulePath} :: ${factoryName}()  — ${runs} run(s)`)
if (firstOk) {
    const b = firstOk.bbox
    console.log(`  ${firstOk.verts} verts / ${firstOk.tris} tris / ${firstOk.collideTris} collide tris   bbox size [${b.size.map(n => n.toFixed(2)).join(', ')}]`)
}

const errs = [...seen].filter(([m]) => m.startsWith('ERROR'))
const warns = [...seen].filter(([m]) => m.startsWith('WARN'))

for (const [m, n] of [...errs, ...warns]) {
    console.log(`  ${m}${n < runs ? `   (${n}/${runs} runs)` : ''}`)
}

if (errs.length) {
    console.log(`FAIL — ${failed}/${runs} run(s) had errors`)
    process.exit(1)
}
console.log(warns.length ? 'PASS (with warnings)' : 'PASS')

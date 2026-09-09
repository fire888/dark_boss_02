import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { _M } from '_CORE/_M/_m'

// Validates a geometry factory by actually running it and inspecting the
// number arrays it returns. Geometry modules are pure and serializable
// (they run inside a Web Worker), so they load and execute fine in Node.

const usage = `Usage:
  npm run check:geom -- <module-path> [exportName] [--runs=N] [--args='[...]']

  <module-path>  path to the module, e.g. src/chapter10/geometry/tree00/tree00.ts
  [exportName]   factory to call; omitted = the only export named create*
  --runs=N       how many times to call it (default 20; factories use Math.random)
  --args='[...]' JSON array of arguments, e.g. --args='[1, 20, 8]'
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

let factoryName = exportName
if (!factoryName) {
    const candidates = Object.keys(mod).filter(k => k.startsWith('create') && typeof mod[k] === 'function')
    if (candidates.length !== 1) {
        console.error(`Cannot pick a factory automatically. create* exports: ${JSON.stringify(candidates)}`)
        console.error('Pass the export name explicitly.')
        process.exit(2)
    }
    factoryName = candidates[0]
}

const factory = mod[factoryName]
if (typeof factory !== 'function') {
    console.error(`Export "${factoryName}" is not a function. Exports: ${JSON.stringify(Object.keys(mod))}`)
    process.exit(2)
}

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

const degenerateTriangles = (v) => {
    let n = 0
    for (let i = 0; i + 8 < v.length; i += 9) {
        const ax = v[i + 3] - v[i], ay = v[i + 4] - v[i + 1], az = v[i + 5] - v[i + 2]
        const bx = v[i + 6] - v[i], by = v[i + 7] - v[i + 1], bz = v[i + 8] - v[i + 2]
        const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx
        if (Math.hypot(cx, cy, cz) < 1e-12) n++
    }
    return n
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

    // The shared core check: v/c/uv/uv2 lengths and index integrity.
    const dbg = _M.debugArrays(g, factoryName)
    errors.push(...dbg.errors)

    if (!g.index && g.v.length % 9 !== 0) {
        errors.push(`non-indexed geometry must be whole triangles: v.length=${g.v.length} is not a multiple of 9`)
    }

    for (const [label, arr] of [['v', g.v], ['uv', g.uv], ['c', g.c], ['vCollide', g.vCollide]]) {
        if (!Array.isArray(arr)) continue
        const bad = NUM(label, arr)
        if (bad.length) errors.push(`non-finite values: ${bad.join(', ')}`)
    }

    if (Array.isArray(g.uv)) {
        const out = []
        for (let i = 0; i < g.uv.length; i++) {
            if ((g.uv[i] < 0 || g.uv[i] > 1) && out.length < 5) out.push(`uv[${i}]=${g.uv[i]}`)
        }
        if (out.length) errors.push(`uv outside [0,1] — will sample the wrong atlas tile: ${out.join(', ')}`)
    }

    if (Array.isArray(g.c)) {
        const out = []
        for (let i = 0; i < g.c.length; i++) {
            if ((g.c[i] < 0 || g.c[i] > 1) && out.length < 5) out.push(`c[${i}]=${g.c[i]}`)
        }
        if (out.length) errors.push(`vertex colors outside [0,1]: ${out.join(', ')}`)
    }

    if (Array.isArray(g.vCollide) && g.vCollide.length % 9 !== 0) {
        errors.push(`vCollide must be whole triangles: length=${g.vCollide.length} is not a multiple of 9`)
    }

    const deg = degenerateTriangles(g.v)
    if (deg > 0) warnings.push(`${deg} degenerate (zero-area) triangle(s) — normals there will be NaN`)

    const b = bbox(g.v)
    for (const [dim, axis] of [['w', 0], ['h', 1], ['d', 2]]) {
        if (typeof g[dim] === 'number' && Math.abs(b.size[axis] - g[dim]) > 1e-6) {
            warnings.push(`declared ${dim}=${g[dim]} but bbox extent on that axis is ${b.size[axis].toFixed(4)}`)
        }
    }

    return { errors, warnings, bbox: b, verts: g.v.length / 3, tris: g.v.length / 9 }
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
    console.log(`  ${firstOk.verts} verts / ${firstOk.tris} tris   bbox size [${b.size.map(n => n.toFixed(2)).join(', ')}]`)
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

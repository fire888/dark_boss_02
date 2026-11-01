import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { pathToFileURL } from 'node:url'
import { _GM } from '_CORE/_M/_gm'
import * as ATLAS from 'atlases/atlas00/atlas00'
import * as ATLAS_AO from 'atlases/atlasAo00/atlasAo00'

// Validates geometry factories by actually running them and inspecting the
// number arrays they return. Geometry modules are pure and serializable
// (they are meant to run inside a Web Worker), so they load and execute fine in Node.
//
// Indexed geometry only (src/geometry, reference — 07_stairs00): all six arrays
// { index, v, uv, uv2, c, vCollide } are required, triangles come from `index`,
// every uv/uv2 triangle must sit inside one atlas region, vertices must not be
// shared between non-coplanar triangles.
//
// Each module runs twice over: with default options and with its `randomOpts()` —
// the option ranges the module is used with. A module without `randomOpts` fails.

const usage = `Usage:
  npm run check:geom -- <path> [exportName] [--runs=N] [--args='[...]' | --args=@file.json]

  <path>         a module, e.g. src/geometry/07_stairs00/stairs00.ts,
                 or a folder: every NN_name/name.ts under it is checked, e.g. src/geometry
  [exportName]   factory to call (module only); omitted = the export named like the file
  --runs=N       calls per mode (default 20; factories use Math.random)
  --args='[...]' JSON array of arguments instead of defaults + randomOpts, e.g. --args='[{"r": 4}]' —
                 bash only: PowerShell and cmd strip the inner quotes on the way to node
  --args=@file   the same JSON array read from a file — works in any shell
`

// inline JSON or @path to a JSON file
const parseArgs = (s) => {
    const text = s.startsWith('@') ? fs.readFileSync(s.slice(1), 'utf8') : s
    try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) return parsed
        console.error(`--args must be a JSON array, got: ${text}`)
    } catch (e) {
        console.error(`--args is not valid JSON (${e.message}): ${text}`)
        console.error('In PowerShell/cmd pass the arguments as a file: --args=@file.json')
    }
    process.exit(2)
}

const positional = []
let runs = 20
let args = null

for (const a of process.argv.slice(2)) {
    if (a.startsWith('--runs=')) runs = Number(a.slice(7))
    else if (a.startsWith('--args=')) args = parseArgs(a.slice(7))
    else positional.push(a)
}
// zero runs would print PASS without calling the factory
if (!Number.isInteger(runs) || runs < 1) {
    console.error(`--runs must be a positive integer, got: ${runs}`)
    process.exit(2)
}

const [target, exportName] = positional
if (!target || !fs.existsSync(target)) {
    if (target) console.error(`not found: ${target}\n`)
    console.error(usage)
    process.exit(2)
}

// module of a folder NN_name is NN_name/name.ts
const moduleOf = (dir) => {
    const file = path.join(dir, path.basename(dir).replace(/^\d+_/, '') + '.ts')
    return fs.existsSync(file) ? file : null
}
const findModules = (dir) => {
    const own = moduleOf(dir)
    const nested = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .flatMap(e => findModules(path.join(dir, e.name)))
    return own ? [own, ...nested] : nested
}

const isDir = fs.statSync(target).isDirectory()
const modules = isDir ? findModules(target).sort() : [target]
if (isDir && exportName) {
    console.error('exportName works with a single module only')
    process.exit(2)
}
if (!modules.length) {
    console.error(`no NN_name/name.ts modules under ${target}`)
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

const checkOnce = (g) => {
    const errors = []
    const warnings = []

    if (!g || typeof g !== 'object') return { errors: ['factory did not return an object'], warnings }
    if (!Array.isArray(g.v)) return { errors: [`result has no \`v\` array; keys: ${JSON.stringify(Object.keys(g))}`], warnings }
    if (g.v.length === 0) errors.push('`v` is empty — factory produced no geometry')

    const missing = ['index', 'uv', 'uv2', 'c', 'vCollide'].filter(k => !Array.isArray(g[k]))
    if (missing.length) {
        return { errors: [`geometry must return { index, v, uv, uv2, c, vCollide }; missing: ${missing.join(', ')}`], warnings }
    }
    if (g.index.length % 3 !== 0) errors.push(`index.length=${g.index.length} is not a multiple of 3`)

    // The shared core check: v/c/uv/uv2 lengths and index integrity.
    const dbg = _GM.debugArrays(g)
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

    // faces must not be welded to each other: a vertex shared by non-coplanar
    // triangles holds one uv/uv2/c for both faces (wrong tile, AO and baked light
    // on one of them) and gets a smoothed normal from computeVertexNormals()
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
    if (welded) errors.push(`${welded} vertex use(s) shared between non-coplanar triangles — faces are welded, one face gets the other's uv/uv2/c`)

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

    return { errors, warnings, bbox: bbox(g.v), verts: g.v.length / 3, tris: tris.length, collideTris }
}

// first failing arguments are saved so the failure can be replayed in any shell
const saveArgs = (modulePath, a) => {
    const file = path.join(os.tmpdir(), `checkGeom-${path.basename(modulePath, '.ts')}.json`)
    fs.writeFileSync(file, JSON.stringify(a))
    return file
}

// one mode: `runs` calls with arguments from makeArgs(); returns whether any run failed
const runMode = (modulePath, label, factory, makeArgs) => {
    const seen = new Map()
    let firstOk = null
    let firstBadArgs = null
    let failed = 0

    const silence = console.log
    console.log = () => {}
    for (let run = 0; run < runs; run++) {
        let a = []
        let r
        try {
            a = makeArgs()
            r = checkOnce(factory(...a))
        } catch (e) {
            r = { errors: [`threw: ${e.message}`], warnings: [] }
        }
        if (r.errors.length) {
            failed++
            if (!firstBadArgs) firstBadArgs = a
        } else if (!firstOk) firstOk = r
        for (const m of r.errors) seen.set('ERROR  ' + m, (seen.get('ERROR  ' + m) || 0) + 1)
        for (const m of r.warnings) seen.set('WARN   ' + m, (seen.get('WARN   ' + m) || 0) + 1)
    }
    console.log = silence

    console.log(`  ${label} — ${runs} run(s)`)
    if (firstOk) {
        const b = firstOk.bbox
        console.log(`    ${firstOk.verts} verts / ${firstOk.tris} tris / ${firstOk.collideTris} collide tris   bbox size [${b.size.map(n => n.toFixed(2)).join(', ')}]`)
    }
    const errs = [...seen].filter(([m]) => m.startsWith('ERROR'))
    const warns = [...seen].filter(([m]) => m.startsWith('WARN'))
    for (const [m, n] of [...errs, ...warns]) {
        console.log(`    ${m}${n < runs ? `   (${n}/${runs} runs)` : ''}`)
    }
    if (errs.length) {
        console.log(`    FAIL — ${failed}/${runs} run(s) had errors`)
        if (firstBadArgs?.length) console.log(`    replay: --args=@${saveArgs(modulePath, firstBadArgs)}`)
    }
    return errs.length > 0
}

const checkModule = async (modulePath) => {
    const mod = await import(pathToFileURL(path.resolve(modulePath)).href)
    const factoryName = exportName ?? path.basename(modulePath, path.extname(modulePath))
    const factory = mod[factoryName]

    console.log(`${modulePath} :: ${factoryName}()`)
    if (typeof factory !== 'function') {
        console.log(`  ERROR  export "${factoryName}" is not a function. Exports: ${JSON.stringify(Object.keys(mod))}`)
        return true
    }
    if (args) return runMode(modulePath, '--args', factory, () => args)

    let bad = runMode(modulePath, 'default options', factory, () => [])
    if (typeof mod.randomOpts !== 'function') {
        console.log('  ERROR  no `randomOpts` export — the option ranges the module is used with are not checked')
        return true
    }
    bad = runMode(modulePath, 'randomOpts()', factory, () => [mod.randomOpts()]) || bad
    return bad
}

let failedModules = 0
for (const m of modules) {
    if (await checkModule(m)) failedModules++
}

if (modules.length > 1) console.log(`\n${modules.length} module(s), ${failedModules} failed`)
if (failedModules) {
    console.log('FAIL')
    process.exit(1)
}
console.log('PASS')

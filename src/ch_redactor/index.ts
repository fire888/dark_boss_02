// Стенд параметрической геометрии src/geometry (роль и порядок работы — в CLAUDE.md, раздел «Стенд геометрии»).
// Слева от начала координат — одиночный пример фабрики и его vCollide, пересобираются по инпутам панели;
// справа — 20 вариантов из randomOpts(), склеенных в один меш, у каждого справа — его vCollide.

import { Ticker } from "_CORE/Ticker"
import { Keyboard } from "_CORE/Keyboard"
import { Phisics } from "_CORE/Phisics"
import { ControlsSystem } from "_CORE/controls/ControlsSystem"
import { DeviceData } from "_CORE/DeviceData"
import { Ui } from "_CORE"
import { AudioManager } from "_CORE/AudioManager"
import { Studio } from "_CORE"
import { StudioConf, ControlsConf } from "_CORE/types"
import * as THREE from 'three'
import { _GM, type IArraysGeom, type IBuffersGeom } from '_CORE/_M/_gm'
import { _H } from '_CORE/_M/_helpers'

import { Core } from '_CORE/types'
import { Debug } from "_CORE/Debug"

import { GEOM_REGISTRY, type T_GeomEntry, type T_Opts } from "./registry"
import { OptsPanel } from "./OptsPanel"
import atlas00Img from 'atlases/atlas00/512.jpg'
import atlasAo00Img from 'atlases/atlasAo00/512Ao.jpg'


export interface Root extends Core {
    //controls: ControlsSystem,
    //debug: Debug
}

const studioConf: StudioConf = {
    cameraPos: new THREE.Vector3(0, 30, 35),
    cameraLookAt: new THREE.Vector3(0, 0, 0),
}


window.addEventListener("DOMContentLoaded", async () => {
    // @ts-ignore:next-line
    console.log("branch:" + __GIT_CURRENT_BRANCH__ + ' commit:' + __HASH_COMMIT__)

    const root: Root = {
        assets: {},
        ticker: new Ticker(),
        keyboard: new Keyboard(),
        ui: new Ui(),
        audio: new AudioManager(),
        studioConf,
        studio: new Studio(),

        controls: new ControlsSystem(),

        deviceData: new DeviceData(),
        phisics: new Phisics(),

        audioConf: {
            stepsSpeed: 1
        },
        //debug: new Debug()
    }

    init(root)
})

async function init(root: Root) {
    console.log('Root')

        const {
        studio, controls, ui, ticker,
        phisics,
        audio,
    } = root

    ticker.start()

    ticker.on((t: number) => {})

    studio.init(root)
    ticker.on(studio.render.bind(studio))

    // studio.setFogNearFar(0, .1)
    studio.addAxisHelper()

    phisics.init(root)
    ticker.on(phisics.update.bind(phisics))
    phisics.createPlayer()
    phisics.setPlayerPosition(studio.camera.position.x, studio.camera.position.y, studio.camera.position.z)

    ui.init(root)

    controls.init(root, true)
    //controls.setRotation(0, Math.PI * .25, 0)
    ticker.on(controls.update.bind(controls))

    audio.init(root)
    ticker.on(audio.update.bind(audio))
    audio.playAmbient()


    const textureLoader = new THREE.TextureLoader()

    const mapAtlas = textureLoader.load(atlas00Img)
    mapAtlas.colorSpace = THREE.SRGBColorSpace
    const mapAo = textureLoader.load(atlasAo00Img)
    // aoMap читает uv2 геометрии: в three 0.173 это канал 2
    mapAo.channel = 2

    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        //wireframe: true
        vertexColors: true,
        map: mapAtlas,
        aoMap: mapAo,
        aoMapIntensity: 1,
    })
    const materialCollide = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

    // зазор между геометрией и её прокси, между ячейками и от начала координат
    const GAP = 3

    const removeMesh = (m: THREE.Mesh | null) => {
        if (!m) return
        studio.remove(m)
        m.geometry.dispose()
    }

    // ---- одиночный пример: старый меш удаляется, новый создаётся при каждой правке опций

    let single: THREE.Mesh | null = null
    let singleCollide: THREE.Mesh | null = null
    let refPlane: THREE.Mesh | null = null
    let refEntry: T_GeomEntry | null = null
    // панель создаётся последней, после сборщиков, которые она вызывает
    let panel: OptsPanel | null = null

    const buildSingle = (entry: T_GeomEntry, opts: T_Opts) => {
        let g: IBuffersGeom
        try {
            g = entry.factory(opts)
        } catch (err) {
            // старый пример остаётся на месте, чтобы было с чем сравнить
            panel?.setStats(`${entry.name}: ${(err as Error).message}`, true)
            console.error(err)
            return
        }

        removeMesh(single)
        removeMesh(singleCollide)

        single = _H.createMesh({ ...g, material })
        singleCollide = _H.createMesh({ v: g.vCollide, material: materialCollide })

        // прокси — левее начала координат, пример — левее прокси; поэтому pos фабрики по x не виден
        const bV = bounds(g.v)
        const bC = bounds(g.vCollide)
        singleCollide.position.x = -GAP - bC.max[0]
        single.position.x = singleCollide.position.x + bC.min[0] - GAP - bV.max[0]
        studio.add(single)
        studio.add(singleCollide)

        if (refEntry !== entry) {
            refEntry = entry
            if (refPlane) {
                removeMesh(refPlane)
                ;(refPlane.material as THREE.MeshBasicMaterial).map?.dispose()
                refPlane = null
            }
            if (entry.ref) {
                refPlane = new THREE.Mesh(
                    new THREE.PlaneGeometry(20, 14),
                    new THREE.MeshBasicMaterial({ map: textureLoader.load(entry.ref), side: 2 }),
                )
                studio.add(refPlane)
            }
        }
        if (refPlane) {
            // референс — за примером, низом на земле
            refPlane.position.set(single.position.x + (bV.min[0] + bV.max[0]) / 2, 7, bV.min[2] - GAP)
        }

        panel?.setStats(
            `${entry.name}  v: ${g.v.length / 3}  tris: ${g.index.length / 3}  collide tris: ${g.vCollide.length / 9}`,
        )
    }

    // ---- 20 случайных вариантов сеткой: все склеены в один меш, все прокси — во второй

    let grid: THREE.Mesh | null = null
    let gridCollide: THREE.Mesh | null = null

    const buildGrid = (entry: T_GeomEntry) => {
        const COUNT = 20
        const COLS = 4

        const items: IBuffersGeom[] = []
        for (let i = 0; i < COUNT; ++i) {
            try {
                items.push(entry.factory(entry.randomOpts()))
            } catch (err) {
                console.error(`${entry.name} randomOpts #${i}:`, err)
            }
        }

        // ячейка — по самому большому варианту
        let wV = 0
        let wC = 0
        let d = 0
        const bs = items.map(g => {
            const bV = bounds(g.v)
            const bC = bounds(g.vCollide)
            wV = Math.max(wV, bV.max[0] - bV.min[0])
            wC = Math.max(wC, bC.max[0] - bC.min[0])
            d = Math.max(d, bV.max[2] - bV.min[2], bC.max[2] - bC.min[2])
            return { bV, bC }
        })
        const CELL_W = wV + wC + GAP * 2
        const CELL_D = d + GAP

        const all: IArraysGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }
        items.forEach((g, i) => {
            const { bV, bC } = bs[i]
            const x = GAP + (i % COLS) * CELL_W
            const z = Math.floor(i / COLS) * CELL_D
            _GM.translateVertices(g.v, x - bV.min[0], 0, z - bV.min[2])
            // прокси справа от своего варианта
            _GM.translateVertices(g.vCollide, x + wV + GAP - bC.min[0], 0, z - bV.min[2])
            _GM.mergeIndexedArrays(all, g)
        })

        removeMesh(grid)
        removeMesh(gridCollide)
        grid = _H.createMesh({ ...all, material })
        studio.add(grid)
        // прокси — triangle soup без index
        gridCollide = _H.createMesh({ v: all.vCollide ?? [], material: materialCollide })
        studio.add(gridCollide)
    }

    panel = new OptsPanel(GEOM_REGISTRY, {
        onChange: buildSingle,
        onReroll: buildGrid,
    })
    panel.setEntry(GEOM_REGISTRY[0])
}

// габариты triangle soup или вершин индексной геометрии
const bounds = (v: number[]) => {
    if (!v.length) return { min: [0, 0, 0], max: [0, 0, 0] }
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < v.length; i += 3) {
        for (let k = 0; k < 3; ++k) {
            min[k] = Math.min(min[k], v[i + k])
            max[k] = Math.max(max[k], v[i + k])
        }
    }
    return { min, max }
}

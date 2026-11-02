// Стенд параметрической геометрии src/geometry (роль и порядок работы — в CLAUDE.md, раздел «Стенд геометрии»).
// Слева от начала координат — одиночный пример фабрики и его vCollide, пересобираются по инпутам панели;
// справа — 20 вариантов из randomOpts(), склеенных в один меш, у каждого справа — его vCollide.
// Под примером и под сеткой — скрытые тела физики из vCollide, совмещённые с видимой геометрией, и пол:
// в режиме walk по ним ходит игрок (как в chapter10), orbit — свободная камера.

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
import { update as updateTweens } from '@tweenjs/tween.js'
import { _GM, type IArraysGeom, type IBuffersGeom } from '_CORE/_M/_gm'
import { _H } from '_CORE/_M/_helpers'
import { createArrow } from 'geometryCustom/arrow/arrow'

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

    // твины: на них ControlsSystem разгоняет скорость ходьбы — без update клавиши не двигают игрока
    ticker.on(() => updateTweens())

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
    // чёткие пиксели; без мипмапов соседние тайлы атласа не подмешиваются вдали
    mapAtlas.magFilter = THREE.NearestFilter
    mapAtlas.minFilter = THREE.NearestFilter
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

    // ---- скрытая физика: vCollide в позиции видимой геометрии. Имя тела уникально —
    // Phisics удаляет тела по имени отложенно, в update, и новое тело с тем же именем ушло бы вместе со старым

    let collisionN = 0
    const replaceCollision = (prevName: string | null, v: number[], pos: THREE.Vector3): string | null => {
        if (prevName) phisics.removeMeshFromCollision(prevName)
        if (!v.length) return null
        const m = _H.createMesh({ v, material: materialCollide })
        m.name = `collide|${collisionN++}`
        m.position.copy(pos)
        phisics.addMeshToCollision(m)
        // Trimesh скопировал вершины, меш в сцену не идёт
        m.geometry.dispose()
        return m.name
    }

    // ---- пол: видимая плоскость чуть ниже нуля, чтобы не мерцать с низом геометрии, физика — на нуле

    const FLOOR_SIZE = 400
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x2a2a33 }),
    )
    floor.position.y = -.01
    studio.add(floor)
    const floorGrid = new THREE.GridHelper(FLOOR_SIZE, FLOOR_SIZE / 2, 0x555566, 0x3a3a44)
    floorGrid.position.y = -.005
    studio.add(floorGrid)
    const S = FLOOR_SIZE / 2
    replaceCollision(null, [-S, 0, -S, -S, 0, S, S, 0, S, -S, 0, -S, S, 0, S, S, 0, -S], new THREE.Vector3())

    // ---- одиночный пример: старый меш удаляется, новый создаётся при каждой правке опций

    let single: THREE.Mesh | null = null
    let singleCollide: THREE.Mesh | null = null
    let singleCollision: string | null = null
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

        // пример стоит в начале координат и не сдвигается, прокси — справа от него
        const bV = bounds(g.v)
        const bC = bounds(g.vCollide)
        singleCollide.position.x = bV.max[0] + GAP - bC.min[0]
        studio.add(single)
        studio.add(singleCollide)
        singleCollision = replaceCollision(singleCollision, g.vCollide, single.position)

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
            // референс — слева от примера (позади — сетка вариантов), низом на земле
            refPlane.position.set(bV.min[0] - GAP - 10, 7, (bV.min[2] + bV.max[2]) / 2)
        }

        panel?.setStats(
            `${entry.name}  v: ${g.v.length / 3}  tris: ${g.index.length / 3}  collide tris: ${g.vCollide.length / 9}`,
        )
    }

    // ---- 20 случайных вариантов сеткой позади примера (в −z, камера смотрит из +z), по центру по x:
    // все склеены в один меш, все прокси — во второй

    let grid: THREE.Mesh | null = null
    let gridCollide: THREE.Mesh | null = null
    let gridCollision: string | null = null

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
        // тела физики — vCollide на месте видимого варианта, а не видимого прокси
        const physics: number[] = []
        // пример строится отдельно и может уходить в −z: отступ от нуля — с запасом на глубину варианта
        const X0 = -COLS * CELL_W / 2
        const Z0 = -GAP - d
        items.forEach((g, i) => {
            const { bV, bC } = bs[i]
            const x = X0 + (i % COLS) * CELL_W
            // передний край ячейки (max z) на Z0, ряды уходят назад
            const z = Z0 - Math.floor(i / COLS) * CELL_D
            _GM.translateVertices(g.v, x - bV.min[0], 0, z - bV.max[2])
            const phys = g.vCollide.slice()
            _GM.translateVertices(phys, x - bV.min[0], 0, z - bV.max[2])
            for (let k = 0; k < phys.length; ++k) physics.push(phys[k])
            // прокси справа от своего варианта
            _GM.translateVertices(g.vCollide, x + wV + GAP - bC.min[0], 0, z - bV.max[2])
            _GM.mergeIndexedArrays(all, g)
        })

        removeMesh(grid)
        removeMesh(gridCollide)
        grid = _H.createMesh({ ...all, material })
        studio.add(grid)
        // прокси — triangle soup без index
        gridCollide = _H.createMesh({ v: all.vCollide ?? [], material: materialCollide })
        studio.add(gridCollide)
        gridCollision = replaceCollision(gridCollision, physics, new THREE.Vector3())
    }

    // ---- orbit / walk. Игрок ставится под камеру — на то, что под ней видно, — и смотрит туда же, куда она

    const PLAYER_LIFT = 1
    const spawn = new THREE.Vector3(0, PLAYER_LIFT, 0)
    const raycaster = new THREE.Raycaster()
    const placePlayer = () => {
        const cam = studio.camera.position
        raycaster.set(cam, new THREE.Vector3(0, -1, 0))
        const hit = raycaster.intersectObjects([floor, single, grid].filter((m): m is THREE.Mesh => !!m), false)[0]
        spawn.set(cam.x, (hit ? hit.point.y : 0) + PLAYER_LIFT, cam.z)
        phisics.setPlayerPosition(spawn.x, spawn.y, spawn.z)
        phisics.playerBody.velocity.set(0, 0, 0)
    }
    // упал за край пола — обратно в точку входа
    ticker.on(() => {
        if (phisics.playerBody.position.y < -20) {
            phisics.setPlayerPosition(spawn.x, spawn.y, spawn.z)
            phisics.playerBody.velocity.set(0, 0, 0)
        }
    })

    // ---- маркер игрока для orbit: сфера размером с тело, столб сквозь геометрию, стрелка — куда смотрел.
    // В walk скрыт: камера внутри сферы

    const POLE_H = 30
    const markerColor = 0xff3366
    const marker = new THREE.Group()
    marker.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 8), new THREE.MeshBasicMaterial({ color: markerColor })))
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(.05, .05, POLE_H, 6).translate(0, POLE_H / 2, 0),
        new THREE.MeshBasicMaterial({ color: markerColor, depthTest: false, transparent: true, opacity: .6 }),
    )
    pole.renderOrder = 1
    marker.add(pole)
    const heading = _H.createMesh({
        v: createArrow(2, .8).v,
        material: new THREE.MeshBasicMaterial({ color: markerColor, side: THREE.DoubleSide, depthTest: false }),
    })
    heading.renderOrder = 1
    marker.add(heading)
    studio.add(marker)

    const camDir = new THREE.Vector3()
    ticker.on(() => {
        const { position } = phisics.playerBody
        marker.position.set(position.x, position.y, position.z)
        marker.visible = controls.isOrbit
        if (!controls.isOrbit) {
            studio.camera.getWorldDirection(camDir)
            marker.rotation.y = Math.atan2(camDir.x, camDir.z)
        }
    })

    const modeButtons =Array.from(document.querySelectorAll<HTMLButtonElement>('.mode-switch button'))
    let isOrbitShown: boolean | null = null
    const syncModeButtons = () => {
        // режим меняют и кнопки, и клавиша O, и Esc из pointerLock — сверяемся каждый кадр
        if (isOrbitShown === controls.isOrbit) return
        isOrbitShown = controls.isOrbit
        modeButtons.forEach(b => b.classList.toggle('active', (b.dataset.mode === 'orbit') === isOrbitShown))
    }
    modeButtons.forEach(b => b.addEventListener('click', () => {
        // фокус с кнопки снимается: иначе пробел (прыжок) нажал бы её снова
        b.blur()
        if (b.dataset.mode === 'orbit') {
            controls.enableOrbit()
        } else {
            if (controls.isOrbit) placePlayer()
            controls.enableWalk()
        }
    }))
    ticker.on(syncModeButtons)

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

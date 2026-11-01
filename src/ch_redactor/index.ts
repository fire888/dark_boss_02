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
import { _GM, type IArraysGeom } from '_CORE/_M/_gm'
import { _H } from '_CORE/_M/_helpers'

import { Core } from '_CORE/types'
import { Debug } from "_CORE/Debug"

import { stairs00, randomOpts as stairs00RandomOpts } from "geometry/07_stairs00/stairs00"
import tx from 'geometry/07_stairs00/ref.jpg'
import atlas00Img from 'atlases/atlas00/512.jpg'
import atlasAo00Img from 'atlases/atlasAo00/512Ao.jpg'


export interface Root extends Core {
    //controls: ControlsSystem,
    //debug: Debug
}

const studioConf: StudioConf = {
    cameraPos: new THREE.Vector3(0, 15, 15),
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


    const textureLoader = new THREE.TextureLoader();
    const p = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 14),
        new THREE.MeshBasicMaterial({
            map: textureLoader.load(tx),
            side: 2,

        })
    )
    p.position.set(0, 0, -10)
    studio.add(p)


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

    // 20 крылец со случайными параметрами (randomOpts модуля) сеткой; справа от каждого — его vCollide
    const COUNT = 20
    const COLS = 4
    // верхняя граница r в randomOpts
    const R_MAX = 8
    // ячейка: крыльцо (2r) + прокси (2r) + зазоры
    const CELL_W = R_MAX * 4 + 6
    const CELL_D = R_MAX + 6

    // все крыльца склеиваются в один меш, все прокси — во второй
    const all: IArraysGeom = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }

    for (let i = 0; i < COUNT; ++i) {
        const s = stairs00(stairs00RandomOpts())

        const x = (i % COLS) * CELL_W
        const z = Math.floor(i / COLS) * CELL_D

        _GM.translateVertices(s.v, x, 0, z)
        // прокси справа от своего крыльца
        _GM.translateVertices(s.vCollide, x + R_MAX * 2 + 2, 0, z)
        _GM.mergeIndexedArrays(all, s)
    }

    const m = _H.createMesh({ ...all, material })
    studio.add(m)

    // прокси — triangle soup без index
    const mCollide = _H.createMesh({ v: all.vCollide ?? [], material: materialCollide })
    studio.add(mCollide)
}




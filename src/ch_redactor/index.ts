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
import { _M } from '_CORE/_M/_m'

import { Core } from '_CORE/types'
import { Debug } from "_CORE/Debug"

import { stairs00 } from "geometry/07_stairs00/stairs00/stairs00" 
import tx from 'geometry/07_stairs00/stairs00/ref.jpg'


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


    const s = stairs00()
    const m = _M.createMesh(s)
    root.studio.add(m)


}




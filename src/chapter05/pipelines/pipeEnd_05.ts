import { Root } from "../index"
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'
import * as THREE from 'three'
import { pause } from "_CORE/helpers/htmlHelpers"

export const pipeEnd_05 = async (root: Root) => {
    const {
        CONSTANTS,
        studio,
        controls,
        ui,
        phisics,
        lab,
        ticker,
    } = root

        const cam = studio.camera
    const qSave = new THREE.Quaternion().copy(cam.quaternion)
    const v = new THREE.Vector3().copy(cam.position).add(new THREE.Vector3(0, 100, 0))
    cam.lookAt(v)
    const qN = new THREE.Quaternion().copy(cam.quaternion)
    cam.quaternion.copy(qSave)

    const fov = studio.camera.fov
    const int = studio.dirLight.intensity
    root.controls.disable()

    const obj = { v: 0 }
    new Tween(obj)
        .interpolation(Interpolation.Linear)
        .easing(Easing.Quadratic.InOut)
        .to({ v: 1 }, 5000)
        .onUpdate(() => {
            studio.setSaturation(obj.v * 15)
            studio.dirLight.intensity = int + obj.v * 100

            studio.camera.fov = fov + Math.sin((obj.v) * Math.PI * 3) * (fov - 5)
            studio.camera.updateProjectionMatrix()
            cam.quaternion.slerpQuaternions(qSave, qN, obj.v)
        })
        .onComplete(() => {})
        .start() 
        
    await pause(5000)

    let t = 0
    ticker.on((dt) => {
        t += dt
        studio.setSaturation(15 + Math.sin(t * .001))
    })


    await ui.showFinalPage()
}

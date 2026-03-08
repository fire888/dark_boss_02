import { Root } from "../index"
import * as THREE from "three"
import * as TWEEN from '@tweenjs/tween.js'

export const pipeEnd_07 = async (root: Root) => {
    const { studio, ticker, phisics, controls, ui } = root

    ui.toggleVisibleEnergy(false)
    
    const waitFall = () => {
        return new Promise<void>((resolve) => {
            const removerUpdater = ticker.on(() => {
                if (studio.camera.position.y < -35) {
                    removerUpdater()
                    resolve()
                }
            })
        })
    } 

    await waitFall()

    studio.camera.position.set(0, 80, 0)
    phisics.setIsUpdate(false)
    controls.disable()
    ui.showFinalPage()

    // @ts-ignore
    const currentBackColor = root.studio.scene.background.clone()
    const targetColor = new THREE.Color(0x000000)
    const obj = { v: 0}
    new TWEEN.Tween(obj)
        .easing(TWEEN.Easing.Quadratic.In)
        .to({ v: 1 }, 2000)
        .onUpdate(() => {
            // @ts-ignore
            studio.fog.color.lerpColors(currentBackColor, targetColor, obj.v)
            // @ts-ignore
            studio.scene.background.lerpColors(currentBackColor, targetColor, obj.v)
        })
    .start()

    console.log('##@@#@ COMPLETE!!!')
}

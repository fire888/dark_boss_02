import { Root } from '../index'
import * as THREE from 'three'
import { STRUCTURES } from '../Structure03/constants/constants_elements'
import { pause } from '_CORE/helpers/htmlHelpers'
import { W, H } from '../Structure03/constants/constants_elements'
import { SCALE } from '../Structure03/constants/const_structures'
import * as TWEEN from '@tweenjs/tween.js'

const D = 300

const waiterPlayerFindFlyerFlyOut = async (root: Root) => {
    const { ticker, studio, lab, fuel, flyer, ui, phisics, controls } = root

    const posTriggerFlyer = new THREE.Vector3() 
    flyer.objectForCheck.getWorldPosition(posTriggerFlyer)

    // ОЖИДАЕМ КОГДА ПОЛЬЗОВАТЕЛЬ НАЙДЕТ ПЛАТФОРМУ
    const waitNear = () => {
        return new Promise<void>((resolve) => {
            const removerUpdater = ticker.on(() => {
                if (studio.camera.position.distanceTo(posTriggerFlyer) < .7) {
                    removerUpdater()
                    resolve()
                }
            })
        })
    }

    await waitNear()

    phisics.setIsUpdate(false)
    controls.disableMove()

    const savedCamPos = studio.camera.position.clone()

    // АНИМИРУЕМ УЛЕТ ПЛАТФОРМЫ
    const waiterFlyer = async () => {
        return new Promise<void>(res => {
            const obj = { v: 0}
            new TWEEN.Tween(obj)
                .easing(TWEEN.Easing.Quadratic.In)
                .to({ v: 1 }, 8000)
                .onUpdate(() => {
                    flyer.mesh.position.z = obj.v * -D
                    studio.camera.position.z = obj.v * -D + savedCamPos.z
                    ui.setEnergyLevel(1 - (obj.v * .5))
                })
                .onComplete(() => {
                    res()
                })
                .start()

            // АНИМИРУЕМ ТУМАН
            setTimeout(() => {
                // @ts-ignore
                const currentBackColor = root.studio.scene.background.clone()
                const currentFogColor = root.studio.fog.color.clone() 
                const obj = { v: 0}
                new TWEEN.Tween(obj)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .to({ v: 1 }, 2000)
                    .onUpdate(() => {
                        // @ts-ignore
                        studio.fog.color.lerpColors(currentFogColor, currentBackColor, obj.v)
                    })
                .start()
            }, 3000)    
        })
    }

    await waiterFlyer()
}


const waiterPlayerFindFlyerFlyTo = async (root: Root) => {
    const { ticker, studio, lab, fuel, flyer, ui, phisics, controls } = root

    const camPos = studio.camera.position.clone()
    camPos.z += D

    const waiterFlyer = async () => {
        return new Promise<void>(res => {
            const obj = { v: 0}
            new TWEEN.Tween(obj)
                .interpolation(TWEEN.Interpolation.Linear)
                .to({ v: 1 }, 5000)
                .onUpdate(() => {
                    flyer.mesh.position.z = (1 - obj.v) * D
                    studio.camera.position.z = (1 -obj.v) * D + camPos.z
                    ui.setEnergyLevel(.5 - (obj.v * .5))
                })
                .onComplete(() => {
                    res()
                })
                .start()
        })
    }

    await waiterFlyer()

    controls.enableMove()
    phisics.setIsUpdate(true)
}


const findFuelIteration = async (root: Root, structureIndex: number) => {
    const { ticker, studio, lab, fuel, ui } = root

    lab.destroyStructure()

    const dataS = STRUCTURES[structureIndex]
    await lab.generateStructure(dataS)
    const coordsFuel = lab.getCoordsForItem('fuel')

    if (coordsFuel) {
        // @ts-ignore
        fuel.mesh.position.set(
            // @ts-ignore
            ((coordsFuel[0]) * W + dataS.X) * SCALE,
            // @ts-ignore 
            ((coordsFuel[1] + .5) * H + dataS.Y) * SCALE,
            // @ts-ignore 
            ((coordsFuel[2]) * W + dataS.Z) * SCALE
        )
    }
    
    const { color, near, far } = dataS.FOG
    root.studio.fog.color.setHex(color)
    root.studio.fog.near = near * SCALE
    root.studio.fog.far = far * SCALE

    root.studio.setSceneBackground(dataS.ENV_COLOR.toArray())

    await waiterPlayerFindFlyerFlyTo(root)

    // const waiter = () => {
    //     return new Promise<void>((resolve) => {
    //         const removerUpdater = ticker.on(() => {
    //             if (studio.camera.position.distanceTo(fuel.mesh.position) < .7) {
    //                 removerUpdater()
    //                 resolve()
    //             }
    //         })
    //     })
    // }

    //await waiter()

    await pause(2000)

    ui.setEnergyLevel(1)

    fuel.mesh.position.x = -10000
    
    await waiterPlayerFindFlyerFlyOut(root)

    await pause(1000)
} 



export const pipePlay_07 = async (root: Root) => {
    console.log('[MESSAGE:] START PLAY')
    const { studio, lab, ticker, phisics, fuel } = root

    // return player if fall
    ticker.on(() => {
        if (studio.camera.position.y < -40) {
            const startPoint = new THREE.Vector3(0, 25, 0)
            phisics.setPlayerPosition(...startPoint.toArray())
            studio.camera.rotation.y = Math.PI * 1.5
        }
    })

    // first walking    
    await waiterPlayerFindFlyerFlyOut(root)

    // waiter iterator structures
    const waiterStructures = () => {
        return new Promise<void>((resolve) => {
            let newIndexStruct = 1
            
            const iterateStructure = async () => {
                ++newIndexStruct
                if (STRUCTURES[newIndexStruct]) {
                    await findFuelIteration(root, newIndexStruct) 
                    iterateStructure()
                } else {
                    resolve()
                }
            }

            iterateStructure()
        })
    }

    await waiterStructures()
}

import { Root } from '../index'
import * as THREE from 'three'
import { THEMES } from 'chapter10/constants/CONSTANTS'
import { Tween, Easing } from '@tweenjs/tween.js'
import { STRUCTURES } from '../Structure03/constants/constants_elements'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipePlay_07 = async (root: Root) => {
    console.log('[MESSAGE:] START PLAY')
    const { studio, lab, ticker, phisics } = root

    ticker.on(() => {
        if (studio.camera.position.y < -10) {
            const startPoint = new THREE.Vector3(0, 15, 0)
            phisics.setPlayerPosition(...startPoint.toArray())
            studio.camera.rotation.y = Math.PI * 1.5
        }
    })

    const waiterStructures = () => {
        return new Promise<void>((resolve) => {
            let currentIndexStructure = 0
            
            const iterateStructure = async (newIndex: number) => {
                currentIndexStructure = newIndex


                const dataS = STRUCTURES[currentIndexStructure]

                console.log('DATA', dataS)

                lab.destroyStructure()
                await lab.generateStructure(dataS)
                                
                const { color, near, far } = dataS.FOG
                root.studio.fog.color.setHex(color)
                root.studio.fog.near = near * 0.25
                root.studio.fog.far = far * 0.25

                root.studio.setSceneBackground(dataS.ENV_COLOR.toArray())
                

                currentIndexStructure = newIndex

                if (STRUCTURES[currentIndexStructure + 1]) {
                    setTimeout(() => {
                        iterateStructure(currentIndexStructure + 1)
                    }, 30000)
                } else {
                    resolve()
                }
            }

            iterateStructure(currentIndexStructure + 1)
        })
    }

    await pause(300000) 
    await waiterStructures()

    console.log('##@@#@ COMPLETE!!!')
    




}

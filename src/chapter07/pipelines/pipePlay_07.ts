import { Root } from '../index'
import * as THREE from 'three'
import { THEMES } from 'chapter10/constants/CONSTANTS'
import { Tween, Easing } from '@tweenjs/tween.js'
import { STRUCTURES } from '../Structure03/constants/constants_elements'
import { pause } from '_CORE/helpers/htmlHelpers'
import { W, H } from '../Structure03/constants/constants_elements'
import { SCALE } from '../Structure03/constants/const_structures'


const findFuelIteration = async (root: Root) => {
    const { ticker, studio, lab, fuel } = root

    const waiter = () => {
        return new Promise<void>((resolve) => {
            const removerUpdater = ticker.on(() => {
                if (studio.camera.position.distanceTo(fuel.mesh.position) < .7) {
                    removerUpdater()
                    resolve()
                }
            })
        })
    }

    await waiter()

    fuel.mesh.position.x = -10000

    await pause(1000)

} 



export const pipePlay_07 = async (root: Root) => {
    console.log('[MESSAGE:] START PLAY')
    const { studio, lab, ticker, phisics, fuel } = root

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

                lab.destroyStructure()
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
                root.studio.fog.near = near * 0.25
                root.studio.fog.far = far * 0.25

                root.studio.setSceneBackground(dataS.ENV_COLOR.toArray())
                
                currentIndexStructure = newIndex

                if (STRUCTURES[currentIndexStructure + 1]) {
                    await findFuelIteration(root) 
                    iterateStructure(currentIndexStructure + 1)
                } else {
                    resolve()
                }
            }

            iterateStructure(currentIndexStructure + 1)
        })
    }

    await pause(10000) 
    await waiterStructures()
}

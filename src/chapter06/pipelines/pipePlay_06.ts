import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'

const effectEnv = (root: Root, env: string) => {
    const { studio } = root

    return new Promise((resolve) => {
        if (env === 'envIron') {
            const obj = { v: 0 }
            const int = root.studioConf.spotLightParams.intensity
            new Tween(obj)
                .interpolation(Interpolation.Linear)
                .to({ v: 1 }, 1000)
                .onUpdate(() => {
                    studio.setSaturation(obj.v)
                    studio.spotLight.intensity = (1 - obj.v) * int
                })
                .onComplete(() => {
                    resolve(true)
                })
                .start()
        }

        if (env === 'envNormal') {
            const obj = { v: 0 }
            const int = root.studioConf.spotLightParams.intensity
            new Tween(obj)
                .interpolation(Interpolation.Linear)
                .to({ v: 1 }, 1000)
                .onUpdate(() => {
                    studio.setSaturation(1 - obj.v)
                    studio.spotLight.intensity = (obj.v) * int
                })
                .onComplete(() => {
                    resolve(true)
                })
                .start()
        }
    })
}

const environmentIterator = (root: Root) => {
    const {
        ticker, studio, lab, statue
    } = root

    return new Promise((resolve) => {
        let indexScenario = 0
        const SCENARIO = [
            { countRooms: 1, evnt: 'statue', timeStatue: 1000 },
            { countRooms: 2, evnt: 'statue', timeStatue: 3000 },
            { countRooms: 3, evnt: 'statue', timeStatue: 5000 },
            { countRooms: 4, evnt: 'statue', timeStatue: 7000 },
            { countRooms: 5, evnt: 'statue', timeStatue: 9000 },
            { countRooms: 5, evnt: 'envIron' },
            { countRooms: 5, evnt: 'envIron' },
            { countRooms: 2, evnt: 'envNormal' },
            { countRooms: 1, evnt: 'statue' },
            { countRooms: 5, evnt: 'envIron' },
            { countRooms: 2, evnt: 'envNormal' },
            { countRooms: 1, evnt: 'statue' },
        ]        

        let currentRoom: number = -1
        let countRooms = 0 
        const unsubscribe = ticker.on(() => {
            const indRoom = lab.checkArea(currentRoom, studio.camera.position.x, studio.camera.position.z)
            if (indRoom !== currentRoom) {
                currentRoom = indRoom
                ++countRooms
            }
            if (countRooms === SCENARIO[indexScenario].countRooms) {
                console.log(SCENARIO[indexScenario])
                ++countRooms

                if (!SCENARIO[indexScenario + 1]) {
                    unsubscribe()
                    resolve(true)
                    return
                }

                if (SCENARIO[indexScenario].evnt === 'envIron' || SCENARIO[indexScenario].evnt === 'envNormal') {
                    effectEnv(root, SCENARIO[indexScenario].evnt).then(() => {
                        countRooms = 0
                        ++indexScenario
                    })
                }
                if (SCENARIO[indexScenario].evnt === 'statue') {
                    const { x, z } = lab.getRandomPosInRoom(currentRoom)
                    statue.setPosition(x, z)
                    countRooms = 0
                    ++indexScenario
                    setTimeout(() => {
                        statue.hide()
                    }, SCENARIO[indexScenario].timeStatue)
                }
            }
        }) 
    })
}


export const pipePlay_06 = async (root: Root, currentIndexLevel = 0) => {
    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    
    const {
        phisics, ticker, ui, controls, studio, particles, lab,
        audio, materials,
    } = root

    await environmentIterator(root)
    console.log('[MESSAGE:] COMPLETE SCENARIO')

    await pause(100000000)
}

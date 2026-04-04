import { Root } from '../index'
import * as THREE from 'three'
import { pause } from '_CORE/helpers/htmlHelpers'
import { Tween, Easing, Interpolation } from '@tweenjs/tween.js'

const effectEnv = (root: Root, env: string) => {
    const { studio, statue } = root

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
                    statue.toWhite()
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
                    statue.toBlack()
                    resolve(true)
                })
                .start()
        }
    })
}

type ScenarioItem = {
    countRooms: number,
    evnt: string,
    time?: number,
}

const environmentIterator = (root: Root) => {
    const {
        ticker, studio, lab, statue
    } = root

    return new Promise((resolve) => {
        let indexScenario = 0
        const SCENARIO: ScenarioItem[] = [
            //{ countRooms: 1, evnt: 'envIron' },
            
            { countRooms: 7, evnt: 'envIron', time: 2000 },
            { countRooms: 3, evnt: 'envIron', time: 4000 },
            { countRooms: 3, evnt: 'statue', time: 2000 },
            { countRooms: 5, evnt: 'statue', time: 2000 },
            { countRooms: 7, evnt: 'envIron', time: 4000 },
            { countRooms: 3, evnt: 'statue',  time: 6000 },
            { countRooms: 3, evnt: 'envIron' },
            { countRooms: 1, evnt: 'statue', time: 10000 },
            { countRooms: 2, evnt: 'envNormal' },
            { countRooms: 3, evnt: 'statue', time: 5000 },
            { countRooms: 3, evnt: 'envIron' },
            { countRooms: 3, evnt: 'statue', time: 5000 },
            { countRooms: 3, evnt: 'statue', time: 5000 },
            { countRooms: 3, evnt: 'statue', time: 5000 },
            { countRooms: 3, evnt: 'statue', time: 5000 }
        ]        

        let currentRoom: number = -1
        let countRooms = 0
        let unsubscribe = () => {}
        
        const update = async () => {

            // обновляем счетчик смены комнат
            const indRoom = lab.checkArea(currentRoom, studio.camera.position.x, studio.camera.position.z)
            if (indRoom !== currentRoom && indRoom !== -1) {
                currentRoom = indRoom
                ++countRooms
            }

            // проверяем счетчик на соответствие конфигу
            if (countRooms !== SCENARIO[indexScenario].countRooms) { 
                return;
            }
            // проверка прошла счетчик делаем запредельным чтоб триггер больше не срабатывал
            countRooms = 1000 


            // выполняем нужное событие из конфига

            const { evnt, time } = SCENARIO[indexScenario]

            if (evnt === 'envIron' || evnt === 'envNormal') {
                await effectEnv(root, evnt)
                                    
                if (time !== undefined) {
                    await pause(time)
                    const keyInv = evnt === 'envIron' ? 'envNormal' : 'envIron'
                    await effectEnv(root, keyInv)
                }
            }
            if (evnt === 'statue') {
                const { x, z } = lab.getRandomPosInRoom(currentRoom)
                statue.setPosition(x, z)
                if (time) {
                    await pause(time)
                }
                statue.hide()
                await pause(1400)
            }

            // ждем следующегои триггера
            if (SCENARIO[indexScenario + 1]) {
                ++indexScenario
                countRooms = 0
                return;
            }

            // или если сценариев больше нет выходим
            unsubscribe()
            resolve(true)
        }

        unsubscribe = ticker.on(update) 
    })
}

export const pipePlay_06 = async (root: Root, currentIndexLevel = 0) => {

    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    await environmentIterator(root)
    console.log('[MESSAGE:] COMPLETE SCENARIO')

}

import { Root } from '../index'
import * as THREE from 'three'
import { THEMES } from 'chapter10/constants/CONSTANTS'
import { Tween, Easing } from '@tweenjs/tween.js'

export const pipelinePlay = async (root: Root, currentIndexLevel = 0) => {
    console.log('[MESSAGE:] START PLAY')

    const {
        studio, lab, ticker, phisics, materials
    } = root

    ticker.on(() => {
        if (studio.camera.position.y < lab.getCurrentStartPoint().y - 20) {
            const startPoint = lab.getCurrentStartPoint().clone().add(new THREE.Vector3(1, 2, 0))
            phisics.setPlayerPosition(...startPoint.toArray())
            studio.camera.rotation.y = Math.PI * 1.5
        }
    })


    // document.addEventListener('keydown', (event) => {
    //     if (event.code === 'KeyL') {
    //         const t = 3000

    //         const lightB = Math.random()
    //         const colorB = [Math.random() * lightB, Math.random() * lightB, Math.random() * lightB]
    //         studio.animateBackgroundTo(colorB, t)

    //         const lightF = Math.random()            
    //         const colorF = [Math.random() * lightF, Math.random() * lightF, Math.random() * lightF]
    //         const fogFar = 30 + Math.random() * 200
    //         studio.animateFogTo(fogFar, colorF, t)

    //         console.log(JSON.stringify({ colorB, colorF, fogFar }))

    //     }
    // })

    const themesKeys = Object.keys(THEMES)
    const makeRandomKeys = () => {
        const copyArr = [...themesKeys]
        const newArr = []
        while (copyArr.length) {
            const index = Math.floor(Math.random() * copyArr.length)
            newArr.push(copyArr[index])
            copyArr.splice(index, 1)
        }
        return newArr
    }

    let randomKeys = makeRandomKeys()

    const changeThemeIndex = (index: number) => {
        if (!randomKeys[index]) {
            index = 0
            randomKeys = makeRandomKeys()
        }
        const keyTheme = randomKeys[index]
        console.log('THEME:', keyTheme)
        // @ts-ignore
        const theme = THEMES[keyTheme]

        const { colorB, colorF, fogFar } = theme
        //const time = 120000
        const time = 60000
        
        studio.animateBackgroundTo(colorB, time)
        studio.animateFogTo(fogFar, colorF, time)

        const obj = { v: 0 }
        const prevAOIntensity = materials.materialLab.envMapIntensity
        const newAoMapIntensity = Math.random() * .5 + .7
        const prevDirLightIntensity = studio.dirLight.intensity
        const newDirLightIntensity = Math.random() * 3  + 2
        new Tween(obj)
            .easing(Easing.Linear.In)
            .to({ v: 1 }, time)
            .onUpdate(() => {
                materials.materialLab.envMapIntensity = (1 - obj.v) * prevAOIntensity + obj.v * newAoMapIntensity
                materials.materialLab.needsUpdate = true
                studio.dirLight.intensity = ((1 - obj.v) * prevDirLightIntensity) + obj.v * newDirLightIntensity
            })
            .start()

        setTimeout(() => {
            changeThemeIndex(index + 1)
        }, time + 50)
    }

    changeThemeIndex(0)


}

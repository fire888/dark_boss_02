import { Root } from '../index'
import * as THREE from 'three'
import { LEVELS, COLOR_FOG_PLAY } from '../constants/CONSTANTS'
import { pause } from '_CORE/helpers/htmlHelpers'

export const pipelinePlay = async (root: Root, currentIndexLevel = 0) => {
    console.log('[MESSAGE:] START PLAY LEVEL: ', currentIndexLevel)
    
    const {
        phisics,
        energySystem,
        antigravSystem,
        antigravLast,
        ticker,
        ui,
        controls,
        studio,
        particles,
        lab,
        audio,
        materials,
    } = root

    // antigrav activity **********************************/
    let isNormalGravity = true
    const camPos = new THREE.Vector2(root.studio.camera.position.x, root.studio.camera.position.z)
    
    let isEnabledAntigrav = true
    const unsubscribeAntgrav = ticker.on((t: number) => {
        if (!isEnabledAntigrav) {
            return
        }

        camPos.set(root.studio.camera.position.x, root.studio.camera.position.z)
        
        let isNear = false
        for (let i = 0; i < antigravSystem.pointsV2.length; ++i) {
            const p = antigravSystem.pointsV2[i]
            if (p.distanceTo(camPos) < 3) {
                isNear = true
                break
            }
        }

        if (isNear && isNormalGravity) {
            phisics.switchToAntiGravity()
            isNormalGravity = false
        } else if (!isNear && !isNormalGravity) {
            phisics.switchToGravity()
            isNormalGravity = true
        }
    })

    let nextStepResolve = () => {}

    const toNextLevel = async () => {
        ui.setColorDark(
            new THREE.Color().fromArray(LEVELS[currentIndexLevel].theme.sceneBackground).getHexString()
        )
        ui.toggleVisibleDark(true)
        studio.hideSSAO(300)
        setTimeout(() => {
            audio.stopFly()
            nextStepResolve()
        }, 300)
    }

    // [DEVEL]: key force change level
    const onKeyUp = (event: KeyboardEvent ) => {
        if (event.code === 'KeyL') {
            document.removeEventListener('keyup', onKeyUp)
            toNextLevel()
        }
    }
    document.addEventListener('keyup', onKeyUp)


    // energy get *******************************************/
    let isFullEnergy = false
    phisics.onCollision(energySystem.nameSpace, (name: string) => {
        audio.playEnergy()
        energySystem.animateMovieHide(name)
        setTimeout(() => phisics.removeMeshFromCollision(name), 50)
        
        if (isFullEnergy) {
             return
        }
        
        const percentageItemsGetted = energySystem.getPercentageItemsGetted()
        const { percentCompleteEnergy } = LEVELS[currentIndexLevel]
        const multipyPercentage = Math.min(1., percentageItemsGetted / percentCompleteEnergy)
        ui.setEnergyLevel(multipyPercentage)        
        
        if (multipyPercentage < 1) {
             return;
        }
        
        isFullEnergy = true
        antigravLast.activate()
        const p = antigravLast.getPosition()
        particles.startForcreMovieAntigrav(p)
        setTimeout(() => {
                audio.playDoor()
        }, 1000)



        // final fly
        phisics.onCollision(antigravLast.nameSpaceTrigger, (name: string) => {
            isEnabledAntigrav = false
            audio.playFly()
            antigravLast.removeStonesFromPhisics()
            phisics.removeMeshFromCollision(name)
            controls.disableMove()
            phisics.switchToGravityGorizontalBoost()
            ui.toggleVisibleEnergy(false)
            unsubscribeAntgrav()

            let isStarted = false 
            const unsubscribe = ticker.on(() => {
                if (studio.camera.position.z < 230) {
                    return;
                }
                if (isStarted) {
                    return
                }
                unsubscribe()
                isStarted = true
                toNextLevel()
            })
        })
    })

    const waitLevelComplete = () => new Promise((resolve) => {
        // @ts-ignore:next-line
        nextStepResolve = resolve
    })

    await waitLevelComplete()
    
    lab.clear()
    antigravSystem.destroy()
    antigravLast.destroy()
    energySystem.destroy()

    const currentIndexLevelNext = currentIndexLevel + 1
    
    if (LEVELS[currentIndexLevelNext] === undefined) {
        return
    }

    await pause(200)

    const levelData = LEVELS[currentIndexLevelNext]

    await lab.build(levelData)
    energySystem.init(root, lab.positionsEnergy)
    antigravSystem.init(root, lab.positionsAntigravs)
    antigravLast.init(root, new THREE.Vector3(
        levelData.positionTeleporter[0], 0, levelData.positionTeleporter[1]
    ))
    materials.changeWallMaterial(levelData.theme.materialWalls)
    materials.changeRoadMaterial(levelData.theme.materialRoad)
    materials.changeDesertMaterial(levelData.theme.materialGround)
    studio.setFogNearFar(.2, 1)
    ui.toggleVisibleDark(false)
    particles.startFlyPlayerAround()
    phisics.stopPlayerBody()
    ui.setEnergyLevel(0)
    phisics.switchToGravity()

    const startPos = [levelData.playerStartPosition[0], .7, levelData.playerStartPosition[1]]
    controls.setRotation(0, Math.PI, 0)
    await studio.cameraFlyToLevel(startPos)
    phisics.setPlayerPosition(startPos[0], startPos[1], startPos[2])
    studio.animateFogTo(levelData.fogFar, levelData.theme.fogColor, 4000)
    studio.animateBackgroundTo(levelData.theme.sceneBackground, 3000)
    studio.animateLightTo(levelData.theme.dirLightColor, levelData.theme.ambientLightColor, 3000)
    controls.enableMove()
    ui.toggleVisibleEnergy(true)
    
    await pipelinePlay(root, currentIndexLevelNext)
}

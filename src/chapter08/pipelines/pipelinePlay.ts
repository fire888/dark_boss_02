import { Root } from '../index'
import { pause } from '../entities/_helpers'

let indexLevel = 0

export const pipelinePlay = async (root: Root) => {
    const {
        CONSTANTS,
        studio,
        controls,
        ui,
        phisics,
        energySystem,
        lab,
        audio,
    } = root

    const { 
        LABS_CONF,
        PLAYER_START_POS,
        ENERGY_PERCENTAGE_MUST_GET,
    } = CONSTANTS

    // energy get *******************************************/
    let isFullEnergy = false
    phisics.onCollision(energySystem.nameSpace, (name: string) => {
        phisics.removeMeshFromCollision(name)
        audio.playEnergy()
        energySystem.animateMovieHide(name)
        if (isFullEnergy) {
            return;
        }
        const percentageItemsGetted = energySystem.getPercentageItemsGetted()
        const multipyPercentage = Math.min(1., percentageItemsGetted / ENERGY_PERCENTAGE_MUST_GET)
        ui.setEnergyLevel(multipyPercentage)
        if (multipyPercentage < 1) {
            return;
        }
        isFullEnergy = true
    })


    // trigger complete level ******************************/
    let executeAwaitCompletePlay: (value: unknown) => void = () => {}
    const completePlay = () => {
        return new Promise(resolve => {
            executeAwaitCompletePlay = resolve
        })
    }
    let isDoorOpen = false 
    phisics.onCollision(lab.nameSpace + 'top_tunnel', async (name: string) => {
        if (!isFullEnergy) {
            return;
        }
        if (isDoorOpen) {
            return;
        }
        isDoorOpen = true

        executeAwaitCompletePlay(true)
    })
    await completePlay()

    // pipeline destroy level ******************************/
    audio.playDoor()
    await lab.openDoor()
    ui.setEnergyLevel(0)
    await pause(1000)
    ui.toggleVisibleEnergy(false)
    controls.disconnect()
    phisics.stopPlayerBody()
    audio.disableSteps()
    audio.playFly()
    await studio.cameraFlyAway(lab.lastDir)
    lab.destroy()
    energySystem.destroy()

    // complete play if no next level ***********************/
    ++indexLevel
    if (!LABS_CONF[indexLevel]) {
        audio.stopFly()
        return;
    }

    // pipeline create new level ******************************/indexLevel
    console.log('level:', indexLevel, LABS_CONF[indexLevel])
    await lab.init(root, LABS_CONF[indexLevel])
    energySystem.init(root, lab.posesSleepEnds)
    await studio.cameraFlyToLevel()
    audio.stopFly()
    phisics.setPlayerPosition(...PLAYER_START_POS)
    controls.connect()
    audio.enableSteps()
    ui.toggleVisibleEnergy(true)
    await pipelinePlay(root)
}

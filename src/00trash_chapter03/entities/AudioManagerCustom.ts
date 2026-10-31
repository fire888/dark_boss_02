import { Root } from '../index'
import { AudioListener, Audio } from 'three'
import { AudioManager } from '_CORE/AudioManager'

export class AudioManagerCustom extends AudioManager {
    private _car: Audio

    constructor () {
        super()
    }

    init (root: Root) {
        super.init(root)
        const listener = new AudioListener()

        this._car = new Audio(listener)
        this._car.setBuffer(root.assets.soundCar)
        this._car.setLoop(true)
        this._car.playbackRate = 1
        this._car.setVolume(.02)
    }

    playCar() {
        this._car.play()
    }

    stopCar() {
        this._car.stop()
    }

}

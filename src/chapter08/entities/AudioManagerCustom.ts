import { Root } from '../index'
import { AudioListener, Audio } from 'three'
import { Tween, Interpolation} from '@tweenjs/tween.js'
import { AudioManager } from '_CORE/AudioManager'

export class AudioManagerCustom extends AudioManager {
    private _energy: Audio
    private _door: Audio 
    private _fly: Audio

    init (root: Root) {
        super.init(root)
        const listener = new AudioListener()
        const cam = root.studio.camera
        cam.add(listener)

        this._energy = new Audio(listener)
        this._energy.setBuffer(root.assets.soundBzink)
        this._energy.setLoop(false)
        this._energy.playbackRate = 1
        this._energy.setVolume(.5)

        this._door = new Audio(listener)
        this._door.setBuffer(root.assets.soundDoor)
        this._door.setLoop(false)
        this._door.playbackRate = 1
        this._door.setVolume(.5)

        this._fly = new Audio(listener)
        this._fly.setBuffer(root.assets.soundFly)
        this._fly.setLoop(true)
        this._fly.playbackRate = 1
        this._fly.setVolume(1.5)
    }

    playEnergy () {
        this._energy.play()
    }

    playDoor () {
        this._door.setVolume(.5)
        this._door.play()

        setTimeout(() => {
            const obj = { v: .5  } 
            new Tween(obj)
                .interpolation(Interpolation.Linear)
                .to({ v: 0 }, 400)
                .onUpdate(() => {
                    this._door.setVolume(obj.v)
                })
                .start()
        }, 1500)
    }

    playFly () {
        this._fly.play()
        const obj = { v: 0 } 
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: 1 }, 1000)
            .onUpdate(() => {
                this._fly.setVolume(obj.v)
            })
            .start()
    }

    stopFly () {
        const obj = { v: 1 } 
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: 0 }, 1000)
            .onUpdate(() => {
                this._fly.setVolume(obj.v)
            })
            .onComplete(() => {
                this._fly.stop()
            })
            .start()
    }
}
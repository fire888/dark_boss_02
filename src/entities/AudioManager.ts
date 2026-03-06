import { Root } from '../index'
import { AudioListener, Audio } from 'three'
import { Tween, Interpolation} from '@tweenjs/tween.js'

export class AudioManager {
    private _root: Root
    private _soundAmbient: Audio
    private _steps: Audio
    private _energy: Audio
    private _door: Audio 
    private _fly: Audio
    private _isCanPlaySteps: boolean = true

    init (root: Root) {
        this._root = root
        const listener = new AudioListener()
        const cam = root.studio.camera
        cam.add(listener)

        this._soundAmbient = new Audio(listener)
        this._soundAmbient.setBuffer(root.loader.assets.soundAmbient)
        this._soundAmbient.setLoop(true)
        this._soundAmbient.setVolume(0)

        this._steps = new Audio(listener)
        this._steps.setBuffer(root.loader.assets.soundStepsMetal)
        this._steps.setLoop(true)
        this._steps.playbackRate = 2
        this._steps.setVolume(.15)

        // this._energy = new Audio(listener)
        // this._energy.setBuffer(root.loader.assets.soundBzink)
        // this._energy.setLoop(false)
        // this._energy.playbackRate = 1
        // this._energy.setVolume(.5)

        // this._door = new Audio(listener)
        // this._door.setBuffer(root.loader.assets.soundDoor)
        // this._door.setLoop(false)
        // this._door.playbackRate = 1
        // this._door.setVolume(.5)

        // this._fly = new Audio(listener)
        // this._fly.setBuffer(root.loader.assets.soundFly)
        // this._fly.setLoop(true)
        // this._fly.playbackRate = 1
        // this._fly.setVolume(1.5)
    }

    playAmbient () {
        if (this._soundAmbient.isPlaying) {
            return;
        }

        this._soundAmbient.play()

        const obj = { v: 0 } 
        new Tween(obj)
            .interpolation(Interpolation.Linear)
            .to({ v: .2 }, 400)
            .onUpdate(() => {
                this._soundAmbient.setVolume(obj.v)
            })
            .start()
    }

    disableSteps () {
        this._isCanPlaySteps = false 
        this._stopSteps() 
    }

    enableSteps () {
        this._isCanPlaySteps = true
    }

    update () {
        if (!this._isCanPlaySteps) {
            return
        }

        if (
            Math.abs(this._root.phisics.playerBody.velocity.x) > .05 || 
            Math.abs(this._root.phisics.playerBody.velocity.z) > .05 
        ) { 
            this._playSteps()
        }

        if (
            Math.abs(this._root.phisics.playerBody.velocity.x) < .05 && 
            Math.abs(this._root.phisics.playerBody.velocity.x) < .05
        ) { 
            this._stopSteps()
        }
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

    private _playSteps () {
        if (!this._isCanPlaySteps) {
            return;
        }
        if (this._steps.isPlaying) {
            return;
        }
        if (!this._root.phisics.isGround) {
            return;
        }
            
        this._steps.play()
    }

    private _stopSteps () {
        if (!this._steps.isPlaying) {
            return;
        }
        this._steps.stop()
    }
}
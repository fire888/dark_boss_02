import { Core } from './types'
import { AudioListener, Audio } from 'three'
import { Tween, Interpolation} from '@tweenjs/tween.js'

export class AudioManager {
    private _root: Core
    private _soundAmbient: Audio
    private _steps: Audio
    private _isCanPlaySteps: boolean = true

    init (root: Core) {
        this._root = root
        const listener = new AudioListener()
        const cam = root.studio.camera
        cam.add(listener)

        if (root.assets.soundAmbient) {
            this._soundAmbient = new Audio(listener)
            this._soundAmbient.setBuffer(root.assets.soundAmbient)
            this._soundAmbient.setLoop(true)
            this._soundAmbient.setVolume(0)
        }

        if (root.assets.soundStepsMetal) {
            this._steps = new Audio(listener)
            this._steps.setBuffer(root.assets.soundStepsMetal)
            this._steps.setLoop(true)
            this._steps.playbackRate = 2
            this._steps.setVolume(.15)
        }
    }

    playAmbient () {
        if (!this._soundAmbient) {
            return
        }
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
        if (!this._steps) {
            return
        }
        if (!this._isCanPlaySteps) {
            return
        }

        const { velocity } = this._root.phisics.playerBody

        if (
            this._root.phisics.isGround && 
            (Math.abs(velocity.x) > .1 || Math.abs(velocity.z) > .1) 
        ) { 
            this._playSteps()
        }

        if (
            !this._root.phisics.isGround ||
            (Math.abs(velocity.x) < .1 && Math.abs(velocity.x) < .1)
        ) { 
            this._stopSteps()
        }
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
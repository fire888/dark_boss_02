import { Root } from '../index'
import { AudioListener, Audio } from 'three'
import { AudioManager } from '_CORE/AudioManager'

export class AudioManagerCustom extends AudioManager {
    private _symbol: Audio

    constructor () {
        super()
    }

    // @ts-ignore
    init (root: Root) {
        // @ts-ignore
        super.init(root)
        const listener = new AudioListener()

        this._symbol = new Audio(listener)
        this._symbol.setBuffer(root.assets.soundSymbol)
        this._symbol.setLoop(false)
        this._symbol.playbackRate = 1
        this._symbol.setVolume(.5)
    }

    playSymbol () {
        this._symbol.play()
    }

}
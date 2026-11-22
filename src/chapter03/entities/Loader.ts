import { AudioLoader } from 'three'

import audioAmbient from '../assets/ambient.mp3'
import steps from '../assets/steps_metal.mp3'
import { Root } from '../index'

// звуки, которые ждёт AudioManager в root.assets
export class LoaderAssets {
    _root: Root

    init (root: Root) {
        this._root = root
    }

    async loadAssets () {
        const loadAudio = (key: string, src: string) => new Promise<void>(resolve => {
            new AudioLoader().load(src, buffer => {
                this._root.assets[key] = buffer
                resolve()
            })
        })
        await Promise.all([
            loadAudio('soundAmbient', audioAmbient),
            loadAudio('soundStepsMetal', steps),
        ])
    }
}

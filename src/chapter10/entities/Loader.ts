import {  
    AudioLoader, 
} from 'three'

import audioAmbient from '../assets/ambient.mp3'
import steps from '../assets/steps_metal.mp3'

type Assets = {
    soundAmbient: any,
    soundStepsMetal: any
}
type ResultLoad = {
    texture: any
    key: keyof Assets
}

export class LoaderAssets {
    assets: Assets = {
        soundAmbient: null,
        soundStepsMetal: null,
    }

    init () {}

    loadAssets (): Promise<void> {
        return new Promise(res => {

            // const loadTexture = (key: keyof Assets, src: string) => {
            //     return new Promise<ResultLoad>(res => {
            //         this._textureLoader.load(src, texture => {
            //             res({ key, texture })
            //         })
            //     })
            // }

            const loadAudio = ( key: keyof Assets, src: string) => {
                return new Promise<ResultLoad>(res => {
                    const loader = new AudioLoader()
                    loader.load(src, buffer => {
                        res({ key, texture: buffer })
                    })
                })
            }

            // const loadCubeTexture = (key: keyof Assets, src: string[]) => {
            //     return new Promise<ResultLoad>(res => {
            //         this._cubeTextureLoader.load(src, cubeTexture => {
            //             res({ key, texture: cubeTexture })
            //         })
            //     })
            // }

            const promises = [
                loadAudio('soundAmbient', audioAmbient),
                loadAudio('soundStepsMetal', steps),
            ]

            Promise.all(promises).then(result => {
                for (let i = 0; i < result.length; ++i) {
                     this.assets[result[i].key as keyof Assets] = result[i].texture
                }
                res()
            })
        })
    }
}

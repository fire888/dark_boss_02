import {  
    AudioLoader, 
    TextureLoader,
    CubeTextureLoader
} from 'three'

import audioAmbient from '../assets/ambient.mp3'
import steps from '../assets/steps_metal.mp3'
import tex01 from '../assets/texture01.jpg'
import tex01_inv from '../assets/texture01_inv.jpg'

import { Root } from '../index'

type ResultLoad = {
    texture: any
    key: string
}

export class LoaderAssets {
    _root: Root

    _textureLoader: TextureLoader = new TextureLoader()
    _cubeTextureLoader: CubeTextureLoader = new CubeTextureLoader()

    init (root: Root) {
        this._root = root
    }

    loadAssets (): Promise<void> {
        return new Promise(res => {

            const loadTexture = (key: string, src: string) => {
                return new Promise<ResultLoad>(res => {
                    this._textureLoader.load(src, texture => {
                        res({ key, texture })
                    })
                })
            }

            const loadAudio = ( key: string, src: string) => {
                return new Promise<ResultLoad>(res => {
                    const loader = new AudioLoader()
                    loader.load(src, buffer => {
                        res({ key, texture: buffer })
                    })
                })
            }

            const loadCubeTexture = (key: string, src: string[]) => {
                return new Promise<ResultLoad>(res => {
                    this._cubeTextureLoader.load(src, cubeTexture => {
                        res({ key, texture: cubeTexture })
                    })
                })
            }

            const promises = [
                loadAudio('soundAmbient', audioAmbient),
                loadAudio('soundStepsMetal', steps),
                loadTexture('textureTiles', tex01),
                loadTexture('textureTilesInv', tex01_inv)
            ]

            Promise.all(promises).then(result => {
                for (let i = 0; i < result.length; ++i) {
                     this._root.assets[result[i].key as string] = result[i].texture
                }
                res()
            })
        })
    }
}

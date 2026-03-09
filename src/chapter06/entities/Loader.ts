import { 
    Texture, 
    TextureLoader, 
    AudioLoader, 
    CubeTextureLoader, 
    CubeTexture 
} from 'three'

import { Root } from '../index'

import audioAmbient from '../assets/ambient.mp3'
import steps from '../assets/steps_metal.mp3'
import audioBzink from '../assets/bzink.mp3'
import audioDoor from '../assets/door.mp3'
import audioFly from '../assets/fly.mp3'

import roadImg from '../assets/road_stone.webp'
import wallTile from '../assets/tiles_wall.webp'
import noise00 from '../assets/noise00.webp'
import sprite from '../assets/sprite.webp'
import { T_Assets } from 'chapter09/types/GeomTypes'

type ResultLoad = { key: string, texture: Texture | any }


export class LoaderAssets {
    _textureLoader: TextureLoader = new TextureLoader()
    _cubeTextureLoader: CubeTextureLoader = new CubeTextureLoader()
    _root: Root

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
                loadAudio('soundBzink', audioBzink),
                loadAudio('soundDoor', audioDoor),
                loadAudio('soundFly', audioFly),
                
                loadTexture('sprite', sprite),
                loadTexture('roadImg', roadImg),
                loadTexture('mapWall_01', wallTile),
                loadTexture('noise00', noise00),
            ]

            Promise.all(promises).then(result => {
                for (let i = 0; i < result.length; ++i) {
                    this._root.assets[result[i].key as keyof T_Assets] = result[i].texture
                }
                res()
            })
        })
    }
}

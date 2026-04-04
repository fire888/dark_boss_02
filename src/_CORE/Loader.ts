import { 
    Texture, 
    TextureLoader, 
    AudioLoader, 
    CubeTextureLoader, 
    CubeTexture 
} from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { Core } from './types'
import { GLTFLoader } from  'three/examples/jsm/loaders/GLTFLoader'

export type LoadConf = { 
    loader: 'audio' | 'texture' | 'obj' | 'cubeTexture' | 'glb', 
    src: string | string[],
    key: string,
}[]

type ResultLoad = { key: string, texture: Texture | any }

export class LoaderAssets {
    _textureLoader: TextureLoader = new TextureLoader()
    _cubeTextureLoader: CubeTextureLoader = new CubeTextureLoader()
    _objLoader: OBJLoader | null = null
    _glbLoader: GLTFLoader | null = null
    _root: Core | null = null

    init (root: Core) {
        this._root = root
    }

    loadAssets (loadConf: LoadConf): Promise<void> {
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

            const loadObj = (key: string, src: string) => {
                return new Promise<ResultLoad>(res => {
                    if (!this._objLoader) this._objLoader = new OBJLoader()
                    this._objLoader.load(src, obj => {
                        res({ key, texture: obj })
                    })
                })
            }

            const loadGlb = (key: string, src: string) => {
                return new Promise<ResultLoad>(res => {
                    if (!this._glbLoader) this._glbLoader = new GLTFLoader()
                    this._glbLoader.load(src, obj => {
                        res({ key, texture: obj })
                    })
                })
            }

            const promises: Promise<ResultLoad>[] = []
            for (let i = 0; i < loadConf.length; ++i) {
                const item = loadConf[i]
                switch (item.loader) {
                    case 'audio':
                        typeof item.src === 'string' && promises.push(loadAudio(item.key, item.src))
                        break
                    case 'texture':
                        typeof item.src === 'string' && promises.push(loadTexture(item.key, item.src))
                        break
                    case 'obj':
                        typeof item.src === 'string' && promises.push(loadObj(item.key, item.src))
                        break
                    case 'glb':
                        typeof item.src === 'string' && promises.push(loadGlb(item.key, item.src))
                        break    
                    case 'cubeTexture':
                        Array.isArray(item.src) && promises.push(loadCubeTexture(item.key, item.src))
                        break
                }
            }

            Promise.all(promises).then(result => {
                for (let i = 0; i < result.length; ++i) {
                    if (this._root) {
                        this._root.assets[result[i].key as string] = result[i].texture
                    }
                }
                res()
            })
        })
    }
}

import { Root } from "../index"
import * as THREE from "three"
import { Lab03 } from "../EntLab03/Lab03"

const SCALE = 0.04

const POS_1 = [-35.30573983271848,-1.6,10.876251805833402] 
        
const MONSTERS_DATA = {
    '0': {
        pos: [0, -55, -10.680000000000003],
        rot: [0, 0, 0],
        //walkData: null,
        defaultAnimation: 'dialog',
    },
    '4': {
        pos: [-697.1507105430046, -31, 278.81390042624884],
        rot: [0, Math.PI / 2, 0],
        //walkData: '4',
        defaultAnimation: 'walk',
    },
    '13': {
        pos: [-946.6448542936033, 1263, 12.835633240896737],
        rot: [0, Math.PI / 2, 0],
        //walkData: '13',
        defaultAnimation: 'walk',

    },
    '20': {
        pos: [-2145.4767672182593, 2118.171875, 4.885100091204412],
        rot: [0, Math.PI, 0],
        //walkData: null,
        defaultAnimation: 'stay',
    },
}

type T_Clips = { [key: string]: THREE.AnimationAction }

class Walk {
    _state: string = 'WALK'
    _bot: THREE.Mesh 
    _root: Root
    _ray = new THREE.Raycaster()
    _clips: T_Clips
    _targetRot = 0
    active = false

    constructor (bot: THREE.Mesh, clips: T_Clips, root: Root) {
        this._bot = bot
        this._root = root
        this._clips = clips

        this._root.ticker.on(() => {
            this._update()
        })
    }

    _update() {
        if (this._state === 'WALK') {
            const dir = new THREE.Vector3()
            this._bot.getWorldDirection(dir)

            this._ray.set(this._bot.position, dir)

            const intersects = this._ray.intersectObjects(this._root.lab.currentLevelMeshes)
            if (intersects.length && intersects[0].distance > 1) {
                this._bot.translateZ(0.006)
            } else {
                this.setState('ROTATE')    
            }
            if (Math.random() < .002) {
                this.setState('ROTATE')
            }
        }

        if (this._state === 'ROTATE') {
            this._bot.rotation.y += (this._targetRot - this._bot.rotation.y) * .1
            if (Math.abs(this._targetRot - this._bot.rotation.y) < .01) {
                this.setState('WALK')
            }
        }
    }

    setState(state: string) {
        if (state === 'ROTATE') {
            this.active = true
            this._targetRot = this._bot.rotation.y + Math.PI + (Math.random() - .5) * Math.PI
            this._clips['walk'].reset().play()
        }
        if (state === 'WALK') {
            this.active = true
            this._clips['walk'].reset().play()
        }
        if (state === 'NONE') {
            this.active = false
            this._clips['walk'].stop()
            this._clips['dialog'].play()
        }

        this._state = state
    }
}



export class Bots {
    _mixer: THREE.AnimationMixer
    _clips: T_Clips = {} 
    _bot: THREE.Mesh
    _currentAction: string = 'NONE'

    _root: Root

    _walk: Walk 


    constructor () {
        this._mixer = null as any
        this._bot = null as any
        this._root = null as any
        this._walk = null as any
    }

    async init(root: Root) {
        console.log(root.assets)

        this._root = root

        const { assets, studio, materials, ticker } = root
        const { bot: botAsset } = assets

        this._bot = botAsset.scene.children[0]
        this._bot.traverse((item: THREE.Object3D) => {
            if (item instanceof THREE.Mesh) item.material = materials['skin']
        })
        this._bot.position.set(POS_1[0], POS_1[1], POS_1[2])
        this._bot.rotation.set(0, Math.random() * Math.PI * 2, 0)
        this._bot.scale.set(SCALE, SCALE, SCALE)
        studio.add(this._bot)

        const animations = botAsset.animations
        this._mixer = new THREE.AnimationMixer(this._bot)

        const dialog = this._mixer.clipAction(animations[2])
        dialog.timeScale = 1.5

        const walk = this._mixer.clipAction(animations[0])
        walk.timeScale = 3

        const stay = this._mixer.clipAction(animations[1])
        stay.timeScale = 1

        this._clips = { dialog, walk, stay }

        ticker.on((d: number) => {
            this._mixer.update(d * 0.001)
            const dist = this._bot.position.distanceTo(studio.camera.position)
            if (dist < 1 && this._walk.active) this._walk.setState('NONE')
            if (dist > 1 && !this._walk.active) this._walk.setState('ROTATE')   
            //if ()
        })

        this._walk = new Walk(this._bot, this._clips, root)
        this._walk.setState('WALK')
    }

    play(key: string) {
        if (this._currentAction === key) return;
        this._currentAction = key

        this._mixer.stopAllAction()
        
    }

}

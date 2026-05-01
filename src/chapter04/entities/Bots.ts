import { Root } from "../index"
import * as THREE from "three"
import { Lab03 } from "../EntLab03/Lab03"
import { BodyN  } from "../../_CORE/Phisics"

const SCALE = 0.04


        
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
type T_Action = { 
    actionKey: string, 
    angleTo?: number 
}
class Walk {
    state: string = 'NONE'
    _bot: THREE.Mesh 
    _root: Root
    _ray = new THREE.Raycaster()
    _clips: T_Clips
    _actions: T_Action[] = []
    _botPhisics: BodyN = null as any

    constructor (bot: THREE.Mesh, clips: T_Clips, root: Root) {
        this._bot = bot
        this._botPhisics = root.phisics.createSphereStatic('botPhisics', 0.3)
        this._root = root
        this._clips = clips

        this._root.ticker.on(() => {
            this._update()
        })
    }

    _update() {
        if (this._actions.length === 0) return

        const { actionKey, angleTo } = this._actions[0]

        if (actionKey === 'go') {
            const dir = new THREE.Vector3()
            this._bot.getWorldDirection(dir)
            this._ray.set(this._bot.position, dir)

            const intersects = this._ray.intersectObjects(this._root.lab.currentLevelMeshes)
            if (intersects.length && intersects[0].distance > 1) {
                this._bot.translateZ(0.006)
                this._botPhisics.position.set(this._bot.position.x, this._bot.position.y + .5, this._bot.position.z)
                this._botPhisics.updateAABB()
            } else {
                this._actions.shift()
            }
            if (Math.random() < .002) {
                this._actions.shift()
            }
        }

        if (actionKey === 'rotate' && angleTo !== undefined) {
            this._bot.rotation.y += (angleTo - this._bot.rotation.y) * .05
            if (Math.abs(angleTo - this._bot.rotation.y) < .01) {
                this._bot.rotation.y = this._bot.rotation.y % (2 * Math.PI) 
                this._actions.shift()
            }
        }

        if (actionKey === 'wait') {
            if (Math.random() < .05) {
                this._actions.shift()
            }
        }

        if (actionKey === 'superWait') {

        }

        if (this._actions.length === 0 && this.state !== 'NONE') {
            this.setState(this.state)
        }
    }

    setState(state: string) {
        Object.values(this._clips).forEach((clip: THREE.AnimationAction) => {
            clip.stop()
        })

        if (state === 'WALK') {
            this._clips['walk'].reset().play()
            this._actions = [
                { actionKey: 'rotate', angleTo: this._bot.rotation.y + Math.PI + Math.PI * Math.random() -.5 },
                { actionKey: 'go' },
            ]
        }
        if (state === 'DIALOG') {
            this._clips['dialog'].reset().play()

            const posPlayer = this._root.studio.camera.position.clone().setY(0)
            const posBot = this._bot.position.clone().setY(0)
            const angleTo = Math.atan2(posPlayer.x - posBot.x, posPlayer.z - posBot.z)

            this._actions = [
                { actionKey: 'rotate', angleTo },
                { actionKey: 'wait' },
            ]
        }
        if (state === 'STAY') {
            this._clips['stay'].reset().play()
            this._actions = [
                { actionKey: 'superWait' },
                { actionKey: 'superWait' },
                { actionKey: 'superWait' },
                { actionKey: 'superWait' },
                { actionKey: 'superWait' },
            ]
        }
        this.state = state
    }

    setPos(x: number, y: number, z: number) {
        this._bot.position.set(x, y, z)
        this._botPhisics.position.set(x, y + .5, z)
        this._botPhisics.updateAABB()
    }

}

export class Bots {
    _mixer: THREE.AnimationMixer
    _clips: T_Clips = {} 
    _bot: THREE.Mesh
    _currentAction: string = 'NONE'

    _root: Root

    _walk: Walk 

    _isStarted = false


    constructor () {
        this._mixer = null as any
        this._bot = null as any
        this._root = null as any
        this._walk = null as any
    }

    async init(root: Root) {
        this._root = root

        const { assets, studio, materials, ticker } = root
        const { bot: botAsset } = assets

        this._bot = botAsset.scene.children[0]
        this._bot.traverse((item: THREE.Object3D) => {
            if (item instanceof THREE.Mesh) item.material = materials['skin']
        })
        this._bot.position.set(0, -.4, -.6)
        this._bot.scale.set(SCALE, SCALE, SCALE) 
        studio.camera.add(this._bot)

        const animations = botAsset.animations
        this._mixer = new THREE.AnimationMixer(this._bot)
        ticker.on((d: number) => { this._mixer.update(d * 0.001) })

        const dialog = this._mixer.clipAction(animations[2])
        dialog.timeScale = 1.5

        const walk = this._mixer.clipAction(animations[0])
        walk.timeScale = 3

        const stay = this._mixer.clipAction(animations[1])
        stay.timeScale = 1

        this._clips = { dialog, walk, stay }
        this._clips['dialog'].play()

        this._walk = new Walk(this._bot, this._clips, root)
    }
    moveToInLocation(locNum: number) {
        if (locNum === 4) {
            this._root.studio.add(this._bot)
            const pos = [-35.30573983271848,-1.6,10.876251805833402]
            this._walk.setState('WALK')
            this._walk.setPos(pos[0], pos[1], pos[2])
        }
        if (locNum === 13) { 
            this._root.studio.add(this._bot)
            const pos = [-47.319585772196874,63.1,-0.8187502704036255]
            this._walk.setState('WALK')
            this._walk.setPos(pos[0], pos[1], pos[2])
        }
        if (locNum === 19) {
            this._root.studio.add(this._bot)
            const pos = [-102.90140699284755,105.9,-1.5127320925863286]
            this._walk.setState('STAY')
            this._walk.setPos(pos[0], pos[1], pos[2])
        }
    }

    startCheckerNearPlayer() {
        const { studio, ticker } = this._root
        ticker.on((d: number) => {
            const dist = this._bot.position.distanceTo(studio.camera.position)
            if (dist < 1 && this._walk.state === 'WALK') this._walk.setState('DIALOG')
            if (dist > 1 && this._walk.state === 'DIALOG') this._walk.setState('WALK')   
        })
    }

}

import * as THREE from 'three'
import { Root } from '../../index'
import { _M } from '_CORE/_M/_m'
import { Floors } from './Floors'
import { BigElems } from './BigElems'
import { Stairs } from './Stairs'

export const SIZE_QUADRANT = 500

export class Labyrinth {
    stairs: Stairs
    bigElems: BigElems
    floors: Floors
    meshFinish!: THREE.Mesh

    async init(root: Root): Promise<void> {
        this.floors = new Floors(root)
        this.stairs = new Stairs(root)
        this.bigElems = new BigElems(root)
    }

    addStairToScene(index: number, x: number, z: number): void {
        this.meshFinish = this.stairs.addToScene(index, x, z) 
    }

    addElemsToLoc(locations: string[]): void {
        for (const location of locations) {
            const { x, z } = this._parseLocation(location)

            this.floors.addFloorForLocation(location, x, z)
            this.bigElems.addForLocation(location, x, z)
        }
    }

    removeBigElemsFromLoc(locations: string[]): void {
        for (let i = 0; i < locations.length; i++) {
            this.bigElems.removeForLocation(locations[i])
        }
    }

    removeElemsFromLoc(locations: string[]): void {
        for (let i = 0; i < locations.length; i++) {
            this.floors.removeFloorForLocation(locations[i])
            this.bigElems.removeForLocation(locations[i])
        }
    }

    removeNormalFloor(): void {
        this.floors.removeBaseFloor()
    }

    addNormalFloor(): void {
        this.floors.addBaseFloor()
    }

    updateElemsByLoc(removeArr: string[], addArr: string[]): void {
        this.removeElemsFromLoc(removeArr)
        this.addElemsToLoc(addArr)
    }

    removeAllGreens () {
        this.stairs.removeAll()
        this.bigElems.removeAll()
        this.floors.removeAll()
    }

    private _parseLocation(location: string): { x: number; z: number } {
        const [rawX, rawZ] = location.split('_')
        return {
            x: Number(rawX) * SIZE_QUADRANT,
            z: Number(rawZ) * SIZE_QUADRANT,
        }
    }
}
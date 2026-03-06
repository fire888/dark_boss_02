import {
    MeshPhongMaterial,
    MeshBasicMaterial,
    Mesh,
} from 'three'
import { _M, A3 } from "../../geometry/_m";
import { createScheme } from './scheme';
import { createTileI } from '../../geometry/tile_I'
import { createTileL } from '../../geometry/tile_L'
import { createTileT } from '../../geometry/tile_T'
import { createTileU } from '../../geometry/tile_U'
import { Root } from '../../index';
import { PosesSleepEnds, Dir, DataToCreateLine } from './types';

const EMPTY = 1
const STAIR = 4

type LevelData = {
    material: MeshPhongMaterial, 
    collisionMaterial: MeshBasicMaterial,
    numTilesX: number, 
    numTilesZ: number, 
    posStart: [number, number],
    posStartDir: Dir,
    dataForEnter: DataToCreateLine,
    w: number,
    n: number,
}


export class LabLevel {
    collisionMesh: Mesh
    mesh: Mesh

    posStart: [number, number]
    posEnd: [number, number]
    dirToPosEnd: Dir
    pathToPosEnd: A3[]
    colorToPosEnd: A3
    formToPosEnd: number[]
    posesSleepEnds: PosesSleepEnds

    async init (
        root: Root, 
        levelData: LevelData,
    ) {
        const 
        material = levelData.material, 
        collisionMaterial = levelData.collisionMaterial,
        numTilesX = levelData.numTilesX, 
        numTilesZ = levelData.numTilesZ, 
        posStart = levelData.posStart,
        posStartDir = levelData.posStartDir,
        dataForEnter = levelData.dataForEnter,
        w = levelData.w,
        n = levelData.n
        const W = w
        const N = n

        const shemeData = await createScheme({
            width: numTilesX,
            height: numTilesZ,
            posStart,
            posStartDir,
            dataForEnter,
        })

        const {         
            maze,
            posEnd, 
            dirToPosEnd,
            pathToPosEnd,
            colorToPosEnd,
            formToPosEnd,
            posesSleepEnds,
        } = shemeData

        this.posStart = posStart
        this.posEnd = posEnd
        this.dirToPosEnd = dirToPosEnd
        this.pathToPosEnd = pathToPosEnd
        this.colorToPosEnd = colorToPosEnd
        this.formToPosEnd = formToPosEnd

        const v: number[] = []
        const c: number[] = []
        const vC: number[] = []

        for (let key in maze) {
            const tile = maze[key]
            if (
                tile.type === EMPTY ||
                tile.type === STAIR
            ) {
                continue;
            }

            const ij = key.split(',')
             
            let typeTile = null
            if (
                (tile.s && !tile.e && !tile.n && !tile.w) || 
                (!tile.s && tile.e && !tile.n && !tile.w) || 
                (!tile.s && !tile.e && tile.n && !tile.w) || 
                (!tile.s && !tile.e && !tile.n && tile.w)
            ) typeTile = 'U'
            if (
                (tile.s && tile.n && !tile.w && !tile.e) ||
                (!tile.s && !tile.n && tile.w && tile.e)
            ) typeTile = 'I'
            if (
                (tile.s && tile.e && !tile.n && !tile.w) || 
                (tile.s && !tile.e && !tile.n && tile.w) || 
                (!tile.s && tile.e && tile.n && !tile.w) || 
                (!tile.s && !tile.e && tile.n && tile.w) 
            ) typeTile = 'L'
            if (
                (tile.w && tile.s && tile.e && !tile.n) ||
                (!tile.w && tile.s && tile.e && tile.n) ||
                (tile.w && !tile.s && tile.e && tile.n) ||
                (tile.w && tile.s && !tile.e && tile.n)
            ) typeTile = 'T'

            let e = null
            const data = { ...tile, num: N, width: W }
            if (typeTile === 'U') e = createTileU(data)
            if (typeTile === 'I') e = createTileI(data)
            if (typeTile === 'L') e = createTileL(data)
            if (typeTile === 'T') e = createTileT(data)
            if (e) {
                _M.translateVertices(e.v, +ij[0] * W, 0, +ij[1] * W)
                v.push(...e.v)
                c.push(...e.c)
                if (e.vC) {
                    _M.translateVertices(e.vC, +ij[0] * W, 0, +ij[1] * W)
                    vC.push(...e.vC)
                }
            }
        }

        this.posesSleepEnds = posesSleepEnds
        this.mesh = _M.createMesh({ v, c, material })
        this.collisionMesh = _M.createMesh({ v: vC, material: collisionMaterial }) 
    }
}

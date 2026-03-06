import { IPerimeter, ElemType, IArrayForBuffers } from "../../types/GeomTypes"
import { wall01 } from '../wall01/wall01'
import { createAnglePoias01 } from "../../geometry/poias01/poias01"
import { _M } from '../../geometry/_m'
import { 
    IdataForFillWall, 
    IdataForFillWall_TMP, 
    addTypeFullIdataForFillWall 
} from "../../types/GeomTypes"
import { OUTER_HOUSE_FORCE } from "../../constants/CONSTANTS"


const D = .2

export const buildHouse01 = (perimeter: IPerimeter): IArrayForBuffers => {
    const H = Math.random() * 60 + 3 

    const v: number[] = [] 
    const uv: number[] = []
    const c: number[] = []
    const vCollide: number[] = []

    const H_TOP_POIAS = 0.4 + Math.random()

    const wallsData_TMP: IdataForFillWall_TMP[] = []

    for (let i = 1; i < perimeter.length; ++i) {
        const prev = perimeter[i - 1]
        const cur =  perimeter[i]

        /** проверяем что следующая точка не лежит на предыдущей */
        if (cur[0] === prev[0] && cur[1] === prev[1]) {
            continue;
        }

        const wallDataSheme_tmp: IdataForFillWall_TMP = {
            buffer: [],
            w: 0,
            h: H,
            d: D,
            indicies: {},
            X: prev[0],
            Z: prev[1],
        }

        const d = _M.dist(prev, cur)
        wallDataSheme_tmp.w = d

        const ranPilastreType = Math.random()
        let sidePilasterType: ElemType = ElemType.PILASTER_01
        if (ranPilastreType < 0.15) {
            sidePilasterType = ElemType.PILASTER_00
        } else if (ranPilastreType < 0.25) {
            sidePilasterType = ElemType.PILASTER_01
        } else if (ranPilastreType < 0.5) {
            sidePilasterType = ElemType.PILASTER_02
        } else if (ranPilastreType < 0.75) {
            sidePilasterType = ElemType.PILASTER_03
        } else {
            sidePilasterType = ElemType.PILASTER_04
        }
        const SIDE_PILASTER_W = 0.3 + Math.random() * 0.5

        // SAVE TO SCHEME
        wallDataSheme_tmp.buffer.push(0, 0, 0)
        wallDataSheme_tmp.indicies[`field_wall_start`] = 0
        wallDataSheme_tmp.buffer.push(d, 0, 0)
        wallDataSheme_tmp.indicies[`field_wall_end`] = 1

        wallDataSheme_tmp.TYPE_TOP_POIAS = ElemType.POIAS_01
        wallDataSheme_tmp.H_TOP_POIAS = H_TOP_POIAS
        wallDataSheme_tmp.TYPE_SIDE_PILASTER = sidePilasterType
        wallDataSheme_tmp.SIDE_PILASTER_W = SIDE_PILASTER_W

        const angle = _M.angleFromCoords(cur[0] - prev[0], cur[1] - prev[1])
        wallDataSheme_tmp.angle = angle

        wallsData_TMP.push(wallDataSheme_tmp)
    }

    for (let i = 0; i < wallsData_TMP.length; ++i) {
        const prevW = wallsData_TMP[i - 1] ? wallsData_TMP[i - 1] : wallsData_TMP[wallsData_TMP.length - 1]
        const currW = wallsData_TMP[i]
        const nextW = wallsData_TMP[i + 1] ? wallsData_TMP[i + 1] : wallsData_TMP[0]
        
        const startConnectedAngle = currW.angle - prevW.angle
        const startOffset = Math.abs(startConnectedAngle / Math.PI * .3) < 1 
            ? 0 
            : Math.abs(Math.PI / startConnectedAngle) * 320
        
        const endConnectedAngle = nextW.angle - currW.angle
        const endOffset = Math.abs(endConnectedAngle / Math.PI * .3) < 1 
            ? 0 
            : Math.abs(Math.PI / endConnectedAngle) * 320

        currW.INNER_WALL_START_OFFSET = startOffset
        currW.INNER_WALL_END_OFFSET = endOffset

        currW.buffer.push(currW.SIDE_PILASTER_W, 0, -D)
        currW.indicies[`field_wall_innerStart`] = 2
        currW.buffer.push(currW.w - currW.SIDE_PILASTER_W, 0, -D)
        currW.indicies[`field_wall_innerEnd`] = 3

        _M.rotateVerticesY(currW.buffer, -currW.angle)
        _M.translateVertices(currW.buffer, currW.X, 0, currW.Z)
    }

    const wallsData: IdataForFillWall[] = []
    for (let i = 0; i < wallsData_TMP.length; ++i) {
        const wallDataSheme = wallsData_TMP[i]
        const wallData = addTypeFullIdataForFillWall(wallDataSheme)
        wallsData.push(wallData)
    }

    for (let i = 0; i < wallsData.length; ++i) {
        const r = wall01(wallsData[i])

        const { angle, X, Z, buffer, indicies } = wallsData[i]

        _M.rotateVerticesY(r.v, -angle)
        _M.translateVertices(r.v, X, 0, Z)
        for (let j = 0; j < r.v.length; ++j) {
            v.push(r.v[j])
        }
        for (let j = 0; j < r.uv.length; ++j) {
            uv.push(r.uv[j])
        }
        for (let j = 0; j < r.c.length; ++j) {
            c.push(r.c[j])
        }

        _M.rotateVerticesY(r.vCollide, -angle)
        _M.translateVertices(r.vCollide, X, 0, Z)
        vCollide.push(...r.vCollide)


        { // top collision
            const vTopC = _M.createPolygon(
                [0, 0, -.5],
                [wallsData[i].w, 0, -.5],
                [wallsData[i].w, 0, .5],
                [0, 0, .5],
            )
            _M.rotateVerticesY(vTopC, -angle)
            _M.translateVertices(vTopC, X, wallsData[i].h + .1, Z)
            vCollide.push(...vTopC)
        }

        const prevWall = wallsData[i - 1] ? wallsData[i - 1] : wallsData[wallsData.length - 1]

        // ANGLE CONNECT TOP POIAS WITH PREVIOUS WALL 
        const poias = createAnglePoias01(-prevWall.angle, -angle, H_TOP_POIAS, D + .2)
        _M.translateVertices(poias.v, wallsData[i].X, H - H_TOP_POIAS, wallsData[i].Z)
        for (let j = 0; j < poias.v.length; ++j) {
            v.push(poias.v[j])
        }
        for (let j = 0; j < poias.uv.length; ++j) {
            uv.push(poias.uv[j])
        }
        for (let j = 0; j < poias.c.length; ++j) {
            c.push(poias.c[j])
        }
    }

    const forceMat = []
    for (let i = 0; i < v.length; i += 3) {
        forceMat.push(OUTER_HOUSE_FORCE)
    }

    return { v, uv, c, vCollide, forceMat }
}
/* eslint-disable */

import { createWall } from './geometryRoom/geomWall'
import { createDoorData } from './geometryRoom/geomDoor'
import { createOuterWall } from './geometryRoom/outerWall'
import {rotateArrY, translateArr, createFace} from "./helpers/geomHelpers";
import { createMeshFromBuffer } from './helpers/createBufferMesh'
import { createTown2Scheme } from './town2shemeRooms'
import { createFloor } from './geometryRoom/geometryFloor'
import * as THREE from 'three' 
import { _M } from '_CORE';

const y0 = -61
const white1 = [1, 1, 1]
const white6 = [
    ...white1,
    ...white1,
    ...white1,
    ...white1,
    ...white1,
    ...white1,
]
const gr1 = [1, 0, 0]
const gr6 = [
    ...gr1,
    ...gr1,
    ...gr1,
    ...gr1,
    ...gr1,
    ...gr1,
]



export const createTown2 = (root) => {
    const {
        arrOuterWalls,
        doors,
        arrWallsPrepared,
        floors,
    } = createTown2Scheme()

    const v = []
    const c = []
    const b = []
    const u = []

    /** ROOMS MESHES */
    for (let i = 0; i < arrWallsPrepared.length; ++i) {
        const dataWall = createWall(arrWallsPrepared[i], root)
        v.push(...dataWall.v)
        c.push(...dataWall.c)
        b.push(...dataWall.b)
        u.push(...dataWall.u)
    }

    /** DOORS MESH **/
    for (let key in doors) {
        const door = createDoorData(root, null, doors[key].l, doors[key].keyMode || null)
        rotateArrY(door.v,  doors[key].angle)
        translateArr(door.v, doors[key].p0[0], y0, doors[key].p0[1])
        v.push(...door.v)

        rotateArrY(door.b,  doors[key].angle)
        translateArr(door.b, doors[key].p0[0], y0, doors[key].p0[1])
        b.push(...door.b)

        u.push(...door.u)
        c.push(...door.c)
    }


    /** OUTER WALLS MESH */
    for (let i = 0; i < arrOuterWalls.length; ++i) {
        const wall = createOuterWall(arrOuterWalls[i], null)
        v.push(...wall.v)
        c.push(...wall.c)
        b.push(...wall.b)
        u.push(...wall.u)
    }

    /** floor */
    for (let i = 0; i < floors.length; ++i) {
        const f = createFloor(floors[i])
        v.push(...f.v)
        c.push(...f.c)
        u.push(...f.u)
    }

    /** ceil */
    const h = 30
    for (let i = 0; i < floors.length; ++i) {
        const data = floors[i]
        const lX = (data.p1[0]) - (data.p0[0])
        const lZ = (data.p2[1]) - (data.p1[1]) 
    
        const nX = Math.ceil(Math.abs(lX / 100))
        const nZ = Math.ceil(Math.abs(lZ / 100))
    
        const stepX = lX / nX
        const stepZ = lZ / nZ
    
        for (let i = 0; i < nX; ++i) {
            for (let j = 0; j < nZ; ++j) {
                v.push(
                    ...createFace(
                        [data.p0[0] + i * stepX,          h,     data.p2[1] - (j) * stepZ],
                        [data.p0[0] + (i + 1) * stepX,    h,     data.p2[1] - (j) * stepZ],
                        [data.p0[0] + (i + 1) * stepX,    h,     data.p2[1] - (j + 1) * stepZ],
                        [data.p0[0] + i * stepX,          h,     data.p2[1] - (j + 1) * stepZ],
                    )
                )
                c.push(...white6)
                u.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1)
            }
        }
    }

    const Y = 2.2
    const SCALE = .06

    const mesh = createMeshFromBuffer({ 
        v, c, u, 
        mat: root.materials.iron
    })

    mesh.geometry.scale(SCALE, SCALE, SCALE)
    mesh.position.y = Y
    root.studio.add(mesh)

    const mCollision = createMeshFromBuffer({ v: b })
    mCollision.visible = false
    mCollision.geometry.scale(SCALE, SCALE, SCALE)
    mCollision.position.y = Y + 1
    mCollision.scale.y = 3
    root.studio.add(mCollision)
    root.phisics.addMeshToCollision(mCollision)

    const floorsCopy = []
    floors.forEach((fl, i) => {
        const { p0, p1, p2, p3 } = fl
        const fnew = { 
            p0: [p0[0] * SCALE, p0[1] * SCALE],
            p1: [p1[0] * SCALE, p1[1] * SCALE],
            p2: [p2[0] * SCALE, p2[1] * SCALE],
            p3: [p3[0] * SCALE, p3[1] * SCALE],
        }
        floorsCopy.push(fnew)

        {
            const label = _M.createLabel(i + '_p0', [1, 0, 0], 1)
            label.position.set(fnew.p0[0], 7, fnew.p0[1])
            root.studio.add(label)
        }
        {
            const label = _M.createLabel(i + '_p1', [1, 0, 0], 1)
            label.position.set(fnew.p1[0], 8, fnew.p1[1])
            root.studio.add(label)
        }
        {
            const label = _M.createLabel(i + '_p2', [1, 0, 0], 1)
            label.position.set(fnew.p2[0], 9, fnew.p2[1])
            root.studio.add(label)
        }
        {
            const label = _M.createLabel(i + '_p3', [1, 0, 0], 1)
            label.position.set(fnew.p3[0], 10, fnew.p3[1])
            root.studio.add(label)
        }

    })

    return {
        mesh,
        mCollision,
        floors: floorsCopy,
    }
}
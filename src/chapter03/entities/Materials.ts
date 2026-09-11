import * as THREE from 'three'
import { Root } from '../index'
import { createMap00 } from 'maps/map00/map00'
import { createMap01 } from 'maps/map01/map01'
import { createMap02 } from 'maps/map02/map02'
import { createMap03 } from 'maps/map03/map03'
import { createMap04 } from 'maps/map04/map04'
import { createMap05 } from 'maps/map05/map05'
import {
    ATLAS_GRID, TILE_PAD_FRACTION,
    TILE_FLOOR, TILE_WALL, TILE_ROCK, TILE_FLOOR_FINE, TILE_CEIL_ROUND, TILE_CEIL_BEAMS,
} from 'geometry/atlasUv'

// Атлас уровня: сетка ATLAS_GRID x ATLAS_GRID тайлов по TILE пикселей.
// Заняты первые шесть тайлов верхнего ряда: пол коридора (maps/map00), стены (map01),
// порода (map02, сейчас запас), пол зала (map03), потолок зала (map04),
// потолок коридора (map05), остальные пока пустые. Раскладка тайлов в uv и их номера — в geometry/atlasUv,
// оттуда же их берут фабрики room00 и tunnel01.
// Пустой тайл белый, а не фоновый: map умножается на vertexColors, и любой другой
// цвет затемнил бы все грани, которым карта не назначена.
const TILE = 256
const ATLAS_BG = '#ffffff'
// глубина рельефа по яркости атласа; подобрано на глаз, правится одним числом
const BUMP_SCALE = 1.2


import { showMap00 } from '../../maps/map00/map00'
//const m = createMap03() 
//showMap00(m)

const createLevelAtlas = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas')
    canvas.width = TILE * ATLAS_GRID
    canvas.height = TILE * ATLAS_GRID

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = ATLAS_BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const put = (tile: number, tex: HTMLCanvasElement) => {
        const col = tile % ATLAS_GRID
        const row = Math.floor(tile / ATLAS_GRID)
        ctx.drawImage(tex, col * TILE, row * TILE)
    }

    put(TILE_FLOOR, createMap00(TILE))
    put(TILE_WALL, createMap01(TILE))
    put(TILE_ROCK, createMap02(TILE))
    // map03 стыкуется сама с собой по кругу, поэтому ей нужно знать, какое окно тайла
    // реально семплится: заворачивать надо его, а не весь canvas
    put(TILE_FLOOR_FINE, createMap03(TILE, TILE_PAD_FRACTION))
    put(TILE_CEIL_ROUND, createMap04(TILE, TILE_PAD_FRACTION))
    put(TILE_CEIL_BEAMS, createMap05(TILE, TILE_PAD_FRACTION))

    // showMap00(canvas)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    return texture
}

export class Materials {
    collision!: THREE.MeshBasicMaterial
    floorMatNorm!: THREE.MeshPhongMaterial
    levelMatNorm!: THREE.MeshPhongMaterial
    levelAtlas!: THREE.CanvasTexture

    init (root: Root) {
        const mapGround = root.assets.mapGround
        mapGround.wrapS = THREE.RepeatWrapping
        mapGround.wrapT = THREE.RepeatWrapping
        mapGround.repeat.set(1, 1)

        this.floorMatNorm = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setStyle('#e682ff'),
            emissive: new THREE.Color().setStyle('#317287'),
            map: root.assets.mapGround,
            bumpMap: root.assets.mapGround,
            bumpScale: 30,
            envMap: root.assets.matIronBox,
            reflectivity: .05,
            shininess: .1,
            specular: new THREE.Color().setStyle('#ffffff'),
            vertexColors: true,
        })

        this.levelAtlas = createLevelAtlas()

        // тот же canvas идёт и в map, и в bumpMap: текстура камня нарисована в серых
        // тонах как высота, а пустые тайлы белые и потому плоские
        this.levelMatNorm = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setStyle('#ffffff'),
            map: this.levelAtlas,
            bumpMap: this.levelAtlas,
            bumpScale: BUMP_SCALE,
            vertexColors: true,
            wireframe: true,
        })

        this.collision = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    }

}

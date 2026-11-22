import * as THREE from 'three'

import atlas00Img from 'atlases/atlas00/512.jpg'
import atlasEnv00Img from 'atlases/atlas00/512env.jpg'
import atlasAo00Img from 'atlases/atlasAo00/512Ao.jpg'
import px from 'atlases/matIronBox/posx.jpg'
import py from 'atlases/matIronBox/posy.jpg'
import pz from 'atlases/matIronBox/posz.jpg'
import nx from 'atlases/matIronBox/negx.jpg'
import ny from 'atlases/matIronBox/negy.jpg'
import nz from 'atlases/matIronBox/negz.jpg'

// Материал геометрии src/geometry — как на стенде ch_redactor: цвет из atlas00 по uv, AO из atlasAo00 по uv2,
// запечённый свет в цветах вершин
export class Materials {
    level: THREE.MeshStandardMaterial

    init () {
        const textureLoader = new THREE.TextureLoader()

        const mapAtlas = textureLoader.load(atlas00Img)
        mapAtlas.colorSpace = THREE.SRGBColorSpace
        // чёткие пиксели; без мипмапов соседние тайлы атласа не подмешиваются вдали
        mapAtlas.magFilter = THREE.NearestFilter
        mapAtlas.minFilter = THREE.NearestFilter
        const mapAtlasRough = textureLoader.load(atlasEnv00Img)
        const mapAo = textureLoader.load(atlasAo00Img)
        // aoMap читает uv2 геометрии: в three 0.173 это канал 2
        mapAo.channel = 2

        const envCube = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz])

        this.level = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            vertexColors: true,
            map: mapAtlas,
            bumpMap: mapAtlas,
            bumpScale: 5,
            envMap: envCube,
            envMapIntensity: 1,
            roughness: .5,
            roughnessMap: mapAtlasRough,
            aoMap: mapAo,
            aoMapIntensity: 1,
        })
    }
}

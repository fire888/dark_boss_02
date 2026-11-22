import * as THREE from 'three'
import type { StudioConf, ControlsConf } from "_CORE/types"

export const IS_DEV_START_ORBIT = false
// геометрия уровня строится в Web Worker; false или нет Worker — в основном потоке
export const IS_USE_WORKER = true

// ---- план бесконечного уровня: куски complex02 один за другим по +x — главный путь и тупиковые отростки

// групп комнат на главном пути в одном куске; комнаты группы смежные, без перепадов
export const MAIN_CLUSTERS_PER_CHUNK = 3
// комнат в группе главного пути — от и до
export const MAIN_CLUSTER_ROOMS_MIN = 3
export const MAIN_CLUSTER_ROOMS_MAX = 5
// комнат в группе отростка — от и до
export const BRANCH_CLUSTER_ROOMS_MIN = 1
export const BRANCH_CLUSTER_ROOMS_MAX = 3
// вероятность отростка на свободной наружной стене группы и сколько групп вглубь он уходит
export const BRANCH_CHANCE = .3
export const BRANCH_DEPTH = 1
// на сколько стена выхода главного пути может смотреть в сторону от +x, радианы
export const HEADING_SPREAD = .9
// длина туннеля между наружными лицами стен
export const TUNNEL_LENGTH_MIN = 8
export const TUNNEL_LENGTH_MAX = 14
// длина горизонтального участка туннеля у каждого конца, до пандуса
export const TUNNEL_FLAT_LENGTH = 1
// самый крутой пандус — перепад на метр пандуса; при большом перепаде туннель удлиняется до него
export const TUNNEL_SLOPE_MAX = .7
// перепад уровня пола между комнатами на концах туннеля — от MIN до MAX, вверх или вниз
export const LEVEL_STEP_MIN = 3
export const LEVEL_STEP_MAX = 8
// поправка высоты комнат к случайной из randomOpts complex00
export const ROOM_HEIGHT_ADD = -1
// Самый низкий портал (до низа перемычки): прокси перемычки на 1 ниже видимой, игрок — шар диаметром 1,
// значит прокси не ниже 2 над полом. Комната поднимается, пока портал такой высоты помещается под карнизом
export const PORTAL_HEIGHT_MIN = 3
// разброс высоты групп комнат вверх от самой низкой
export const HEIGHT_SPREAD = 5
// масштаб комнаты в плане — у каждой свой, от каморки до зала
export const ROOM_SCALE_MIN = .55
export const ROOM_SCALE_MAX = 2
// доля групп комнат с пилястрами у стен; у остальных стены гладкие
export const PILASTER_CHANCE = .5
// на сколько потолок туннеля выше дыры портала
export const TUNNEL_CEILING_RISE = 1
// наименьший зазор в плане между комнатами и туннелями
export const CLEARANCE = 1.5

// какие куски уровня держать вокруг куска, в котором игрок: позади и впереди
export const CHUNKS_BEHIND = 1
export const CHUNKS_AHEAD = 2

// упал ниже самого низкого пола текущего куска на столько — обратно в его первую комнату
export const FALL_DEPTH = 30
// на сколько над полом ставится игрок
export const PLAYER_LIFT = 1

const FOG_COLOR = new THREE.Color().set('#062331')

export const STUDIO_CONF: StudioConf = {
    cameraPos: new THREE.Vector3(0, 2, 0),
    cameraFov: 55,
    cameraLookAt: new THREE.Vector3(1, 2, 0),
    sceneBackground: FOG_COLOR,
    fogParams: { color: FOG_COLOR, near: 5, far: 60 },
    directionalLightParams: {
        color: new THREE.Color(0xffffff), intensity: 5,
        pos: new THREE.Vector3(-3, 3, -2),
    },
    // прожектор из камеры: Studio.render ставит его чуть выше камеры каждый кадр
    // spotLightParams: {
    //     color: new THREE.Color().setHex(0xffffff),
    //     intensity: 15,
    //     pos: new THREE.Vector3(0, 1, 5),
    //     angle: Math.PI * .2,
    //     penumbra: 1,
    //     decay: 1,
    //     distance: 30,
    //     targetPos: new THREE.Vector3(0, 0, -50),
    // }
}

export const CONTROLS_CONF: ControlsConf = {
    walkerCameraAddY: 1.2,
    playerSpeedForward: 10,
}

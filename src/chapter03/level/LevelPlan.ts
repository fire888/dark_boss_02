import type { A2, A3 } from "_CORE/_M/_gm"
import { randomOpts as randomComplexOpts } from "geometry/06_complex00/complex00"
import { layoutComplex02, type T_Complex02Layout } from "geometry/06_complex02/complex02"
import type { T_ChunkOpts } from "./chunkBuffers"
import {
    MAIN_CLUSTERS_PER_CHUNK, MAIN_CLUSTER_ROOMS_MIN, MAIN_CLUSTER_ROOMS_MAX, BRANCH_CLUSTER_ROOMS_MIN, BRANCH_CLUSTER_ROOMS_MAX,
    BRANCH_CHANCE, BRANCH_DEPTH, HEADING_SPREAD,
    TUNNEL_LENGTH_MIN, TUNNEL_LENGTH_MAX, TUNNEL_FLAT_LENGTH, TUNNEL_SLOPE_MAX, LEVEL_STEP_MIN, LEVEL_STEP_MAX,
    ROOM_HEIGHT_ADD, PORTAL_HEIGHT_MIN, HEIGHT_SPREAD, ROOM_SCALE_MIN, ROOM_SCALE_MAX, PILASTER_CHANCE, TUNNEL_CEILING_RISE, CLEARANCE, PLAYER_LIFT,
} from "../constants/CONSTANTS"
import { portalHeightFor } from "geometry/05_room00/room00"

type T_Chunk = {
    origin: A3,                // мировое положение pos куска: середина дыры входа первой комнаты, земля под её полом
    opts: T_ChunkOpts,         // опции complex02 в координатах относительно origin
    layout: T_Complex02Layout, // раскладка тех же опций — где комнаты и куда ведёт выход
}

// План бесконечного уровня: куски complex02 один за другим. Кусок k — главный путь по +x из групп смежных комнат,
// между группами — туннели с перепадами, вбок — тупиковые отростки; туннель выхода последней группы ведёт в точку,
// где стоит вход первой группы куска k + 1 (его origin).
// Куски сочиняются по порядку и запоминаются: кусок, построенный заново, выходит тем же. Каждый следующий
// обходит занятое двумя предыдущими (obstacles), поэтому куски не налезают друг на друга.
//
// Высоты, стены, пилястры — общие для всего уровня; своё у куска — зерно раскладки и оттенок.
export class LevelPlan {
    private _chunks: T_Chunk[] = []
    private _common: T_ChunkOpts

    constructor () {
        const rand = (min: number, max: number) => min + Math.random() * (max - min)
        const base = randomComplexOpts()
        // портал не ниже PORTAL_HEIGHT_MIN; комната выше — пока portalHeightFor не перестанет его срезать
        const portalHeight = Math.max(base.portalHeight ?? 0, PORTAL_HEIGHT_MIN)
        let height = (base.height ?? 0) + ROOM_HEIGHT_ADD
        while (portalHeightFor(base.pilaster ?? {}, height, base.profileHeight ?? 0, portalHeight) < portalHeight - 1e-6) height += .1
        this._common = {
            forwardHeading: 0,
            headingSpread: HEADING_SPREAD,
            mainClusterCount: MAIN_CLUSTERS_PER_CHUNK,
            mainRoomsMin: MAIN_CLUSTER_ROOMS_MIN,
            mainRoomsMax: MAIN_CLUSTER_ROOMS_MAX,
            branchRoomsMin: BRANCH_CLUSTER_ROOMS_MIN,
            branchRoomsMax: BRANCH_CLUSTER_ROOMS_MAX,
            branchChance: BRANCH_CHANCE,
            branchDepth: BRANCH_DEPTH,
            exitTunnel: true,
            clearance: CLEARANCE,
            tunnelLengthMin: TUNNEL_LENGTH_MIN,
            tunnelLengthMax: TUNNEL_LENGTH_MAX,
            levelStepMin: LEVEL_STEP_MIN,
            levelStepMax: LEVEL_STEP_MAX,
            tunnelSlopeMax: TUNNEL_SLOPE_MAX,
            tunnelFlatLength: TUNNEL_FLAT_LENGTH,
            tunnelCeilingRise: TUNNEL_CEILING_RISE,
            colorTunnel: [rand(.2, .85), rand(.2, .8), rand(.3, .85)],
            portalWidth: base.portalWidth,
            height,
            heightSpread: HEIGHT_SPREAD,
            roomScaleMin: ROOM_SCALE_MIN,
            roomScaleMax: ROOM_SCALE_MAX,
            wallThickness: base.wallThickness,
            floorThickness: base.floorThickness,
            ceilingThickness: base.ceilingThickness,
            profileHeight: base.profileHeight,
            portalHeight,
            pilaster: base.pilaster,
            // шаг пилястр не ноль: есть ли они у группы, решает PILASTER_CHANCE
            pilasterSpacing: base.pilasterSpacing || rand(2.5, 6),
            pilasterChance: PILASTER_CHANCE,
            pilasterWidth: base.pilasterWidth,
            pilasterProtrusion: base.pilasterProtrusion,
            aoLength: base.aoLength,
            colorWall: base.colorWall,
        }
    }

    chunkAt (index: number): T_Chunk {
        const rand = (min: number, max: number) => min + Math.random() * (max - min)
        while (this._chunks.length <= index) {
            const k = this._chunks.length
            const previous = this._chunks[k - 1]
            const end = previous?.layout.end
            const origin: A3 = previous && end
                ? [previous.origin[0] + end.point[0], previous.origin[1] + end.point[1], previous.origin[2] + end.point[2]]
                : [0, 0, 0]
            // занятое двумя предыдущими кусками — в координатах этого куска
            const obstacles: A2[][] = this._chunks.slice(Math.max(0, k - 2)).flatMap(chunk =>
                chunk.layout.outlines.map(outline => outline.map(([x, z]): A2 =>
                    [x + chunk.origin[0] - origin[0], z + chunk.origin[2] - origin[2]])))
            const opts: T_ChunkOpts = {
                ...this._common,
                pos: [0, 0, 0],
                heading: end?.heading ?? 0,
                seed: Math.floor(Math.random() * 1e9),
                entryHole: k > 0,
                obstacles,
                tint: [rand(.6, .9), rand(.7, .95), 1],
            }
            // выход встаёт всегда, кроме совсем безвыходной раскладки — тогда другое зерно
            let layout = layoutComplex02(opts)
            for (let attempt = 0; !layout.end && attempt < 10; ++attempt) {
                opts.seed = Math.floor(Math.random() * 1e9)
                layout = layoutComplex02(opts)
            }
            this._chunks.push({ origin, opts, layout })
        }
        return this._chunks[index]
    }

    // середины комнат куска в мире, x и z
    roomCentersAt (index: number): A2[] {
        const { origin, layout } = this.chunkAt(index)
        return layout.clusters.flatMap(cluster => cluster.roomCenters)
            .map(([x, z]): A2 => [origin[0] + x, origin[2] + z])
    }

    // куда ставить игрока в куске: середина комнаты входа первой группы, над полом
    spawnAt (index: number): A3 {
        const { origin, layout, opts } = this.chunkAt(index)
        const cluster = layout.clusters[0]
        const center = cluster?.roomCenters[cluster.entryRoom] ?? [0, 0]
        return [origin[0] + center[0], origin[1] + (cluster?.level ?? 0) + (opts.floorThickness ?? 0) + PLAYER_LIFT, origin[2] + center[1]]
    }

    // самый низкий пол куска в мире
    lowestFloorAt (index: number): number {
        const { origin, layout } = this.chunkAt(index)
        return origin[1] + Math.min(0, ...layout.clusters.map(cluster => cluster.level))
    }
}

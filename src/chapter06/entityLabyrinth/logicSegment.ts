import { SegmentType, IArea, TSchemeElem, ILevelConf, TLabData } from "../types/GeomTypes";
import { _M } from "../geometry/_m";
import * as THREE from "three";

export const calcDataAreas = (scheme: TSchemeElem[], conf: ILevelConf): TLabData => {

    const areasData: IArea[] = []
    const positionsEnergy: THREE.Vector3[] = []
    const positionsAntigravs: THREE.Vector3[] = []

    let countHouses00 = 0
    let countHouses01 = 0

    for (let i = 0; i < scheme.length; ++i) {
        try {
            const area = _M.area(scheme[i].area)
            const center = _M.center(scheme[i].area) 
            let typeSegment = SegmentType.HOUSE_00
            if (Math.random() < .2) {
                typeSegment = SegmentType.HOUSE_01
            }
            if (Math.random() < .05) {
                typeSegment = SegmentType.AREA_00
            }
            if (typeSegment === SegmentType.HOUSE_01) {
                ++countHouses01
            }
            if (typeSegment === SegmentType.HOUSE_00) {
                ++countHouses00
            }

            areasData.push({
                center,
                area,
                perimeter: scheme[i].area,
                perimeterInner: scheme[i].offset,
                typeSegment,
            })
        } catch (e) {
            console.error('[ERROR:] CALCULATE AREAS', e)
        }
    }

    if (countHouses00 > 2 && countHouses01 === 0) {
        const random = Math.floor(Math.random() * areasData.length)
        areasData[random].typeSegment = SegmentType.HOUSE_01
        ++countHouses01
    }

    if (
        (countHouses01 < 1 || countHouses00 < 3) ||
        conf.isSetForceAntigravNearLastPortal
    ) {
        const pos = new THREE.Vector3().fromArray([conf.positionTeleporter[0], .1, conf.positionTeleporter[1]])
        pos.z += 10
        positionsAntigravs.push(new THREE.Vector3().copy(pos))
        pos.y += 10
        positionsEnergy.push(new THREE.Vector3().copy(pos))
    }

    for (let i = 0; i < areasData.length; ++i) {
        try {
            const { center, typeSegment } = areasData[i]
            for (let j = 0; j < conf.repeats.length; ++j) {
                const offset = conf.repeats[j]
                if (typeSegment === SegmentType.HOUSE_00) {
                    positionsEnergy.push(new THREE.Vector3(center[0] + offset[0], .1, center[1] + offset[1]))
                } else if (typeSegment === SegmentType.HOUSE_01) {
                    positionsAntigravs.push(new THREE.Vector3(center[0] + offset[0], .1, center[1] + offset[1]))
                }
            }
        } catch (e) {
            console.error('[ERROR:] CALCULATE POSITION ENERGY/ANTIGRAVS', e)
        }
    }

    return {
        areasData,
        positionsEnergy,
        positionsAntigravs,
    }
}

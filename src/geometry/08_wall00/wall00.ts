import { _GM, type IBuffersGeom, type A2, type A3 } from "_CORE/_M/_gm"
import { RECT_MASONRY } from "atlases/atlas00/atlas00"
import { RECT_AO_NONE, RECT_AO_TOP } from "atlases/atlasAo00/atlasAo00"

// Плоская вертикальная стена из каменной кладки (тайл RECT_MASONRY атласа atlas00).
//
// В плане — отрезок от start до end относительно pos, по высоте — от pos[1] до pos[1] + height. Лицо смотрит
// вправо от хода start → end, по нормали (−dz, dx), как у всех фабрик вдоль пути: идёт против часовой стрелки
// сверху — лицо наружу, по часовой — внутрь контура.
//
// Тайл не растягивается: кладка повторяется квадратами tileSize × tileSize метров, стена режется на ячейки
// по линиям сетки тайла, у крайних ячеек берётся только часть тайла. Начало сетки сдвигается tileOffsetX
// (вдоль стены от start) и tileOffsetY (вверх от низа) — так соседние куски одной стены (по бокам и над проёмом)
// продолжают одну и ту же кладку.
//
// uv2 — atlasAo00: тень полосой aoLength у низа (угол с полом или земля) и, если задано, у верха (угол с потолком).
// Полосы режут ячейки по высоте, поэтому тень у любого куска одной ширины.

type T = {
    pos?: A3,           // начало координат start и end; pos[1] — низ стены
    start?: A2,         // начало отрезка в плане [x, z]
    end?: A2,           // конец отрезка в плане [x, z]
    height?: number,    // высота стены
    tileSize?: number,  // сторона одного тайла кладки в метрах
    tileOffsetX?: number, // где по сетке тайла стоит start: расстояние от начала сетки вдоль стены
    tileOffsetY?: number, // где по сетке тайла стоит низ стены: расстояние от начала сетки вверх
    shadowBottom?: boolean, // тень у низа — угол с полом или примыкание к земле
    shadowTop?: boolean,    // тень у верха — угол с потолком
    // длина, на которую растягивается тайл тени от ребра; видимая тень — примерно её четверть
    aoLength?: number,
    // базовый цвет до запечённого освещения; умножается на тайл атласа
    colorWall?: A3,
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    // слева направо — лицо смотрит на зрителя (+z)
    start: [-3, 0],
    end: [3, 0],
    height: 4,
    tileSize: 1.2,
    tileOffsetX: 0,
    tileOffsetY: 0,
    shadowBottom: true,
    shadowTop: false,
    aoLength: .5,
    colorWall: [.8, .73, .74],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const angle = rand(0, Math.PI * 2)
    const length = rand(.3, 12)
    const startX = rand(-2, 2), startZ = rand(-2, 2)
    return {
        start: [startX, startZ],
        end: [startX + Math.cos(angle) * length, startZ + Math.sin(angle) * length],
        height: rand(.2, 8),
        tileSize: rand(.5, 2),
        tileOffsetX: rand(-5, 5),
        tileOffsetY: rand(-5, 5),
        shadowBottom: Math.random() < .8,
        shadowTop: Math.random() < .3,
        aoLength: rand(.3, .7),
        //colorWall: [rand(.72, .88), rand(.66, .8), rand(.66, .82)],
        colorWall: [0, 0, 0],
    }
}

// Точки разреза отрезка [0, length] по линиям сетки шага tileSize, сдвинутой на offset, плюс дополнительные
// разрезы extraCuts; по возрастанию, без повторов, с обоими концами
const cutsAlong = (length: number, tileSize: number, offset: number, extraCuts: number[] = []): number[] => {
    const cuts = [0, length, ...extraCuts.filter(cut => cut > 0 && cut < length)]
    // первая линия сетки после 0: координата в сетке offset + distance кратна tileSize
    for (let distance = (Math.floor(offset / tileSize) + 1) * tileSize - offset; distance < length; distance += tileSize) {
        cuts.push(distance)
    }
    cuts.sort((a, b) => a - b)
    return cuts.filter((cut, i) => i === 0 || cut - cuts[i - 1] > 1e-6)
}

export const wall00 = (opts: T = {}): IBuffersGeom => {
    const o: Required<T> = { ...DEFAULT_OPTS, ...opts }
    const { pos, start, end, tileOffsetX, tileOffsetY, shadowBottom, shadowTop, colorWall } = o
    const height = Math.max(0, o.height)
    const tileSize = Math.max(.05, o.tileSize)
    const aoLength = Math.max(1e-3, o.aoLength)

    const builder = _GM.createGeomBuilder()
    const { quad, collideQuad } = builder

    const length = Math.hypot(end[0] - start[0], end[1] - start[1])
    if (length < 1e-6 || height < 1e-6) return builder.g
    const direction: A2 = [(end[0] - start[0]) / length, (end[1] - start[1]) / length]
    // лицо — вправо от хода
    const outwardNormal: A3 = [-direction[1], 0, direction[0]]
    // точка стены: distance вдоль от start, y — над низом
    const pointAt = (distance: number, y: number): A3 =>
        [pos[0] + start[0] + direction[0] * distance, pos[1] + y, pos[2] + start[1] + direction[1] * distance]

    // ---- тень: полоса aoLength у затеняющего ребра; при тени с обеих сторон полосы не шире половины стены

    const bandHeight = shadowBottom && shadowTop ? Math.min(aoLength, height / 2) : Math.min(aoLength, height)
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    // uv2 на высоте y ячейки: тень у верхнего края тайла AO_TOP — у самого ребра, к краю полосы сходит на нет.
    // Полосу выбирает середина ячейки: ячейки не пересекают границ полос, а uv2 треугольника должен лежать
    // в одном тайле AO
    const aoUvInCell = (y: number, cellMiddle: number): A2 => {
        if (shadowBottom && cellMiddle < bandHeight) return _GM.rectPoint(RECT_AO_TOP, .5, clamp01(1 - y / aoLength))
        if (shadowTop && cellMiddle > height - bandHeight) return _GM.rectPoint(RECT_AO_TOP, .5, clamp01(1 - (height - y) / aoLength))
        return _GM.rectPoint(RECT_AO_NONE, .5, .5)
    }

    // ---- ячейки: разрезы по сетке тайла и по границам полос тени

    const bandCuts: number[] = []
    if (shadowBottom) bandCuts.push(bandHeight)
    if (shadowTop) bandCuts.push(height - bandHeight)
    const columnCuts = cutsAlong(length, tileSize, tileOffsetX)
    const rowCuts = cutsAlong(height, tileSize, tileOffsetY, bandCuts)

    // доли тайла у краёв отрезка [from, to]: номер тайла — по середине ячейки, чтобы край на линии сетки дал 0 или 1
    const tileFractions = (from: number, to: number, offset: number): A2 => {
        const tileIndex = Math.floor((offset + (from + to) / 2) / tileSize)
        return [
            clamp01((offset + from) / tileSize - tileIndex),
            clamp01((offset + to) / tileSize - tileIndex),
        ]
    }

    for (let row = 0; row < rowCuts.length - 1; ++row) {
        const yFrom = rowCuts[row], yTo = rowCuts[row + 1]
        const [fractionBottom, fractionTop] = tileFractions(yFrom, yTo, tileOffsetY)
        const middleY = (yFrom + yTo) / 2
        const aoBottom = aoUvInCell(yFrom, middleY), aoTop = aoUvInCell(yTo, middleY)
        for (let column = 0; column < columnCuts.length - 1; ++column) {
            const distanceFrom = columnCuts[column], distanceTo = columnCuts[column + 1]
            const [fractionLeft, fractionRight] = tileFractions(distanceFrom, distanceTo, tileOffsetX)
            quad(
                pointAt(distanceFrom, yFrom), pointAt(distanceTo, yFrom), pointAt(distanceTo, yTo), pointAt(distanceFrom, yTo),
                outwardNormal,
                [
                    ..._GM.rectPoint(RECT_MASONRY, fractionLeft, fractionBottom), ..._GM.rectPoint(RECT_MASONRY, fractionRight, fractionBottom),
                    ..._GM.rectPoint(RECT_MASONRY, fractionRight, fractionTop), ..._GM.rectPoint(RECT_MASONRY, fractionLeft, fractionTop),
                ],
                [...aoBottom, ...aoBottom, ...aoTop, ...aoTop],
                colorWall,
            )
        }
    }

    // прокси — один квад на всю стену
    collideQuad(pointAt(0, 0), pointAt(length, 0), pointAt(length, height), pointAt(0, height))

    return builder.g
}

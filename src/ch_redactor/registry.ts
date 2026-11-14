import type { IBuffersGeom } from '_CORE/_M/_gm'

import * as floor00 from 'geometry/00_floor00/floor00'
import * as floor01 from 'geometry/00_floor01/floor01'
import * as pilaster00 from 'geometry/01_pilaster00/pilaster00'
import * as portal00 from 'geometry/02_portal00/portal00'
import * as lintel00 from 'geometry/03_lintel00/lintel00'
import * as stairs00 from 'geometry/07_stairs00/stairs00'
import * as stairs01 from 'geometry/07_stairs01/stairs01'
//import stairs01Ref from 'geometry/07_stairs01/ref.jpg'

// Фабрики, которые можно открыть на стенде. Новая фабрика src/geometry добавляется сюда одной записью.
// Панель строит инпуты по форме defaultOpts: числа, булевы, строки, массивы чисел (pos, цвета),
// массивы объектов (stairs) — с добавлением и удалением элементов.

export type T_Opts = Record<string, unknown>

export type T_GeomEntry = {
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    factory: (opts?: any) => IBuffersGeom,
    randomOpts: () => T_Opts,
    // полный набор опций: из него строится панель; randomOpts накладывается поверх
    defaultOpts: T_Opts,
    // референс-картинка, ставится за одиночным примером
    ref?: string,
}

export const GEOM_REGISTRY: T_GeomEntry[] = [
    {
        name: 'floor00',
        factory: floor00.floor00,
        randomOpts: floor00.randomOpts,
        defaultOpts: floor00.DEFAULT_OPTS,
    },
    {
        name: 'floor01',
        factory: floor01.floor01,
        randomOpts: floor01.randomOpts,
        defaultOpts: floor01.DEFAULT_OPTS,
    },
    {
        name: 'pilaster00',
        factory: pilaster00.pilaster00,
        randomOpts: pilaster00.randomOpts,
        defaultOpts: pilaster00.DEFAULT_OPTS,
    },
    {
        name: 'portal00',
        factory: portal00.portal00,
        randomOpts: portal00.randomOpts,
        defaultOpts: portal00.DEFAULT_OPTS,
    },
    {
        name: 'lintel00',
        factory: lintel00.lintel00,
        randomOpts: lintel00.randomOpts,
        defaultOpts: lintel00.DEFAULT_OPTS,
    },
    {
        name: 'stairs00',
        factory: stairs00.stairs00,
        randomOpts: stairs00.randomOpts,
        defaultOpts: stairs00.DEFAULT_OPTS,
    },
    {
        name: 'stairs01',
        factory: stairs01.stairs01,
        randomOpts: stairs01.randomOpts,
        defaultOpts: stairs01.DEFAULT_OPTS,
    },
]

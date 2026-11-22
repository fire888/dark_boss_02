import type { IBuffersGeom } from '_CORE/_M/_gm'

import * as floor00 from 'geometry/00_floor00/floor00'
import * as floor01 from 'geometry/00_floor01/floor01'
import * as pilaster00 from 'geometry/01_pilaster00/pilaster00'
import * as portal00 from 'geometry/02_portal00/portal00'
import * as lintel00 from 'geometry/03_lintel00/lintel00'
import * as profile00 from 'geometry/04_profile00/profile00'
import * as room00 from 'geometry/05_room00/room00'
import * as room01 from 'geometry/05_room01/room01'
import * as complex00 from 'geometry/06_complex00/complex00'
import * as complex01 from 'geometry/06_complex01/complex01'
import * as complex02 from 'geometry/06_complex02/complex02'
import * as stairs00 from 'geometry/07_stairs00/stairs00'
import * as stairs01 from 'geometry/07_stairs01/stairs01'
import * as wall00 from 'geometry/08_wall00/wall00'
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
    // без сетки 20 случайных вариантов позади — только одиночный пример (большие фабрики)
    noGrid?: boolean,
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
        name: 'profile00',
        factory: profile00.profile00,
        randomOpts: profile00.randomOpts,
        defaultOpts: profile00.DEFAULT_OPTS,
    },
    {
        name: 'room00',
        factory: room00.room00,
        randomOpts: room00.randomOpts,
        defaultOpts: room00.DEFAULT_OPTS,
    },
    {
        name: 'room01',
        factory: room01.room01,
        randomOpts: room01.randomOpts,
        defaultOpts: room01.DEFAULT_OPTS,
    },
    {
        name: 'complex00',
        factory: complex00.complex00,
        randomOpts: complex00.randomOpts,
        defaultOpts: complex00.DEFAULT_OPTS,
        noGrid: true,
    },
    {
        name: 'complex01',
        factory: complex01.complex01,
        randomOpts: complex01.randomOpts,
        defaultOpts: complex01.DEFAULT_OPTS,
        noGrid: true,
    },
    {
        name: 'complex02',
        factory: complex02.complex02,
        randomOpts: complex02.randomOpts,
        defaultOpts: complex02.DEFAULT_OPTS,
        noGrid: true,
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
    {
        name: 'wall00',
        factory: wall00.wall00,
        randomOpts: wall00.randomOpts,
        defaultOpts: wall00.DEFAULT_OPTS,
    },
]

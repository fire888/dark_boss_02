import type { IBuffersGeom } from '_CORE/_M/_gm'

import * as stairs00 from 'geometry/07_stairs00/stairs00'
import stairs00Ref from 'geometry/07_stairs00/ref.jpg'

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
        name: 'stairs00',
        factory: stairs00.stairs00,
        randomOpts: stairs00.randomOpts,
        defaultOpts: stairs00.DEFAULT_OPTS,
        ref: stairs00Ref,
    },
]

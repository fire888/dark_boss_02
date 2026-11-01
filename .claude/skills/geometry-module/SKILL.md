---
name: geometry-module
description: Use when creating or editing a geometry factory in src/geometry (indexed, reference — 07_stairs00) — building vertex/uv/uv2/color/index arrays, baking lighting into vertex colors, picking atlas and AO tiles, adding a vCollide proxy, or verifying the result with check:geom.
---

# Модуль геометрии

Процедура авторинга фабрики в `src/geometry`, возвращающей линейные массивы координат.

| | |
|---|---|
| путь | `src/geometry/<NN_имя>/<имя>.ts` |
| экспорт | `<имя>` (по имени файла) |
| сигнатура | `(opts: T = {})`, `DEFAULT_OPTS: Required<T>` |
| возврат | `IArraysGeom` — `{ index, v, uv, uv2, c, vCollide }`, все шесть обязательны |
| квад | 4 вершины + 6 индексов |
| `uv` | `atlases/atlas00/atlas00` — `UV_*_Q`, `rectPoint(RECT_*)` |
| `uv2` | `atlases/atlasAo00/atlasAo00` — затенение углов |
| `c` | запечённый свет `lit(base, nrm)` |
| эталон | **`07_stairs00/stairs00.ts`** |

Типы — из `_CORE/_M/_m`, с пометкой `type`.

## Порядок

1. **Прочитать эталон** — целиком `src/geometry/07_stairs00/stairs00.ts`: от него берутся
   хелперы `quad`/`fanTri`/`facesTo`/`lit`, раскладка AO и прокси. Старые модули в `src/_00trash_geometry`
   написаны по устаревшим правилам, из них ничего не брать.
2. **Написать фабрику** по шаблону ниже.
3. **Проверить**: `npm run check:geom -- <путь-к-модулю>` — фабрика находится по имени файла.
4. **Чинить до зелёного.** Не сообщать о готовности, пока валидатор не отдаст PASS.

## Шаблон — выжимка из stairs00

```ts
import { _M, type IArraysGeom, type A3 } from "_CORE/_M/_m"
import { flipUvQ } from "atlases/atlasTools"
import { UV_GRAY_Q, UV_MOSS_Q } from "atlases/atlas00/atlas00"
import { UV_AO_NONE_Q, UV_AO_TOP_Q } from "atlases/atlasAo00/atlasAo00"

type T = {
    pos?: A3,
    w?: number, h?: number, d?: number,
    col?: A3,       // базовый цвет до запечённого освещения; умножается на тайл атласа
}

// запечённый свет: ламберт от одного «солнца» плюс заполняющий
const LIGHT: A3 = (() => {
    const l: A3 = [.6, .7, .45]
    const len = Math.hypot(...l)
    return [l[0] / len, l[1] / len, l[2] / len]
})()
const AMBIENT = .4
const DIFFUSE = .6

const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    w: 2, h: 3, d: 2,
    col: [.95, .8, .58],
}

export const thing00 = (opts: T = {}): IArraysGeom => {
    const { pos, w, h, d, col }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const index: number[] = []
    const v: number[] = []
    const uv: number[] = []
    const uv2: number[] = []
    const c: number[] = []
    const vCollide: number[] = []

    const TYPE = Math.random() < .5 ? 'STONE' : 'MOSS'
    const uvMain = TYPE === 'STONE' ? UV_GRAY_Q : UV_MOSS_Q

    // тень верха тайла AO_TOP: прямо — на ребре cc, dd, перевёрнуто — на a, b
    const AO_CD = UV_AO_TOP_Q
    const AO_AB = flipUvQ(UV_AO_TOP_Q)

    const P = (x: number, y: number, z: number): A3 => [pos[0] + x, pos[1] + y, pos[2] + z]

    const facesTo = (a: A3, b: A3, dd: A3, nHint: A3) => {
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
        const e2 = [dd[0] - a[0], dd[1] - a[1], dd[2] - a[2]]
        const nx = e1[1] * e2[2] - e1[2] * e2[1]
        const ny = e1[2] * e2[0] - e1[0] * e2[2]
        const nz = e1[0] * e2[1] - e1[1] * e2[0]
        return nx * nHint[0] + ny * nHint[1] + nz * nHint[2] >= 0
    }

    const lit = (base: A3, nrm: A3): number[] => {
        const k = AMBIENT + DIFFUSE * Math.max(0, nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2])
        return [Math.min(1, base[0] * k), Math.min(1, base[1] * k), Math.min(1, base[2] * k)]
    }

    // квад a -> b -> cc -> dd по контуру: a, b — низ тайла, cc, dd — верх; своя четвёрка вершин на грань.
    // При смене обхода b и dd меняются местами вместе со своими uv, иначе AO ляжет транспонированным
    const quad = (a: A3, b: A3, cc: A3, dd: A3, nHint: A3, uvQ: number[], uv2Q: number[], base: A3) => {
        let pts = [a, b, cc, dd]
        let order = [0, 1, 2, 3]
        if (!facesTo(a, b, cc, nHint)) {
            pts = [a, dd, cc, b]
            order = [0, 3, 2, 1]
        }
        const ind = v.length / 3                       // считать ДО push в v
        for (let k = 0; k < 4; ++k) {
            const o = order[k]
            v.push(...pts[k])
            uv.push(uvQ[o * 2], uvQ[o * 2 + 1])
            uv2.push(uv2Q[o * 2], uv2Q[o * 2 + 1])
            c.push(...lit(base, nHint))
        }
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)
    }

    // передняя стенка: тень внизу, в углу с землёй
    quad(P(0, 0, d), P(w, 0, d), P(w, h, d), P(0, h, d), [0, 0, 1], uvMain, AO_AB, col)
    // крыша: открыта
    quad(P(0, h, d), P(w, h, d), P(w, h, 0), P(0, h, 0), [0, 1, 0], uvMain, UV_AO_NONE_Q, col)

    // прокси — triangle soup без index, 18 чисел на квад, проще рендер-геометрии
    vCollide.push(..._M.createPolygon(P(0, 0, d), P(w, 0, d), P(w, h, d), P(0, h, d)))

    return { index, v, uv, uv2, c, vCollide }
}
```

Шаблон — сокращение. Чего в нём нет, а в stairs00 есть и нужно повторять, когда форма того требует:

- **изогнутая поверхность** — `quad(..., nrmAt)`, где `nrmAt(p)` даёт нормаль в самой вершине
  (`radOut`/`radIn`); свет меняется вдоль дуги плавно, геометрия при этом остаётся плоскими квадами;
- **неквадная грань** — `fanTri`: веер из центра, своя тройка вершин на треугольник, `uv` — плоская проекция
  через `rectPoint(RECT_*, s, q)` с зажатыми `s, q`, `uv2` — `rectPoint(RECT_AO_TOP, .5, q)` по радиусу;
- **прокси со своим шагом** (`arcStepCollide`) и упрощённой формой: пандус вместо ступеней, без торцов.

Каждая грань — один вызов хелпера, где push-и в `v`, `uv`, `uv2`, `c`, `index` идут вместе.
Отдельный `v.push` мимо хелпера — самый частый источник рассинхрона, его ловит `check:geom`.

**Склейка** — `_M.mergeIndexedArrays(target, part)`; массив дописывается, только если он есть у обоих,
поэтому `target = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }`. Сдвиг части —
`_M.translateVertices` по `v` и отдельно по `vCollide`.

## Ключевые числа

| | квад | треугольная грань |
|---|---|---|
| `v` | **12** | 9 |
| `c` | **12** (`lit` × 4) | 9 |
| `uv` | **8** (`UV_*_Q`) | 6 |
| `uv2` | **8** (`UV_AO_*_Q`) | 6 |
| `index` | **6** | 3 |
| `vCollide` | 18 — прокси всегда без индекса | 9 |

## Атласы

`atlases/atlasTools`: `tileRect`, `rectUvQ` (8: a, b — низ, c, d — верх), `flipUvQ`, `rectPoint`.

- `atlas00` (цвет, `512.jpg`, сетка 64 px): `WHITE`, `MOSS`, `RED` (2:1), `GRAY`, `GRAY_WIDE` (2:1).
  Тайлы нейтральные, оттенок даёт `c`.
- `atlasAo00` (затенение, `512Ao.jpg`): `AO_NONE`, `AO_TOP` (тень по верхнему краю — угол с одной стороны),
  `AO_TOP_BOTTOM`, `AO_ROUND`.

Для каждого — `RECT_*`, `UV_*`, `UV_*_Q`; в модуль идут только `_Q` и `rectPoint`. Правило выбора `uv2`:
грань, упирающаяся ребром во внутренний угол, получает `AO_TOP`, повёрнутый тенью к этому ребру
(`UV_AO_TOP_Q` — к cc, dd; `flipUvQ(...)` — к a, b); открытая грань — `AO_NONE`.
Новый тайл — дорисовать его в jpg и добавить тройку `RECT_*`/`UV_*`/`UV_*_Q`.
Сырые uv вне `RECT_*` `check:geom` отвергнет.

## Коллизия

`vCollide` — упрощённый прокси, по которому ходит игрок, а не копия рендер-меша.
У stairs00 это веер площадки, стенка с двух сторон и пандус на месте каждой лестницы, с шагом дуги
вчетверо грубее рендерного. Длина кратна 9, индекса у прокси нет.
Если объект декоративный и сквозь него можно проходить — вернуть пустой массив, но вернуть.

## Чек-лист перед сдачей

- [ ] `check:geom` → PASS
- [ ] `npx tsc --noEmit` не добавил ошибок
- [ ] импорты типов помечены `type`, типы — из `_CORE/_M/_m`, не из `geometry/GeomTypes`
- [ ] нет `Mesh`/`Material`/`Texture`/DOM — фабрика исполняется в Web Worker
- [ ] `uv` — из `atlas00`, `uv2` — из `atlasAo00`, новых сырых координат нет
- [ ] `c` — запечённый свет от нормали грани (изогнутые — от нормали в вершине)
- [ ] внутренние углы затенены через `uv2`, тень повёрнута к нужному ребру
- [ ] вершины не сварены между гранями (внутри плоского квада — допустимо)
- [ ] обход граней задан нормалью-подсказкой, а подсказка смотрит наружу — проверить глазами,
      валидатор этого не видит
- [ ] `vCollide` упрощён относительно рендер-геометрии

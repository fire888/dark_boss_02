---
name: geometry-module
description: Use when creating or editing a geometry factory in src/chapter10/geometry (non-indexed) or src/geometry (indexed) — building vertex/uv/color/index arrays, picking atlas tiles, adding a vCollide proxy, or verifying the result with check:geom.
---

# Модуль геометрии

Процедура авторинга фабрики, возвращающей линейные массивы координат.

**Сначала определи режим по пути модуля** — числа в них разные:

| | chapter10 — неиндексированный | `src/geometry` — индексированный |
|---|---|---|
| путь | `src/chapter10/geometry/<имя>/<имя>.ts` | `src/geometry/<NN_имя>/<имя>.ts` |
| экспорт | `create<Имя>` | `<имя>` (по имени файла) |
| сигнатура | позиционные аргументы с дефолтами | один объект опций + `DEFAULT_OPTS` |
| возврат | `IArrayForBuffers` | `IArraysGeom` — `{ index, v, uv, c, vCollide }`, все пять обязательны |
| квад | 6 вершин | 4 вершины + 6 индексов |
| атлас | `../tileMapWall` | `atlases/atlas00/atlas00`, константы `_Q` |

Оба типа — из `_CORE/_M/_m`, с пометкой `type`.

## Порядок

1. **Прочитать соседа.** chapter10: `tree00` (ствол + крона), `column02` (тело вращения + `vCollide`),
   `arc00` (арка), `helix00`/`helix01` (спираль), `platform00` (композиция из подгенераторов).
   `src/geometry`: `04_tunnel01`, `05_room00` — только как образец раскладки граней и прокси;
   их импорты (`geometry/GeomTypes`, `geometry/atlasUv`) устарели, остальные модули папки
   написаны по старому правилу целиком. Взять стиль, а не изобретать свой.
2. **Определить сигнатуру** по таблице выше. В chapter10 один типизированный объект допустим,
   если параметров много или они приходят из описателя сегмента (`T_ROOM`, `T_Floor`).
3. **Написать фабрику** по шаблону своего режима.
4. **Проверить**:
   - chapter10: `npm run check:geom -- src/chapter10/geometry/<имя>/<имя>.ts`
   - `src/geometry`: `npm run check:geom -- src/geometry/<NN_имя>/<имя>.ts <имя>` — имя экспорта
     обязательно, автоподбор ищет только `create*`.
5. **Чинить до зелёного.** Не сообщать о готовности, пока валидатор не отдаст PASS.

## Шаблон chapter10 (неиндексированный)

```ts
import { _M, type IArrayForBuffers } from "_CORE/_M/_m"
import * as THREE from "three"
import { UV_EMPTY, UV_POINTS, COL_WHITE, COL_RED } from "../tileMapWall"

export const createThing = (w: number = 1, h: number = 2): IArrayForBuffers => {
    const v: number[] = []
    const c: number[] = []
    const uv: number[] = []
    const vCollide: number[] = []

    // одно семейство текстур на инстанс, вариации — внутри него
    const TYPE = Math.random() < .5 ? 'GRID' : 'DARK'

    {
        const _v = _M.createPolygonV(p0, p1, p2, p3)   // 18 чисел
        v.push(..._v)
        c.push(...COL_WHITE)                            // 18 чисел
        uv.push(...(TYPE === 'GRID' ? UV_EMPTY : UV_POINTS))  // 12 чисел
    }

    vCollide.push(..._M.createPolygon([0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0]))

    return { v, c, uv, vCollide }
}
```

## Шаблон `src/geometry` (индексированный)

```ts
import { _M, type IArraysGeom, type A3 } from "_CORE/_M/_m"
import { UV_GRID_Q, UV_DARK_Q, COL_WHITE_Q } from "atlases/atlas00/atlas00"

type T = {
    w?: number, h?: number, d?: number,
}

const DEFAULT_OPTS: Required<T> = {
    w: 2, h: 3, d: 2,
}

export const thing00 = (opts: T = {}): IArraysGeom => {
    const { w, h, d }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const index: number[] = []
    const v: number[] = []
    const uv: number[] = []
    const c: number[] = []
    const vCollide: number[] = []

    const TYPE = Math.random() < .5 ? 'GRID' : 'DARK'

    // квад a -> b -> c -> d по контуру; своя четвёрка вершин на каждую грань
    const quad = (a: A3, b: A3, cc: A3, dd: A3, uvQ: number[], colQ: number[]) => {
        const ind = v.length / 3                       // считать ДО push в v
        v.push(...a, ...b, ...cc, ...dd)                // 12 чисел
        uv.push(...uvQ)                                 // 8 чисел
        c.push(...colQ)                                 // 12 чисел
        index.push(ind, ind + 1, ind + 2, ind, ind + 2, ind + 3)   // 6 индексов
    }

    quad([0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0], TYPE === 'GRID' ? UV_GRID_Q : UV_DARK_Q, COL_WHITE_Q)

    // прокси — triangle soup без index, 18 чисел на квад
    vCollide.push(..._M.createPolygon([0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0]))

    return { index, v, uv, c, vCollide }
}
```

В обоих режимах каждая грань — один блок или один вызов, где push-и в `v`, `c`, `uv` (и `index`)
идут вместе и всегда согласованы по длине: пропустить один — самая частая ошибка, её ловит `check:geom`.

**Склейка в индексированном режиме** — `_M.mergeIndexedArrays(target, part)`. Она дописывает массив,
только если он есть у обоих, поэтому `target` заводится со всеми пятью:
`{ index: [], v: [], uv: [], c: [], vCollide: [] }`. Сдвиг `index` считается по `max(index) + 1`,
так что висячая вершина в `part` сломает всё, что приклеится после неё.

## Ключевые числа

| | chapter10 | `src/geometry` |
|---|---|---|
| `v` на квад | **18** (`createPolygon`/`createPolygonV`) | **12** |
| `c` на квад | **18** (`fillColorFace`, `COL_*`) | **12** (`COL_*_Q`) |
| `uv` на квад | **12** (`createUv`, `UV_*`) | **8** (`UV_*_Q`) |
| `index` на квад | — | **6** |
| треугольная грань | 9 `v`, 9 `c`, 6 `uv` | 9 `v`, 9 `c`, 6 `uv`, 3 `index` |
| `vCollide` на квад | 18 | 18 — прокси всегда без индекса |

Для треугольной грани в обоих режимах: `UV_POINTS_TREE` и `COL_BLUE_LIGHT_3`.

## Тайлы атласа

chapter10 (`../tileMapWall`): `UV_EMPTY`, `UV_TRIANGLE`, `UV_POINTS`, `UV_DARK`, `UV_GRID`,
`UV_GRID_CIRCLE`, `UV_HT`, `UV_POINTS_TREE`. Цвета: `COL_WHITE`, `COL_RED`, `COL_BLUE_TOP`,
`COL_BLUE_HIGHT`, `COL_BLUE_LIGHT`, `COL_BLUE_LIGHT_3`, `COL_GREEN_BLUE`.

`src/geometry` (`atlases/atlas00/atlas00`): те же тайлы и цвета с суффиксом `_Q` — `UV_EMPTY_Q` … `UV_HT_Q`,
`COL_WHITE_Q` … `COL_GREEN_BLUE_Q`. Они выводятся из 12/18-числовых, поэтому тайл и цвет совпадают.
12/18-числовые константы в индексированный модуль не класть — длины разойдутся с `v`.

Нужен новый тайл — это **парное изменение**: дорисовать его в `src/chapter10/entities/TexturesCanvas.ts`
(сетка 4×4 по 256 px, свободны две нижние строки) и добавить `UV_*` с координатами того же региона.
В `atlas00` — сразу оба варианта: `UV_*` и `UV_*_Q = quadUv(UV_*)`. Одна половина без другой
даёт пустую или чужую текстуру.

## Коллизия

`vCollide` — упрощённый прокси, по которому ходит игрок, а не копия рендер-меша.
У `column02` это одна плоскость вместо 248 треугольников; у `tunnel01` — цельный короб из четырёх граней,
хотя `v` нарезан на секции. Длина кратна 9, индекса у прокси нет ни в одном режиме.
Если объект декоративный и сквозь него можно проходить — вернуть пустой массив, но вернуть.

## Чек-лист перед сдачей

- [ ] `check:geom` → PASS (для `src/geometry` — с явным именем экспорта)
- [ ] `npx tsc --noEmit` не добавил ошибок
- [ ] импорты типов помечены `type`, типы — из `_CORE/_M/_m`, не из `geometry/GeomTypes`
- [ ] нет `Mesh`/`Material`/`Texture`/DOM — фабрика исполняется в Web Worker
- [ ] `uv` взяты из атласа своего режима, новых сырых координат не появилось
- [ ] вершины не сварены между гранями, каждая грань дублирует свои (внутри квада сварка допустима:
      в `src/geometry` квад — 4 вершины; в chapter10 без `index` она невозможна — квад это 6 вершин)
- [ ] `vCollide` упрощён относительно рендер-геометрии
- [ ] `src/geometry`: в возврате все пять массивов — `check:geom` отсутствие `uv`/`vCollide` не ловит

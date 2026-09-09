---
name: geometry-module
description: Use when creating or editing a geometry factory in src/chapter10/geometry — building vertex/uv/color arrays, picking atlas tiles, adding a vCollide proxy, or verifying the result with check:geom.
---

# Модуль геометрии chapter10

Процедура авторинга фабрики, возвращающей линейные массивы координат.

## Порядок

1. **Прочитать соседа.** Перед написанием открыть уже готовый модуль близкой формы:
   `tree00` (ствол + крона), `column02` (тело вращения + `vCollide`), `arc00` (арка),
   `helix00`/`helix01` (спираль), `platform00` (композиция из подгенераторов).
   Взять оттуда стиль, а не изобретать свой.
2. **Определить сигнатуру.** Позиционные аргументы с дефолтами — основной стиль chapter10
   (`(w = 1, h = 20, n = 8)`). Один типизированный объект — если параметров много
   или они приходят из описателя сегмента (`T_ROOM`, `T_Floor`).
3. **Написать фабрику** по шаблону ниже.
4. **Проверить**: `npm run check:geom -- src/chapter10/geometry/<имя>/<имя>.ts`.
5. **Чинить до зелёного.** Не сообщать о готовности, пока валидатор не отдаст PASS.

## Шаблон

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

Каждый блок `{ ... }` — одна грань. Три push-а идут вместе и всегда согласованы по длине:
пропустить один — самая частая ошибка, её ловит `check:geom`.

## Ключевые числа

`createPolygon`/`createPolygonV` → **18** чисел (6 вершин). `createUv` → **12**. `fillColorFace` → **18**.
Треугольная грань (не квад): 9 чисел `v`, 9 `c`, 6 `uv` — для неё в атласе есть `UV_POINTS_TREE`
и `COL_BLUE_LIGHT_3`.

## Тайлы атласа

Доступны только эти: `UV_EMPTY`, `UV_TRIANGLE`, `UV_POINTS`, `UV_DARK`, `UV_GRID`,
`UV_GRID_CIRCLE`, `UV_HT`, `UV_POINTS_TREE`. Цвета: `COL_WHITE`, `COL_RED`, `COL_BLUE_TOP`,
`COL_BLUE_HIGHT`, `COL_BLUE_LIGHT`, `COL_BLUE_LIGHT_3`, `COL_GREEN_BLUE`.

Нужен новый тайл — это **парное изменение**: дорисовать его в `src/chapter10/entities/TexturesCanvas.ts`
(сетка 4×4 по 256 px, свободны две нижние строки) и добавить `UV_*` в `tileMapWall.ts`
с координатами того же региона. Одна половина без другой даёт пустую или чужую текстуру.

## Коллизия

`vCollide` — упрощённый прокси, по которому ходит игрок, а не копия рендер-меша.
У `column02` это одна плоскость вместо 248 треугольников. Длина кратна 9.
Если объект декоративный и сквозь него можно проходить — вернуть пустой массив.

## Чек-лист перед сдачей

- [ ] `npm run check:geom -- <путь>` → PASS
- [ ] `npx tsc --noEmit` не добавил ошибок
- [ ] импорты типов помечены `type`
- [ ] нет `Mesh`/`Material`/`Texture`/DOM — фабрика исполняется в Web Worker
- [ ] `uv` взяты из `tileMapWall`, новых сырых координат не появилось
- [ ] вершины не сварены, грани дублируют вершины
- [ ] `vCollide` упрощён относительно рендер-геометрии

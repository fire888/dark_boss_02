---
name: geometry-module
description: Use when creating, editing or reviewing a geometry factory in src/geometry (indexed, reference — 07_stairs00) — building faces with _GM.createGeomBuilder, picking atlas and AO tiles, baking lighting into vertex colors, adding a vCollide proxy and randomOpts, or verifying the result with check:geom. The single source of the geometry contract.
---

# Модуль геометрии

Единственный источник контракта фабрик `src/geometry`. `CLAUDE.md` держит только жёсткие правила,
агенты `geometry-*` — только свою роль; всё остальное — здесь. Меняя правило, меняй его здесь.

Фабрик в `src/geometry` будет много, поэтому общее не копируется из модуля в модуль:
сборка граней и свет — в `_GM.createGeomBuilder()`, чего не хватает нескольким фабрикам — дописывается
в `_GM` (`src/_CORE/_M/_gm.ts`) чистой функцией. В модуле остаётся только форма.

| | |
|---|---|
| путь | `src/geometry/<NN_имя>/<имя>.ts`, рядом можно положить `ref.jpg` — референс |
| экспорт | `<имя>` (по имени файла, `stairs00`, а не `createStairs00`), `randomOpts` и `DEFAULT_OPTS` (по нему стенд строит инпуты) |
| сигнатура | `(opts: T = {})`, все поля `T` необязательны, `DEFAULT_OPTS: Required<T>`, `{ ...DEFAULT_OPTS, ...opts }`, положение — `pos: A3` |
| возврат | `IBuffersGeom` — `{ index, v, uv, uv2, c, vCollide }`, все шесть обязательны; `B.g` сборщика |
| грани | `_GM.createGeomBuilder()` — `quad`, `tri`, `collideQuad`, `collideTri` |
| `uv` | `atlases/atlas00/atlas00` — `UV_*_Q`, `_GM.rectPoint(RECT_*)` |
| `uv2` | `atlases/atlasAo00/atlasAo00` — затенение внутренних углов и низа у земли |
| `c` | запечённый свет — считает сборщик от `outwardNormal` или `normalAt` |
| импорт | `import { stairs00 } from 'geometry/07_stairs00/stairs00'` (от `baseUrl: ./src`) |
| эталон | **`07_stairs00/stairs00.ts`** |

`_GM`, `IBuffersGeom`, `A3`, `F_Nrm` — из `_CORE/_M/_gm`, типы с пометкой `type`
(без неё Node не загрузит модуль и `check:geom` не запустится). `_H` (`_CORE/_M/_helpers`) в фабрику не импортировать.
Устаревшее — `_CORE/_M/_m`, `chapterNN/geometry/_m.ts`, `GeomTypes`, `_00trash_geometry/**`: не импортировать,
не копировать, не сверяться.

## Имена и комментарии

Код фабрик и `_GM` читают люди, которые его не писали. Поэтому:

- **Имена развёрнутые, по смыслу**: `radius`, `platformHeight`, `treadDepth`, `pointAt`, `normalOutward`, а не
  `r`, `hP`, `sd`, `P`, `radOut`. Это касается и опций `T` — по ним стенд подписывает ползунки.
  Однобуквенные допустимы только для счётчиков коротких циклов (`i`, `k`) и координат (`x`, `y`, `z`, `dx`).
- Имена массивов `IBuffersGeom` (`v`, `uv`, `uv2`, `c`, `index`, `vCollide`) и экспортов `_GM` — общий
  контракт со старыми главами, их не переименовывать.
- **Комментарий объясняет зачем и что означает**: единицы и систему координат, термин (подступенок,
  проступь, щека), почему стоит ограничение или запас, к какому ребру ложится тень. У каждой опции `T` —
  комментарий, что она задаёт. Пересказывать код словами не нужно.

## Порядок

1. **Прочитать эталон** целиком — `src/geometry/07_stairs00/stairs00.ts`: раскладка граней, AO, прокси, `randomOpts`.
2. **Написать фабрику** по шаблону ниже.
3. **`npm run check:geom -- <путь-к-модулю>`** — фабрика находится по имени файла.
4. **Чинить до зелёного.** Упавший прогон `randomOpts()` воспроизводится строкой `replay: --args=@…` из вывода.
5. **`npx tsc --noEmit`** — 0 ошибок.
6. **Подключить к стенду** — запись в `GEOM_REGISTRY` (`src/ch_redactor/registry.ts`), смотреть — `npm run dev_redactor`
   (обход граней, тени, прокси проверяются только глазами). Устройство стенда — `CLAUDE.md`, «Стенд геометрии».

## Сборщик — `_GM.createGeomBuilder(light?)`

```ts
const builder = _GM.createGeomBuilder()  // необязательно: { light, ambient, diffuse } — по умолчанию общий свет уровня
builder.quad(bottomStart, bottomEnd, topEnd, topStart, outwardNormal, uvQuad, aoUvQuad, baseColor, normalAt?)
                                         // uvQuad, aoUvQuad — по 8 чисел
builder.tri(point0, point1, point2, outwardNormal, uvTri, aoUvTri, baseColor, normalAt?)
                                         // uvTri, aoUvTri — по 6 чисел, в порядке point0, point1, point2
builder.collideQuad(point0, point1, point2, point3)  // 18 чисел в vCollide
builder.collideTri(point0, point1, point2)           // 9 чисел
builder.g                                            // IBuffersGeom — вернуть из фабрики
```

- **Квад** — вершины по контуру: `bottomStart`, `bottomEnd` ложатся на нижний край тайла, `topEnd`, `topStart` —
  на верхний. Своя четвёрка вершин на каждый вызов: 4 вершины и 6 индексов
  `first, first+1, first+2, first, first+2, first+3`.
- **Обход** выбирается по нормали-подсказке `outwardNormal` (`_GM.facesTo`), руками его не выписывают.
  `outwardNormal` смотрит наружу от тела: у внутренней стенки — внутрь кольца, у торца — наружу от торца.
  При смене обхода сборщик меняет местами `bottomEnd` и `topStart` (у `tri` — `point1` и `point2`)
  **вместе с их `uv` и `uv2`**, иначе ориентированный тайл ляжет транспонированным. Ошибку в `outwardNormal`
  валидатор не видит — только экран.
- **Свет** — `min(1, baseColor × (AMBIENT + DIFFUSE · max(0, normal · LIGHT)))`, один на все фабрики уровня, чтобы
  форма читалась на `MeshBasicMaterial`. Тайл атласа нейтральный, оттенок даёт `baseColor` — опции модуля
  (`colorWall`, `colorRiser`, …). `normal` — `outwardNormal` у плоской грани, `normalAt(point)` у изогнутой —
  нормаль в самой вершине (`normalOutward`/`normalInward` в эталоне): тогда изгиб виден без источника света.
- Отдельный `push` в `builder.g.v` мимо сборщика запрещён: рассинхрон `v`/`uv`/`uv2`/`c`/`index` начинается там.

## Шаблон

```ts
import { _GM, type IBuffersGeom, type A3 } from "_CORE/_M/_gm"
import { UV_GRAY_Q, UV_MOSS_Q } from "atlases/atlas00/atlas00"
import { UV_AO_NONE_Q, UV_AO_TOP_Q } from "atlases/atlasAo00/atlasAo00"

// Коробка у стены: передняя грань смотрит в +z, задняя стоит в стене и не рисуется
type T = {
    pos?: A3,       // левый нижний задний угол
    width?: number, // по x
    height?: number,
    depth?: number, // по z, от стены к зрителю
    color?: A3,     // базовый цвет до запечённого освещения; умножается на тайл атласа
}

export const DEFAULT_OPTS: Required<T> = {
    pos: [0, 0, 0],
    width: 2, height: 3, depth: 2,
    color: [.95, .8, .58],
}

// случайные опции из диапазона, в котором модуль используется; по ним гоняют check:geom и стенд
export const randomOpts = (): T => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    return { width: rand(1, 4), height: rand(2, 5), depth: rand(1, 3) }
}

export const thing00 = (opts: T = {}): IBuffersGeom => {
    const { pos, width, height, depth, color }: Required<T> = { ...DEFAULT_OPTS, ...opts }

    const builder = _GM.createGeomBuilder()
    const { quad, collideQuad } = builder

    // семейство тайлов — одно на инстанс
    const TYPE = Math.random() < .5 ? 'STONE' : 'MOSS'
    const uvMain = TYPE === 'STONE' ? UV_GRAY_Q : UV_MOSS_Q

    // тень по верхнему краю тайла AO_TOP: UV_AO_TOP_Q как есть кладёт её на верхнее ребро квада,
    // перевёрнутый — на нижнее
    const AO_SHADOW_AT_BOTTOM = _GM.flipUvQ(UV_AO_TOP_Q)

    const pointAt = (x: number, y: number, z: number): A3 => [pos[0] + x, pos[1] + y, pos[2] + z]

    // передняя стенка: тень внизу — низ у земли
    quad(
        pointAt(0, 0, depth), pointAt(width, 0, depth), pointAt(width, height, depth), pointAt(0, height, depth),
        [0, 0, 1], uvMain, AO_SHADOW_AT_BOTTOM, color,
    )
    // крыша: открыта
    quad(
        pointAt(0, height, depth), pointAt(width, height, depth), pointAt(width, height, 0), pointAt(0, height, 0),
        [0, 1, 0], uvMain, UV_AO_NONE_Q, color,
    )

    // прокси — проще рендер-геометрии
    collideQuad(pointAt(0, 0, depth), pointAt(width, 0, depth), pointAt(width, height, depth), pointAt(0, height, depth))

    return builder.g
}
```

Чего в шаблоне нет, а в эталоне есть и нужно повторять, когда форма того требует:

- **изогнутая поверхность** — `quad(..., normalAt)` с нормалью в вершине; геометрия остаётся плоскими квадами;
- **неквадная грань** — `tri`: веер из центра, своя тройка вершин на треугольник, `uv` — плоская проекция
  через `_GM.rectPoint(RECT_*, fractionX, fractionY)` с долями, зажатыми в [0, 1];
- **тень одной ширины по обе стороны угла** — см. ниже;
- **прокси со своим шагом** (`collideArcSegmentLength`) и упрощённой формой.

## Массивы и инварианты

| массив | на квад | на треугольник | откуда |
|---|---|---|---|
| `v` | 12 | 9 | |
| `uv` | 8 | 6 | `UV_*_Q`, внутри тайла — `_GM.rectPoint(RECT_*, fractionX, fractionY)` |
| `uv2` | 8 | 6 | `UV_AO_*_Q`, `_GM.flipUvQ`, `_GM.rectPoint(RECT_AO_*, …)` |
| `c` | 12 | 9 | сборщик, `lit(baseColor, normal)` |
| `index` | 6 | 3 | |
| `vCollide` | 18 | 9 | без индекса |

`c.length === v.length`, `uv.length === uv2.length === v.length / 3 * 2`, `index.length % 3 === 0`,
`min(index) === 0`, `max(index) + 1 === v.length / 3`, `vCollide.length % 9 === 0`.
Висячая вершина ломает не рендер, а склейку: `_GM.mergeIndexedArrays` берёт смещение как `max(index) + 1`.

**Не сваривать вершины между гранями.** Вершина несёт атрибуты своей грани: `uv` — точку в её тайле,
`uv2` — AO, повёрнутый к её ребру, `c` — свет от её нормали. Общая вершина двух граней хранит одно значение,
и соседняя грань получит чужие. На освещаемом материале к тому же `_H.createBufferGeometry` вызывает
`computeVertexNormals()`, и общая вершина сгладит стык. Внутри одной плоской грани сварка допустима —
это и есть квад 4 вершины / 6 индексов.

## Атласы

Хелперы — в `_GM`: `tileRect(atlasSize, x, y, width, height)` (регион в пикселях, отступ 2 px), `rectUvQ`
(8 чисел: первые две вершины — низ тайла, вторые две — верх), `flipUvQ` (тайл вверх ногами),
`rectPoint(rect, fractionX, fractionY)` (точка внутри тайла по долям), тип `T_TileRect` — `[uLeft, vBottom, uRight, vTop]`.

- `atlas00` (цвет, `512.jpg`, сетка 64 px): `WHITE`, `MOSS`, `RED` (2:1), `GRAY`, `GRAY_WIDE` (2:1).
- `atlasAo00` (затенение, `512Ao.jpg`): `AO_NONE`, `AO_TOP` (тень по верхнему краю), `AO_TOP_BOTTOM`, `AO_ROUND`.

На каждый тайл — тройка `RECT_*`, `UV_*` (12 чисел, старый неиндексированный формат — в фабрики не брать),
`UV_*_Q`. Каждый треугольник `uv`/`uv2` целиком внутри одного `RECT_*`; `check:geom` сверяет с экспортами `RECT_*`
и сырые uv отвергнет. Новый тайл — дорисовать в jpg и добавить тройку; агент jpg не рисует, а сообщает, что тайл нужен.

**Разнообразие** — один `TYPE` на инстанс (`Math.random()`) выбирает семейство (камень / мох),
дальше редкие вариации по граням внутри семейства, а не случайный тайл на каждую грань.

## AO в `uv2`

Затеняются два случая:

- **внутренний угол** — низ стенки над площадкой, низ подступенка над проступью, проступь у следующего
  подступенка, площадка у парапета;
- **низ, который будет примыкать к земле** — низ наружной стенки, торцов, нижнего подступенка.

Такая грань получает `UV_AO_TOP_Q` (тень на верхнем ребре `topEnd`, `topStart`) или `_GM.flipUvQ(UV_AO_TOP_Q)`
(на нижнем `bottomStart`, `bottomEnd`) —
тенью к ребру угла или к нижнему ребру. Открытые грани — `UV_AO_NONE_Q`.

**Ширина тени у угла одинакова с обеих сторон.** Тайл AO растягивается на грань, тень в метрах — доля тайла ×
размер грани поперёк ребра, поэтому обе грани угла ложатся на тайл в одном масштабе. В эталоне площадка
у парапета — кольцо шириной `parapetHeight` с тенью, как стенка высотой `parapetHeight` над ней; веер внутри
кольца — `AO_NONE`. Доля тени на расстоянии от центра — `parapetShadowAt(distance)`, в uv2 —
`_GM.rectPoint(RECT_AO_TOP, .5, parapetShadowAt(distance))`; если кольцо доходит до центра, в центре тень уже не ноль.
Исключение в эталоне — угол ступени: подступенок (`riserHeight`) и проступь (`treadDepth`) разной глубины,
тени разной ширины.

На материале — `aoMap` с `channel = 2` (three 0.173), пример — `src/ch_redactor/index.ts`.

## Коллизия

`vCollide` — упрощённый прокси для физики, а не копия рендер-меша: свой, более грубый шаг и проще форма
(пандус вместо ступеней, стенка без крышки и торцов). У stairs00 — веер площадки, стенка с двух сторон и пандус
на месте каждой лестницы, шаг дуги вчетверо грубее рендерного. Если объект декоративный и сквозь него можно
проходить — пустой массив, но вернуть.

Задание про геометрию по умолчанию касается только видимой геометрии (`v`, `uv`, `uv2`, `c`, `index`).
«Разрежь», «добавь граней», «поменяй форму» без упоминания физики — `vCollide` не трогать. Правки прокси
заказываются отдельно, прямо.

## `randomOpts` и проверка

`randomOpts(): T` — случайные опции из диапазона, в котором модуль реально используется (стенды, уровни).
Это часть контракта: фабрика обязана давать валидную геометрию на всём диапазоне, а не только на `DEFAULT_OPTS`.
Стенд берёт опции из него же, а не держит свою копию диапазонов.

`npm run check:geom -- <модуль>` прогоняет фабрику 20 раз с опциями по умолчанию и 20 раз с `randomOpts()`,
`-- src/geometry` — все модули папки. Ошибки (ERROR): нет одного из шести массивов, длины и индекс
(`_GM.debugArrays`), NaN, `uv`/`uv2`/`c` вне `[0, 1]`, `vCollide` не кратен 9, вершины сварены между
некомпланарными треугольниками, треугольник `uv`/`uv2` вне одного `RECT_*` своего атласа, нет `randomOpts`.
Предупреждения (WARN): вырожденные треугольники, прокси не проще рендера, все цвета одинаковы — свет не запечён.
Упавший прогон сохраняет опции в файл и печатает `replay: --args=@…` — повтор в любом шелле.
С `--args` прогоняются только переданные аргументы. Обход граней валидатор не проверяет.

**Склейка** — `_GM.mergeIndexedArrays(target, part)`; массив дописывается, только если он есть у обоих, поэтому
`target = { index: [], v: [], uv: [], uv2: [], c: [], vCollide: [] }`. Сдвиг части — `_GM.translateVertices`
по `v` и отдельно по `vCollide`.

## Чек-лист перед сдачей

- [ ] `check:geom` → PASS, и по умолчанию, и `randomOpts()`
- [ ] `npx tsc --noEmit` → 0 ошибок
- [ ] грани — через `_GM.createGeomBuilder()`, своих копий `quad`/`facesTo`/`lit` в модуле нет
- [ ] экспорт `<имя>`, `randomOpts`, `DEFAULT_OPTS`, возврат `IBuffersGeom`
- [ ] запись в `GEOM_REGISTRY` стенда
- [ ] импорты — из `_CORE/_M/_gm`, типы с `type`; нет `_H`, `_M`, `GeomTypes`, `_00trash_*`
- [ ] нет `Mesh`/`Material`/`Texture`/DOM/`Root`
- [ ] `uv` — из `atlas00`, `uv2` — из `atlasAo00`, сырых координат нет
- [ ] у изогнутых граней передан `normalAt`
- [ ] внутренние углы и низ у земли затенены, тень у нужного ребра и одной ширины по обе стороны угла
- [ ] `outwardNormal` смотрит наружу — проверить глазами
- [ ] имена развёрнутые, у опций и неочевидных мест — комментарии (раздел «Имена и комментарии»)
- [ ] `vCollide` упрощён относительно рендера

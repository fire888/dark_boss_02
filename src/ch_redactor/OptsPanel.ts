import type { T_GeomEntry, T_Opts } from './registry'

// Панель стенда: выбор фабрики, ползунки её опций, JSON опций для check:geom, статистика сборки.
// Ползунки строятся по форме опций, поэтому новой фабрике своя разметка не нужна.
// Границы ползунка — разброс поля по выборке randomOpts() (тот диапазон, в котором модуль используется);
// поля, которых randomOpts не задаёт, — запасное правило rangeFallback.

type T_Handlers = {
    // опции изменились — пересобрать одиночный пример
    onChange: (entry: T_GeomEntry, opts: T_Opts) => void,
    // пересобрать 20 случайных вариантов
    onReroll: (entry: T_GeomEntry) => void,
}

const CSS = `
.geom-panel { position: fixed; left: 0; top: 0; width: 340px; max-height: 100vh; overflow: auto; box-sizing: border-box;
    padding: 8px; background: rgba(10, 10, 20, .82); color: #ddd; font: 12px monospace; z-index: 10; }
.geom-panel button, .geom-panel select { font: inherit; margin: 0 4px 4px 0; cursor: pointer; }
.geom-panel .row { display: flex; align-items: center; gap: 4px; margin: 2px 0; }
.geom-panel .row > label { flex: 0 0 100px; overflow: hidden; text-overflow: ellipsis; }
.geom-panel input[type=range] { flex: 1 1 auto; min-width: 0; margin: 0; }
.geom-panel .row > .val { flex: 0 0 52px; text-align: right; }
.geom-panel input[type=color] { flex: 1 1 auto; min-width: 0; height: 20px; padding: 0; border: 0; background: none; }
.geom-panel input[type=text] { width: 100%; font: inherit; }
.geom-panel fieldset { border: 1px solid #555; margin: 4px 0; padding: 2px 6px; }
.geom-panel legend button { margin: 0 0 0 6px; padding: 0 4px; }
.geom-panel textarea { width: 100%; height: 90px; box-sizing: border-box; font: 11px monospace; }
.geom-panel .stats { margin: 6px 0; white-space: pre-wrap; }
.geom-panel .stats.error { color: #ff7070; }
`

const clone = <V>(v: V): V => JSON.parse(JSON.stringify(v))
const isNumArr = (v: unknown): v is number[] => Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'number')
const isObj = (v: unknown): v is T_Opts => !!v && typeof v === 'object' && !Array.isArray(v)

// сколько раз звать randomOpts, чтобы собрать границы ползунков
const RANGE_SAMPLES = 300
// шагов на ползунок у дробного поля
const RANGE_STEPS = 200

type T_Range = { min: number, max: number, isInt: boolean }

// путь поля без индексов массивов: stairs.*.angle, pos.*
const sampleRanges = (entry: T_GeomEntry): Map<string, T_Range> => {
    const ranges = new Map<string, T_Range>()
    const walk = (v: unknown, path: string) => {
        if (typeof v === 'number') {
            const r = ranges.get(path)
            if (!r) ranges.set(path, { min: v, max: v, isInt: Number.isInteger(v) })
            else ranges.set(path, { min: Math.min(r.min, v), max: Math.max(r.max, v), isInt: r.isInt && Number.isInteger(v) })
        } else if (Array.isArray(v)) {
            v.forEach(x => walk(x, `${path}.*`))
        } else if (isObj(v)) {
            for (const k of Object.keys(v)) walk(v[k], path ? `${path}.${k}` : k)
        }
    }
    for (let i = 0; i < RANGE_SAMPLES; ++i) walk(entry.randomOpts(), '')
    return ranges
}

// поле, которое randomOpts не меняет: ноль (pos) — ±10, доли (цвета) — [0, 1], иначе — от четверти до удвоенного.
// Ноль в диапазон шага (arcStepCollide) не попадает: на нулевом шаге разбиение дуги не кончится
const rangeFallback = (v: number): T_Range => {
    if (v === 0) return { min: -10, max: 10, isInt: false }
    if (v > 0 && v <= 1) return { min: 0, max: 1, isInt: false }
    const a = v * .25
    const b = v * 2
    return { min: Math.min(a, b), max: Math.max(a, b), isInt: Number.isInteger(v) }
}

// анимация опций: переход от текущих к случайным за ANIM_MS, по приходу — к новым случайным
const ANIM_MS = 2500

// числа — линейно (целые с обеих сторон остаются целыми), массивы и объекты — поэлементно;
// булевы, строки и прочая разная форма переключаются посередине.
// Массивы объектов разной длины (другое число лестниц): короткий дополняется копиями последнего
// элемента — лестница расходится на две из одной или две сходятся в одну; в конце — длина b
const lerpOpts = (a: unknown, b: unknown, t: number): unknown => {
    if (typeof a === 'number' && typeof b === 'number') {
        const v = a + (b - a) * t
        return Number.isInteger(a) && Number.isInteger(b) ? Math.round(v) : v
    }
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => lerpOpts(x, b[i], t))
    if (Array.isArray(a) && Array.isArray(b) && a.length && b.length && a.every(isObj) && b.every(isObj)) {
        if (t >= 1) return clone(b)
        const n = Math.max(a.length, b.length)
        const out: unknown[] = []
        for (let i = 0; i < n; ++i) out.push(lerpOpts(a[Math.min(i, a.length - 1)], b[Math.min(i, b.length - 1)], t))
        return out
    }
    if (isObj(a) && isObj(b)) {
        const o: T_Opts = {}
        for (const k of Object.keys(b)) o[k] = k in a ? lerpOpts(a[k], b[k], t) : clone(b[k])
        return o
    }
    return clone(t < .5 ? a : b)
}

// значения src — в dst на месте, чтобы инпуты формы остались привязаны к тем же объектам.
// false — форма разошлась (другое число лестниц): поле заменено целиком, форму надо перестроить
const assignInPlace = (dst: Record<string, unknown>, src: Record<string, unknown>): boolean => {
    let isSame = true
    for (const k of Object.keys(src)) {
        const a = dst[k]
        const b = src[k]
        const isSameArr = Array.isArray(a) && Array.isArray(b) && a.length === b.length
        if (isSameArr || (isObj(a) && isObj(b))) {
            if (!assignInPlace(a as Record<string, unknown>, b as Record<string, unknown>)) isSame = false
        } else {
            if (typeof a === 'object' || typeof b === 'object') isSame = false
            dst[k] = b
        }
    }
    return isSame
}

const fmt = (v: number) => String(+v.toFixed(3))

// цвет — тройка 0..1 в поле col*: colWall, colStep, colTop. По одним значениям не узнать — pos [0, 0, 0] тоже в [0, 1]
const isColor = (key: string | number, v: unknown): v is number[] =>
    typeof key === 'string' && /^col/.test(key) && isNumArr(v) && v.length === 3
const rgbToHex = (c: number[]) =>
    '#' + c.map(x => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0')).join('')
const hexToRgb = (hex: string) =>
    [1, 3, 5].map(i => +(parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3))

export class OptsPanel {
    dom: HTMLDivElement
    _entries: T_GeomEntry[]
    _entry: T_GeomEntry
    _opts: T_Opts = {}
    _h: T_Handlers
    _select: HTMLSelectElement
    _ranges = new Map<string, T_Range>()
    _form: HTMLDivElement
    _stats: HTMLDivElement
    _json: HTMLTextAreaElement
    _animButton: HTMLButtonElement
    // обновить инпуты формы по текущим опциям, без перестройки — для анимации
    _refreshers: (() => void)[] = []
    // идёт ли анимация; номер запуска отсекает кадры прошлого запуска после stop и нового старта
    _isAnim = false
    _animRun = 0

    constructor (entries: T_GeomEntry[], handlers: T_Handlers) {
        this._entries = entries
        this._h = handlers

        const style = document.createElement('style')
        style.textContent = CSS
        document.head.appendChild(style)

        this.dom = document.createElement('div')
        this.dom.className = 'geom-panel'
        // клавиши в инпутах не должны доходить до Keyboard и ControlsSystem (стрелки, O)
        this.dom.addEventListener('keydown', e => e.stopPropagation())
        this.dom.addEventListener('keyup', e => e.stopPropagation())
        document.body.appendChild(this.dom)

        const select = this._select = document.createElement('select')
        entries.forEach((e, i) => select.add(new Option(e.name, String(i))))
        select.onchange = () => this.setEntry(entries[+select.value])
        this.dom.appendChild(select)

        const bar = document.createElement('div')
        this._button(bar, 'default', () => this.setOpts(clone(this._entry.defaultOpts)))
        this._button(bar, 'random', () => this.setOpts(this._randomOpts()))
        this._button(bar, 'rebuild', () => this._emit())
        this._button(bar, 'reroll 20', () => this._h.onReroll(this._entry))
        this._animButton = this._button(bar, 'animate', () => this._isAnim ? this._stopAnim() : this._startAnim())
        this.dom.appendChild(bar)

        this._stats = document.createElement('div')
        this._stats.className = 'stats'
        this.dom.appendChild(this._stats)

        this._form = document.createElement('div')
        this.dom.appendChild(this._form)

        // опции в форме --args для check:geom: [opts]; правка JSON применяется к форме
        const jsonBar = document.createElement('div')
        jsonBar.textContent = 'args JSON '
        this._button(jsonBar, 'copy', () => navigator.clipboard?.writeText(this._json.value))
        this.dom.appendChild(jsonBar)
        this._json = document.createElement('textarea')
        this._json.onchange = () => {
            try {
                const parsed = JSON.parse(this._json.value)
                const o = Array.isArray(parsed) ? parsed[0] : parsed
                if (!isObj(o)) throw new Error('need object or [object]')
                this.setOpts({ ...clone(this._entry.defaultOpts), ...o })
            } catch (err) {
                this.setStats(`JSON: ${(err as Error).message}`, true)
            }
        }
        this.dom.appendChild(this._json)
    }

    // первая сборка — снаружи, когда панель уже присвоена и может показать статистику
    setEntry (entry: T_GeomEntry) {
        this._entry = entry
        this._select.value = String(this._entries.indexOf(entry))
        this._ranges = sampleRanges(entry)
        this.setOpts(clone(entry.defaultOpts))
        this._h.onReroll(entry)
    }

    // любая установка опций снаружи анимации её останавливает
    setOpts (opts: T_Opts) {
        if (this._isAnim) this._setAnimState(false)
        this._opts = opts
        this._renderForm()
        this._emit()
    }

    _renderForm () {
        this._form.innerHTML = ''
        this._refreshers = []
        for (const key of Object.keys(this._opts)) {
            this._field(this._form, this._opts, key, key, key, this._entry.defaultOpts[key])
        }
    }

    _randomOpts (): T_Opts {
        return { ...clone(this._entry.defaultOpts), ...clone(this._entry.randomOpts()) }
    }

    _setAnimState (isAnim: boolean) {
        this._isAnim = isAnim
        ++this._animRun
        this._animButton.textContent = isAnim ? 'stop' : 'animate'
    }

    // каждый кадр опции пересчитываются, ползунки едут за ними, пример пересобирается;
    // правка ползунка посреди перехода будет перезаписана
    _startAnim () {
        this._setAnimState(true)
        const run = this._animRun
        let from = clone(this._opts)
        let to = this._randomOpts()
        let t0 = performance.now()
        const tick = (now: number) => {
            if (run !== this._animRun) return
            const k = Math.min(1, (now - t0) / ANIM_MS)
            const next = lerpOpts(from, to, k * k * (3 - 2 * k)) as T_Opts
            if (assignInPlace(this._opts, next)) this._refreshers.forEach(f => f())
            else this._renderForm()
            if (k >= 1) {
                from = to
                to = this._randomOpts()
                t0 = now
            }
            this._emit()
            requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }

    _stopAnim () {
        this._setAnimState(false)
        this._renderForm()
    }

    setStats (text: string, isError = false) {
        this._stats.textContent = text
        this._stats.classList.toggle('error', isError)
    }

    _emit () {
        if (document.activeElement !== this._json) {
            this._json.value = JSON.stringify([this._opts])
        }
        this._h.onChange(this._entry, clone(this._opts))
    }

    _button (parent: HTMLElement, text: string, onClick: () => void) {
        const b = document.createElement('button')
        b.textContent = text
        b.onclick = onClick
        parent.appendChild(b)
        return b
    }

    // границы ползунка всегда включают текущее значение: опции из JSON могут выходить за randomOpts
    _range (path: string, v: number): T_Range {
        const r = this._ranges.get(path)
        const { min, max, isInt } = r && r.max > r.min ? r : rangeFallback(v)
        return { min: Math.min(min, v), max: Math.max(max, v), isInt }
    }

    _slider (parent: HTMLElement, obj: unknown[] | T_Opts, key: string | number, path: string, label: string) {
        const o = obj as Record<string | number, number>
        const v = o[key]
        const { min, max, isInt } = this._range(path, v)

        const row = this._row(parent, label)
        const inp = document.createElement('input')
        inp.type = 'range'
        inp.min = String(min)
        inp.max = String(max)
        inp.step = isInt ? '1' : String((max - min) / RANGE_STEPS)
        inp.value = String(v)
        inp.title = `${fmt(min)} … ${fmt(max)}`
        const val = document.createElement('span')
        val.className = 'val'
        val.textContent = fmt(v)
        inp.oninput = () => {
            const x = parseFloat(inp.value)
            if (!Number.isFinite(x)) return
            o[key] = x
            val.textContent = fmt(x)
            this._emit()
        }
        this._refreshers.push(() => {
            inp.value = String(o[key])
            val.textContent = fmt(o[key])
        })
        row.appendChild(inp)
        row.appendChild(val)
    }

    _row (parent: HTMLElement, label: string) {
        const row = document.createElement('div')
        row.className = 'row'
        const l = document.createElement('label')
        l.textContent = label
        l.title = label
        row.appendChild(l)
        parent.appendChild(row)
        return row
    }

    // path — путь поля для границ ползунка (stairs.*.angle);
    // def — то же поле в defaultOpts: шаблон для нового элемента массива
    _field (parent: HTMLElement, obj: unknown[] | T_Opts, key: string | number, label: string, path: string, def: unknown) {
        const o = obj as Record<string | number, unknown>
        const v = o[key]

        if (typeof v === 'number') {
            this._slider(parent, obj, key, path, label)
            return
        }
        if (typeof v === 'boolean') {
            const inp = document.createElement('input')
            inp.type = 'checkbox'
            inp.checked = v
            inp.onchange = () => { o[key] = inp.checked; this._emit() }
            this._row(parent, label).appendChild(inp)
            return
        }
        if (typeof v === 'string') {
            const inp = document.createElement('input')
            inp.type = 'text'
            inp.value = v
            inp.onchange = () => { o[key] = inp.value; this._emit() }
            this._row(parent, label).appendChild(inp)
            return
        }
        if (isColor(key, v)) {
            const inp = document.createElement('input')
            inp.type = 'color'
            inp.value = rgbToHex(v)
            const val = document.createElement('span')
            val.className = 'val'
            val.textContent = inp.value
            inp.oninput = () => {
                hexToRgb(inp.value).forEach((x, i) => { v[i] = x })
                val.textContent = inp.value
                this._emit()
            }
            this._refreshers.push(() => {
                inp.value = rgbToHex(v)
                val.textContent = inp.value
            })
            const row = this._row(parent, label)
            row.appendChild(inp)
            row.appendChild(val)
            return
        }
        if (isNumArr(v)) {
            // вектор — по ползунку на компоненту
            v.forEach((_, i) => this._slider(parent, v, i, `${path}.*`, `${label}[${i}]`))
            return
        }
        if (Array.isArray(v)) {
            const fs = document.createElement('fieldset')
            const legend = document.createElement('legend')
            legend.textContent = label
            // новый элемент — копия последнего, у пустого массива — первого из defaultOpts
            this._button(legend, '+', () => {
                const tpl = v.length ? v[v.length - 1] : Array.isArray(def) ? def[0] : undefined
                if (tpl === undefined) return
                v.push(clone(tpl))
                this.setOpts(this._opts)
            })
            fs.appendChild(legend)
            const itemPath = `${path}.*`
            v.forEach((item, i) => {
                const defItem = Array.isArray(def) ? def[0] : undefined
                if (!isObj(item)) {
                    this._field(fs, v, i, String(i), itemPath, defItem)
                    return
                }
                const sub = document.createElement('fieldset')
                const subLegend = document.createElement('legend')
                subLegend.textContent = String(i)
                this._button(subLegend, '×', () => {
                    v.splice(i, 1)
                    this.setOpts(this._opts)
                })
                sub.appendChild(subLegend)
                for (const k of Object.keys(item)) {
                    this._field(sub, item, k, k, `${itemPath}.${k}`, isObj(defItem) ? defItem[k] : undefined)
                }
                fs.appendChild(sub)
            })
            parent.appendChild(fs)
            return
        }
        if (isObj(v)) {
            const fs = document.createElement('fieldset')
            const legend = document.createElement('legend')
            legend.textContent = label
            fs.appendChild(legend)
            for (const k of Object.keys(v)) this._field(fs, v, k, k, `${path}.${k}`, isObj(def) ? def[k] : undefined)
            parent.appendChild(fs)
        }
    }
}

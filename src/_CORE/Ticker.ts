export class Ticker {
    isRunning = false
    _updates: { (t: number): void }[] = []
    _oldTime = Date.now()

    start () {
        this._oldTime = Date.now()
        this.isRunning = true
        this.tick()
    }

    tick () {
        if (!this.isRunning) {
            return
        }
        requestAnimationFrame(this.tick.bind(this))

        const diff = Date.now() - this._oldTime
        this._oldTime = Date.now()
        this._updates.forEach(f => f(diff))
    }

    on (f: (t: number) => void) {
        this._updates.push(f)
        return () => {
            this._updates.filter(item => item !== f)
        }
    }
}

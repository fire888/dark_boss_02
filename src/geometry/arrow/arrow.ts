export const createArrow = (): { v: number[] } => {
    const w = .25
    const wH = w * .5
    const d = 10
    const w2 = w * 5
    const wH2 = w2 * .5
    const d2 = 5
    const v = [
        -wH, 0, 0,
        wH, 0, 0,
        wH, 0, -d,

        -wH, 0, 0,
        wH, 0, -d,
        -wH, 0, -d,

        -wH2, 0, -d,
        wH2, 0, -d,
        0, 0, -d2 - d,
    ]

    return { v }
}
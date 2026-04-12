export const createArrow = (s: number = 10, wA: number = .2): { v: number[] } => {
    const w = wA * .2
    const wH = w * .5
    const d = .7 * s
    const w2 = wA
    const wH2 = w2 * .5
    const d2 = .3 * s

    const v = [
         -wH,   0,   0,
          wH,   0,   0,
          wH,   0,   d,

         -wH,   0,   0,
          wH,   0,   d,
         -wH,   0,   d,

        -wH2,   0,   d,
         wH2,   0,   d,
           0,   0,   d2 +d,
    ]

    return { v }
}
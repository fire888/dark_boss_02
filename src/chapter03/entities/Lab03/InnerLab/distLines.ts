import { Vector3 } from 'three'

type ILine = {
    p1: Vector3;
    p2: Vector3;
}

// Ограничение числа в интервал [0, 1]
const clamp01 = (x: number) => {
    return Math.max(0, Math.min(1, x));
}

// Вычисление расстояния между двумя отрезками в 3D
export const distanceBetweenSegments3D = (seg1: ILine, seg2: ILine) => {
    const P1 = seg1.p1, P2 = seg1.p2
    const Q1 = seg2.p1, Q2 = seg2.p2

    const seg1LenV3 = P2.clone().sub(P1)
    const seg2LenV3 = Q2.clone().sub(Q1)
    const v3points = P1.clone().sub(Q1)

    const sqLen1 = seg1LenV3.dot(seg1LenV3)
    const sqLen1Len2 = seg1LenV3.dot(seg2LenV3)
    const sqLen2 = seg2LenV3.dot(seg2LenV3)
    const dotLen1toD = seg1LenV3.dot(v3points)
    const dotLen2toD = seg2LenV3.dot(v3points)
    const sqPerp = v3points.dot(v3points)

    // Функция для вычисления f(t,s) по параметрам
    const evalF = (t: number, s: number) => {
        return sqLen1 * t * t - 2 * sqLen1Len2 * t * s + sqLen2 * s * s + 2 * dotLen1toD * t - 2 * dotLen2toD * s + sqPerp;
    }

    // Проверяем вырожденность отрезков (длина = 0)
    const eps = 1e-12;
    if (sqLen1 < eps && sqLen2 < eps) {
        // Оба отрезка – точки
        return Math.sqrt(sqPerp)
    }
    if (sqLen1 < eps) {
        // Первый отрезок – точка, второй – отрезок
        // Минимизируем по s: f(0,s) = C*s² - 2*E*s + F
        const sOpt = clamp01(dotLen2toD / sqLen2)
        return Math.sqrt(evalF(0, sOpt))
    }
    if (sqLen2 < eps) {
        // Второй отрезок – точка, первый – отрезок
        const tOpt = clamp01(-dotLen1toD / sqLen1)  // производная по t: 2*A*t + 2*D = 0 => t = -D/A
        return Math.sqrt(evalF(tOpt, 0))
    }

    // Общий случай
    const det = sqLen1 * sqLen2 - sqLen1Len2 * sqLen1Len2

    let bestDistSq = Infinity

    // Проверка внутренней точки (если det > 0)
    if (det > eps) {
        const t0 = (sqLen1Len2 * dotLen2toD - dotLen1toD * sqLen2) / det;
        const s0 = (sqLen1 * dotLen2toD - sqLen1Len2 * dotLen1toD) / det;
        if (t0 >= 0 && t0 <= 1 && s0 >= 0 && s0 <= 1) {
            bestDistSq = Math.min(bestDistSq, evalF(t0, s0));
        }
    }

    // Проверка границ
    // 1) t = 0
    {
        // f(0,s) = C*s² - 2*E*s + F
        const sOpt = clamp01(dotLen2toD / sqLen2);
        bestDistSq = Math.min(bestDistSq, evalF(0, sOpt))
    }
    // 2) t = 1
    {
        // f(1,s) = A - 2*B*s + C*s² + 2*D - 2*E*s + F = C*s² - 2*(B+E)*s + (A+2D+F)
        const sOpt = clamp01((sqLen1Len2 + dotLen2toD) / sqLen2);
        bestDistSq = Math.min(bestDistSq, evalF(1, sOpt))
    }
    // 3) s = 0
    {
        // f(t,0) = A*t² + 2*D*t + F
        const tOpt = clamp01(-dotLen1toD / sqLen1);
        bestDistSq = Math.min(bestDistSq, evalF(tOpt, 0))
    }
    // 4) s = 1
    {
        // f(t,1) = A*t² - 2*B*t + C + 2*D*t - 2*E + F = A*t² + 2*(D-B)*t + (C - 2E + F)
        const tOpt = clamp01((sqLen1Len2 - dotLen1toD) / sqLen1);
        bestDistSq = Math.min(bestDistSq, evalF(tOpt, 1))
    }

    // Также проверим угловые точки (они уже покрыты граничными оптимумами, но на всякий случай)
    bestDistSq = Math.min(bestDistSq, evalF(0, 0), evalF(0, 1), evalF(1, 0), evalF(1, 1))

    return Math.sqrt(bestDistSq)
}


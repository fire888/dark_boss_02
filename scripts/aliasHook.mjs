import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

// tsconfig baseUrl is ./src, and TS imports omit the .ts extension.
// Node's ESM resolver does neither, so geometry modules cannot be loaded
// headlessly without this hook.
const SRC = path.resolve(process.cwd(), 'src')

const firstExistingFile = (base) => {
    for (const p of [base, base + '.ts', path.join(base, 'index.ts')]) {
        try {
            if (fs.statSync(p).isFile()) return p
        } catch { /* not a file */ }
    }
    return null
}

export async function resolve(specifier, context, next) {
    if (specifier.startsWith('node:') || specifier.startsWith('file:')) {
        return next(specifier, context)
    }

    let base = null
    if (specifier.startsWith('.')) {
        const parent = context.parentURL
            ? path.dirname(fileURLToPath(context.parentURL))
            : process.cwd()
        base = path.resolve(parent, specifier)
    } else if (!path.isAbsolute(specifier)) {
        base = path.resolve(SRC, specifier)
    }

    if (base) {
        const hit = firstExistingFile(base)
        if (hit) return next(pathToFileURL(hit).href, context)
    }

    return next(specifier, context)
}

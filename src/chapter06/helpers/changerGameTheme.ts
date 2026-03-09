import { Root } from "../index"

export const createChangerGameTheme = (root: Root) => {
    const { studio, materials } = root

    // HELPER THEME
    const randomColor = (mult: number = 1) => [Math.random() * mult, Math.random() * mult, Math.random() * mult]
    const changeGameTheme = () => {
        const background = randomColor(.2)
        const s = {
                fogColor: background,
                sceneBackground: background,
                dirLightColor: randomColor(1),
                ambientLightColor: randomColor(1),
                materialWalls: {
                    color: randomColor(1),
                    emissive: randomColor(0),
                    specular: randomColor(.5),
                },
                materialRoad: {
                    color: randomColor(1),
                    emissive: randomColor(0),
                },
                materialGround: {
                    color: randomColor(1),
                    emissive: randomColor(0),
                    specular: randomColor(.7),
                },
        }
        studio.setFogColor(s.fogColor)
        studio.animateBackgroundTo(s.sceneBackground, 100)
        studio.animateLightTo(s.dirLightColor, s.ambientLightColor, 100)
        materials.changeWallMaterial(s.materialWalls)
        materials.changeRoadMaterial(s.materialRoad)
        materials.changeDesertMaterial(s.materialGround)

        console.log(JSON.stringify(s) + ',')
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'n') {
            changeGameTheme()
        }
    })
}
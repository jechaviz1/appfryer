import IIngredinent from "@/interfaces/Ingredient";

export function calculateForPortions (
    ingredient: IIngredinent,
    portionsInRecipe: number,
    actualPortions: number
) {
    const qntyForOnePortion = ingredient.cnt! / portionsInRecipe
    let qntyForPortions: number | string = Number((qntyForOnePortion * actualPortions).toFixed(2))
    let measure = ingredient.measureTitle

    if (qntyForPortions === 0.5) {
        qntyForPortions = '1/2'
        return `${qntyForPortions} ${measure}`
    }

    if (qntyForPortions < 1 && (ingredient.measureTitle === 'kg' || ingredient.measureTitle === 'l')) {
        qntyForPortions = qntyForPortions * 1000
        switch (ingredient.measureTitle) {
            case 'kg':
                measure = 'g'
                break
            case 'l':
                measure = 'ml'
                break
        }
    }
    return `${qntyForPortions} ${measure}`
}
import IRecipe from "./Recipe";

export default interface IPlanMeal {
    id: number
    mealDate: string,
    mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner',
    recipe: IRecipe
} 
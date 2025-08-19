import IIngredinent, { IIngredientForShoppingList } from "./Ingredient";

export default interface IShoppingList {
    [key: string]: IIngredinent[]
}

export interface IShoppingListItemByRecipe {
    recipeId: number | null
    recipeTitle: string | null
    ingredients: IIngredientForShoppingList[]
}
import ICategory from "@/interfaces/Category"
import INutritional from "@/interfaces/Nutritional"

export default interface IIngredinent {
    id: number
    recipeId?: number
    title?: string
    ingredientId: number
    ingredientTitle?: string
    cnt?: number
    measureId?: number
    measureTitle?: string
    category: ICategory
    section: string | null
}

export interface IIngredinentInfo {
    id: number
    title: string
    category: ICategory
    interchangable?: string
    description?: string
    country?: string
    season?: string
    culinaryUse?: string
    nutrients: INutritional
    origin?: {
        country: string
        region?: string
        imgUrl?: string
        description?: string
    }
}

export interface IIngredientForShoppingList {
    id: number
    ingredientId: number
    ingredientTitle: string
    measureTitle: string
    category: ICategory
    cnt: number
    cntInGrams: number
    isChecked: boolean
}

export interface IMeasure {
    id: number
    title: string
    grams: number
}
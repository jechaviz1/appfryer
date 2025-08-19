import IRecipe from "./Recipe"

export default interface IFolder {
    id: number
    title: string
}

export interface IFolderWithRecipes extends IFolder {
    recipes: IRecipe[]
}
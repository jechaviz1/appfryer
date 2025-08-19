import ICategory from '@/interfaces/Category'
import ITag from '@/interfaces/Tag'
import IMedia from '@/interfaces/Media'
import IIngredinent from '@/interfaces/Ingredient'
import IComment from '@/interfaces/Comment'
import INutritional from '@/interfaces/Nutritional'
import IFolder from '@/interfaces/Folder'

export interface IRecipeStep {
    index?: number
    title: string
    description: string
    mediaUuid?: string
    cookingTime?: number
    info?: string
}

export enum RecipeStatus {
    NEW = 0,
    DRAFT = 1,
    PROCESSING = 2,
    PUBLISHED = 3,
    DELETED = 4,
}

export const RecipeStatusTitle = {
    [RecipeStatus.NEW]: 'New',
    [RecipeStatus.DRAFT]: 'Draft',
    [RecipeStatus.PROCESSING]: 'Processing',
    [RecipeStatus.PUBLISHED]: 'Published',
    [RecipeStatus.DELETED]: 'Deleted',
}

export default interface IRecipe {
    id: number
    userId: number
    userProfileImageThumb: string
    userIsFollowing?: boolean | null
    userFullname: string
    createdAt: Date | string
    categoryId: number
    categoryName: string
    title: string
    description: string
    status: keyof typeof RecipeStatusTitle // 0 | 1 | 2...
    statusTitle: typeof RecipeStatusTitle[keyof typeof RecipeStatusTitle] // New | Draft | Processing...
    isActive: boolean
    portions: number
    macrosFactors?: { // for changed macros, and only local
        fats: number
        carbs: number
        protein: number
    }
    macrosPortions?: number // for changed macros, and only local
    timePreparation: number
    timeCooking: number
    temperature: number
    categories: ICategory[]
    tags: ITag[]
    badges: string[]
    medias: IMedia[]
    ingredients: IIngredinent[]
    cookingSteps: IRecipeStep[]
    calories: number | null
    nutrients: INutritional
    isLiked: boolean
    isSaved: boolean
    isRated: boolean
    userRating?: number | null
    avgRating: number | null
    cntComments: number
    cntLikes: number
    comments?: IComment[]
    folders: IFolder[]
}
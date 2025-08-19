import { RecipeStatus, RecipeStatusTitle } from "./Recipe"

export default interface IActivityLog {
    id: number
    createdAt: string
    action: string
    recipe?: {
        id: number
        title: string
    }
    ingredients?: [{
        id: number
        title: string
    }]
    status?: RecipeStatus
    statusTitle?: keyof typeof RecipeStatusTitle
    rating?: number
    comment?: {
        id: number
        text: string
    }
    replyToComment?: {
        id: number
        text: string
    },
    fields?: string // for profile update
    user?: {
        id: number
        fullname: string
    }
}
export default interface IComment {
    id: number
    recipeId: number
    parentId?: number
    depth: number
    userId: number
    userProfileImageThumb: string
    userFullname: string
    createdAt: Date | string
    text: string
    cntLikes: number
    cntReplies: number
    isLiked: boolean
    isActive: boolean
}
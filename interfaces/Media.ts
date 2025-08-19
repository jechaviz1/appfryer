export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
}

export default interface IMedia {
    id: number
    url: string
    urlThumb?: string
    type: MediaType
    uuid: string
}
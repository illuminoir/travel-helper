export type Tag = {
    id: number
    name: string
}

export type TravelItem = {
    id: number
    name: string
    weight: number
    quantity: number
    dropped: boolean
    tags: Tag[]
}

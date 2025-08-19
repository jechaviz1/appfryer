export interface IDietBrief {
    id: number
    title: string
    description: string
    icon: string
    photo?: string
}

export interface IDiet extends IDietBrief {
    benefits: string
    allowed_food: string
    not_allowed_food: string
    important_notes: string
    diet: string
    recommended_audience: string
    ease_of_following: string
    time_to_see_results: string
    cost: string
    environmental_impact: string
    sample_daily_menu: string
    potential_risks: string
}
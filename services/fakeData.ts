import IShoppingList from "@/interfaces/ShoppingList"
import { IRecipeStep } from "@/interfaces/Recipe"

export const fakeCookingSteps: IRecipeStep[] = [
    {
        title: 'Cook the quinoa',
        description: 'Cook the quinoa in a pan of lightly salted boiling water for 15mn, then drain really well.',
        mediaUuid: 'https://picsum.photos/600',
        cookingTime: 1 * 60,
    }, {
        title: 'Season the chicken',
        description: 'Put the chicken breasts between two pieces of baking paper and use a rolling pin to gently tap out until less than 1cm thick. Drizzle over the oil, season well and dust with the cumin and coriander, turning to coat.',
    }, {
        title: 'Cook the chicken',
        description: 'Place the chicken breasts in the air fryer basket in a single layer, making sure they are not touching.\nCook at 180°c for 10-12 minutes, flipping halfway through. The exact cooking time may vary depending on the thickness of the chicken breasts. They should be golden, slightly charred, and cooked through.',
        mediaUuid: 'https://picsum.photos/600',
        cookingTime: 1,
    }, {
        title: 'Mix the ingredients',
        description: 'Mix the onion, cucumber, tomatoes and mint with the olive oil, 1 tsp of sumac, the lemon juice and some seasoning, and mix really well, then fold in the sliced chicken, any juices and the cooked quinoa.',
        mediaUuid: 'https://picsum.photos/600',
        info: 'This can be made ahead and will last in the fridge for 1-3 days',
    }, {
        title: 'Time to serve',
        description: 'Pile onto plates and top with the remaining sumac and more mint leaves, if you like.',
        mediaUuid: 'https://picsum.photos/600',
        info: 'This can be made ahead and will last in the fridge for 1-3 days',
    },
]

export const enJson = {
    title: 'English',
    translation: {
        'home.welcomeBack': 'Welcome back,',
        'home.yourStory': 'Your story',
        'searchPlaceholder': 'Search...',
        'home.new': 'New',
        'home.trend': 'Trend',
        'home.seasonal': 'Seasonal',
        'filters': 'Filters',
        'categories': 'Categories',
        'diets': 'Diets',
        'ingredients': 'Ingredients',
        'rating': 'Rating',
        'any': 'Any',
    },
}

export const esJson = {
    title: 'Español',
    translation: {
        'home.welcomeBack': 'Bienvenido de nuevo,',
        'home.yourStory': 'Tu historia',
        'searchPlaceholder': 'Buscar...',
        'home.new': 'Nuevo',
        'home.trend': 'Tendencia',
        'home.seasonal': 'Estacional',
        'filters': 'Filtros',
        'categories': 'Categorias',
        'diets': 'Dietas',
        'ingredients': 'Ingredientes',
        'rating': 'Calificacion',
        'any': 'Cualquiera',
    },
}
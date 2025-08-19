import AsyncStorage from '@react-native-async-storage/async-storage'

import { get } from "@/services/apiRequests"
import { IMeasure } from "@/interfaces/Ingredient"
import { IShoppingListItemByRecipe } from "@/interfaces/ShoppingList"
import { logError } from "@/services/utils"

export const fetchShoppingListByRecipes = (
    setShoppingListByRecipes: React.Dispatch<React.SetStateAction<IShoppingListItemByRecipe[]>>,
    token: string
) => {
    get({ url: '/shoppingList/byRecipe', token })
        .then((list: IShoppingListItemByRecipe[]) => {
            setShoppingListByRecipes(list)
        })
        .catch(logError)
}

export const fetchMeasures = (setMeasures: React.Dispatch<React.SetStateAction<IMeasure[]>>, token: string) => {
    AsyncStorage.getItem('measures')
        .then(measuresData => {
            if (measuresData) {
                setMeasures(JSON.parse(measuresData))
                return
            }
            getMeasures(setMeasures, token)
        })
        .catch(e => console.error('fetching measures', e))
}

const getMeasures = (setMeasures: React.Dispatch<React.SetStateAction<IMeasure[]>>, token: string) => {
    get({url: '/meta/measures', token})
        .then((measuresRes: IMeasure[]) => {
            setMeasures(measuresRes)
            AsyncStorage.setItem('measures', JSON.stringify(measuresRes))
        })
        .catch(logError)
}

export const fetchLanguages = (setLanguages: React.Dispatch<React.SetStateAction<Record<string, string>>>) => {
    get({
        url: '/public/languages',
    })
        .then((langs) => {
            setLanguages(langs)
        })
        .catch(logError)
}
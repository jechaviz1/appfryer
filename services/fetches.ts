import AsyncStorage from '@react-native-async-storage/async-storage'

import { get, post } from "@/services/apiRequests"
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

// Shopping List API Functions
export const addIngredientsFromRecipe = (
    ids: number[],
    portions: number,
    token: string
): Promise<IShoppingListItemByRecipe[]> => {
    return post({
        url: '/shoppingList/add/recipeIngredients',
        data: { ids, portions },
        token
    })
}

export const addIngredientManually = (
    ingredientId: number,
    measureId: number,
    cnt: number,
    token: string
): Promise<IShoppingListItemByRecipe[]> => {
    return post({
        url: '/shoppingList/add/ingredient',
        data: { ingredientId, measureId, cnt },
        token
    })
}

export const markIngredientAsChecked = (
    id: number,
    token: string
): Promise<any> => {
    return post({
        url: `/shoppingList/check/${id}`,
        token
    })
}

export const markIngredientAsUnchecked = (
    id: number,
    token: string
): Promise<any> => {
    return post({
        url: `/shoppingList/uncheck/${id}`,
        token
    })
}

export const deleteAllCheckedIngredients = (
    token: string
): Promise<IShoppingListItemByRecipe[]> => {
    return post({
        url: '/shoppingList/delete/checked',
        token
    })
}

// Weekly Plan API Functions
export const fetchWeeklyPlan = (
    mealDateFrom?: string,
    mealDateTo?: string,
    token?: string
): Promise<any[]> => {
    return post({
        url: '/plan',
        data: { mealDateFrom, mealDateTo },
        token
    })
}

export const editWeeklyPlan = (
    actions: Array<{
        action: 'add' | 'edit' | 'delete'
        id?: number
        mealDate?: string
        mealType?: 'breakfast' | 'lunch' | 'snack' | 'dinner'
        recipeId?: number
    }>,
    token: string
): Promise<any[]> => {
    return post({
        url: '/plan/edit',
        data: actions,
        token
    })
}
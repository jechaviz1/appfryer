import { useEffect, useState } from "react"
import { Dimensions, Image, Pressable, StyleSheet } from "react-native"
import { Slider } from '@miblanchard/react-native-slider'
import Modal from "react-native-modal"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from "react-i18next"

import { Button, IngredientButton, ScrollView, Text, View } from "@/components/base/BaseComponents"
import IngredientSearchInput from "@/components/IngredientSearchInput"
import { useAuth } from "@/contexts/authContext"
import { get, post } from "@/services/apiRequests"
import IPrefItem from "@/interfaces/PrefItem"
import IRecipe from "@/interfaces/Recipe"
import { Colors } from "@/constants/Colors"
import { theme, getBgColor, isLight } from "@/constants/Theme"
import { useSearchFilters } from "@/contexts/searchFiltersContext"
import { logError, isNeedToUpdate } from "@/services/utils"

interface IRating {
    title: string
    checked: boolean
}
interface IFilters {
    type?: 'new'| 'trend' | 'seasonal'
    categories: IPrefItem[]
    diets: IPrefItem[]
    ingredients: IPrefItem[]
    rating: IRating[]
    preparationTime: number[]
}

interface FiltersProps {
    isVisible: boolean
    onHide: () => void
    page: string
    personId?: number
    onSubmit: (recipes: IRecipe[]) => void
}

interface SearchParams {
    filterCategories?: string
    filterDiets?: string
    filterIngredientCategories?: string
    filterRating?: string
    filterPreparationTime?: string
    type?: 'new'| 'trend' | 'seasonal' | 'saved' | 'own'
    filterUserId?: number
}

export default function Filters({ isVisible, onHide, page, personId, onSubmit }: FiltersProps) {
    const blankSearchFilters: IFilters = {
        categories: [],
        diets: [],
        ingredients: [],
        rating: [],
        preparationTime: [0, 120],
    }

    const { t } = useTranslation()
    const { user } = useAuth()
    const { searchFilters, setSearchFilters } = useSearchFilters()

    const [categories, setCategories] = useState<IPrefItem[]>([])
    const [diets, setDiets] = useState<IPrefItem[]>([])
    const [showCategories, setShowCategories] = useState<boolean>(false)
    const [showDiets, setShowDiets] = useState<boolean>(false)
    const [filters, setFilters] = useState<IFilters>({...blankSearchFilters})

    const [ratings] = useState<IRating[]>([
        { title: '3.5', checked: false },
        { title: '4.0', checked: false },
        { title: '4.5', checked: false },
        { title: '5.0', checked: false },
    ])

    const handleToggleCategories = () => {
        setShowCategories(!showCategories)
    }

    const handleToggleCategory = (category: IPrefItem) => {
        toggleItem(category, 'categories')
    }

    const handleToggleDiets = () => {
        setShowDiets(!showDiets)
    }

    const handleToggleDiet = (diet: IPrefItem) => {
        toggleItem(diet, 'diets')
    }

    const handleRemoveIngredient = (ingredientId: number) => {
        removeIngredient(ingredientId)
    }

    const handleClearRating = () => {
        setFilters({ ...filters, rating: [] })
    }

    const handleToggleRating = (rating: IRating) => {
        if (filters.rating.filter((item: { title: string }) => item.title === rating.title).length > 0) {
            return setFilters({ ...filters, rating: filters.rating.filter((item: { title: string }) => item.title !== rating.title) })
        }
        setFilters({ ...filters, rating: [...filters.rating, rating] })
    }

    const handleClearFilters = () => {
        setFilters({...blankSearchFilters})
    }

    useEffect( () => {
        const fetchCategories = () => {
            get({ url: '/meta/categories', token: user?.token})
                .then(cats => {
                    setCategories(cats)
                    AsyncStorage.setItem('categories', JSON.stringify(cats))
                })
                .catch(logError)
        }

        const fetchDiets = () => {
            get({ url: '/meta/diets', token: user?.token})
                .then(dts => {
                    setDiets(dts)
                    AsyncStorage.setItem('diets', JSON.stringify(dts))
                })
                .catch(logError)
        }

        const nowString = JSON.stringify(new Date())
        isNeedToUpdate('filtersCategoriesLastUpdate').then(needToUpdate => {
            if (needToUpdate) {
                fetchCategories()
                AsyncStorage.setItem('filtersCategoriesLastUpdate', nowString)
                return
            }

            AsyncStorage.getItem('categories')
                .then(categoriesData => {
                    if (categoriesData) {
                        setCategories(JSON.parse(categoriesData))
                        return
                    }
                    fetchCategories()
                })
                .catch(e => console.error('fetching categories', e))
        })

        isNeedToUpdate('filtersDietsLastUpdate').then(needToUpdate => {
            if (needToUpdate) {
                fetchDiets()
                AsyncStorage.setItem('filtersDietsLastUpdate', nowString)
                return
            }
            AsyncStorage.getItem('diets')
                .then(dietsData => {
                    if (dietsData) {
                        setDiets(JSON.parse(dietsData))
                        return
                    }
                    fetchDiets()
                })
                .catch(e => console.error('fetching diets', e))
        })
    }, [])

    useEffect(() =>{
        if (!isVisible) {
            return
        }

        setFilters(searchFilters?.[page] || {...blankSearchFilters})
    }, [isVisible])

    const chevronUpLight = require('@/assets/icons/chevron-up-light.png')
    const chevronUpBlack = require('@/assets/icons/chevron-up-black.png')
    const chevronDownLight = require('@/assets/icons/chevron-down-light.png')
    const chevronDownBlack = require('@/assets/icons/chevron-down-black.png')
    const xIcon = require('@/assets/icons/x.png')
    const starFill = require('@/assets/icons/star-fill.png')

    const toggleItem = (it: IPrefItem, type: 'categories' | 'diets') => {
        const newFilters = {...filters}
        if (newFilters[type]?.filter((item: { id: number }) => item.id === it.id).length > 0) {
            newFilters[type] = newFilters[type]?.filter((item: { id: number }) => item.id !== it.id)
        } else {
            newFilters[type].push({
                id: it.id,
                title: it.title,
                icon: it.icon,
            })
        }
        setFilters(newFilters)
    }

    const removeIngredient = (id: number) => {
        const newFilters = {...filters}
        newFilters.ingredients = newFilters.ingredients?.filter((item: { id: number }) => item.id !== id)
        setFilters(newFilters)
    }

    const onSelectedIngredient = (ingredient: IPrefItem) => {
        const newFilters = {...filters}
        if (!newFilters.ingredients) {
            newFilters.ingredients = []
        }
        newFilters.ingredients.push(ingredient)
        setFilters(newFilters)
    }
    const window = Dimensions.get('window')

    const hideAndClear = () => {
        setFilters({...blankSearchFilters})
        onHide()
    }

    const prepareSearchParams = (): SearchParams | null => {
        let params: SearchParams = {}
        if (filters?.categories?.length > 0) {
            params.filterCategories = `[${filters.categories.map((item: { id: number }) => item.id).join(',')}]`
        }
        if (filters?.diets?.length > 0) {
            params.filterDiets = `[${filters.diets.map((item: { id: number }) => item.id).join(',')}]`
        }
        if (filters?.ingredients?.length > 0) {
            params.filterIngredientCategories = `[${filters.ingredients.map((item: { id: number }) => item.id).join(',')}]`
        }
        if (filters?.rating?.length > 0) {
            params.filterRating = filters.rating.map((item: { title: string }) => item.title).join(',')
        }
        if (filters?.preparationTime?.length > 0 && filters?.preparationTime?.[0] !== 0 && filters?.preparationTime?.[1] !== 120) {
            params.filterPreparationTime = `[${filters.preparationTime.join(',')}]`
        }
        if (page === 'me') {
            params.type = 'own'
        }
        if (page === 'otherProfile' && personId !== user?.id) {
            params.filterUserId = personId
        }
        if (filters?.type) {
            params.type = filters.type
        }

        if (Object.keys(params).length === 0) {
            return null
        }

        return params
    }

    const onViewRecipes = () => {
        setSearchFilters({...searchFilters, [page]: filters})
        hideAndClear()

        post({ url: '/feed', data: prepareSearchParams(), token: user?.token })
            .then(res => {
                onSubmit(res)
            })
            .catch(logError)
    }

    return (
        <Modal
            isVisible={isVisible}
            style={[theme.modal, s.modalView, {backgroundColor: '#FFFFFF', marginTop: window.height * 0.15}]}
            onModalHide={hideAndClear}
            onBackdropPress={hideAndClear}
        >
            <ScrollView>
                <View style={{ width: '100%' }}>
                    <Pressable onPress={hideAndClear} style={{ alignSelf: 'flex-end' }}>
                        <Image source={xIcon} style={{ width: 18, height: 18 }} />
                    </Pressable>
                </View>
                <Text type="subtitle" style={{ alignSelf: 'flex-start' }}>{t('Filters')}</Text>

                {/* Categories */}
                <View style={s.sections}>
                    <View style={s.section}>
                        <Pressable onPress={handleToggleCategories} style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={s.sectionTitle}>{t('Categories')}</Text>
                            <Image source={showCategories ? (isLight() ? chevronUpBlack : chevronUpLight) : (isLight() ? chevronDownBlack : chevronDownLight)} style={s.chevron} />
                        </Pressable>
                        { showCategories && <View style={s.items}>
                        {categories.map((category, index) => {
                            const isSelected = filters?.categories?.filter(
                                (item: { id: number, title: string }) => item.id === category.id)
                                .length > 0 || false

                            return (
                                <Button
                                    key={index}
                                    text={category.title}
                                    shape="round"
                                    size="small"
                                    style={[
                                        s.itemBtn,
                                        {backgroundColor: isLight() ? '#F5F5F5' : '#F5F5F510'},
                                        isSelected ? s.itemSelected : {}
                                    ]}
                                    textStyle={isSelected ? s.itemTextSelected : {color: isLight() ? '#000000A6' : '#FFFFFFA6'}}
                                    onPress={() => handleToggleCategory(category)}
                                />
                            )}
                        )}
                        </View> }
                    </View>

                    {/* Diets */}
                    {/* <View style={s.section}>
                        <Pressable onPress={handleToggleDiets} style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={s.sectionTitle}>{t('Diets')}</Text>
                            <Image source={showDiets ? (isLight() ? chevronUpBlack : chevronUpLight) : (isLight() ? chevronDownBlack : chevronDownLight)} style={s.chevron} />
                        </Pressable>

                        { showDiets && <View style={s.items}>
                        {diets.map((diet, index) => {
                            const isSelected = filters?.diets?.filter(
                                (item: { id: number, title: string }) => item.id === diet.id)
                                .length > 0 || false

                            return (
                                <Button
                                    key={index}
                                    text={diet.title}
                                    shape="round"
                                    size="small"
                                    style={[
                                        s.itemBtn,
                                        {backgroundColor: isLight() ? '#F5F5F5' : '#F5F5F510'},
                                        isSelected ? s.itemSelected : {}
                                    ]}
                                    textStyle={isSelected ? s.itemTextSelected : {color: isLight() ? '#000000A6' : '#FFFFFFA6'}}
                                    onPress={() => handleToggleDiet(diet)}
                                />
                            )}
                        )}
                        </View> }
                    </View> */}
                    
                    {/* Ingredients */}
                    <View style={s.section}>
                        <View style={s.ingredientsSection}>
                            <Text style={[s.sectionTitle, {top: 14}]}>{t('Ingredients')}</Text>
                            <IngredientSearchInput
                                selected={filters.ingredients}
                                onSelectedIngredient={ingredient => onSelectedIngredient(ingredient as IPrefItem)}
                            />
                        </View>
                        <View style={s.items}>
                            {filters.ingredients.map((ingredient, index) => (
                                <IngredientButton
                                    ingredient={ingredient}
                                    key={index}
                                    needRemoveIcon={true}
                                    onPress={() => handleRemoveIngredient(ingredient.id)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Preparation time */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>{t('Preparation time')}</Text>
                        <Slider
                            value={filters.preparationTime || [0, 120]}
                            step={5}
                            onValueChange={value => setFilters({ ...filters, preparationTime: value })}
                            minimumValue={0}
                            maximumValue={120}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbTintColor={Colors.white}
                            thumbStyle={s.thumbs}
                        />
                        <Text>{filters?.preparationTime?.[0] || 0} - {filters?.preparationTime?.[1] || 120} {t('minutes')}</Text>
                    </View>

                    {/* Rating */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>{t('Rating')}</Text>
                        <View style={s.items}>
                            <Button
                                text={t('Any')}
                                shape="round"
                                size="small"
                                style={[
                                    s.itemBtn,
                                    {backgroundColor: isLight() ? '#F5F5F5' : '#F5F5F510'},
                                    !filters?.rating || filters?.rating?.length === 0 ? s.itemSelected : {}
                                ]}
                                textStyle={
                                    !filters?.rating || filters?.rating?.length === 0
                                        ? s.itemTextSelected
                                        : { color: isLight() ? '#000000A6' : '#FFFFFFA6' }}
                                onPress={handleClearRating}
                            />
                            {ratings.map((rating, index) => {
                                const isSelected = filters?.rating?.filter(
                                    (item: { title: string }) => item.title === rating.title).length > 0 || false
                                return <Button
                                        key={index}
                                        text={rating.title}
                                        shape="round"
                                        size="small"
                                        postIcon={starFill}
                                        style={[
                                            s.itemBtn,
                                            {backgroundColor: isLight() ? '#F5F5F5' : '#F5F5F510'},
                                            isSelected ? s.itemSelected : {}
                                        ]}
                                        textStyle={isSelected ? s.itemTextSelected : {color: isLight() ? '#000000A6' : '#FFFFFFA6'}}
                                        onPress={() => handleToggleRating(rating)}
                                    />
                                }
                            )}
                        </View>
                    </View>

                    <View style={s.line}/>

                    <View style={{ alignSelf: 'flex-end', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <Pressable onPress={handleClearFilters} style={s.clearBtn}>
                            <Image source={xIcon} style={{ width: 13, height: 13 }} />
                            <Text>{t('Clear filters')}</Text>
                        </Pressable>
                        
                        <Button
                            text={t('View recipes')}
                            onPress={onViewRecipes}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </ScrollView>
        </Modal>
    )
}

const s = StyleSheet.create({
    modalView: {
        marginTop: '25%',
        justifyContent: 'flex-start',
        paddingTop: 16,
    },
    sections: {
        marginTop: 15,
        gap: 30,
        width: '100%',
    },
    ingredientsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    section: {
        
    },
    items: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    itemBtn: {
        paddingHorizontal: 15,
        width: 'auto',
    },
    itemTextSelected: {
        fontWeight: 500,
        fontFamily: 'DMSans-Medium',
    },
    itemSelected: {
        backgroundColor: Colors.mainColor,
    },
    sectionTitle: {
        alignSelf: 'flex-start',
        fontSize: 15,
        fontFamily: 'DMSans-Bold',
    },
    chevron: {
        width: 16,
        height: 16,
    },
    thumbs: {
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    line: {
        height: 1,
        width: '100%',
        marginTop: 20,
        backgroundColor: Colors.lightGrey,
    },
    clearBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
})
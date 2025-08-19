import { useCallback, useEffect, useRef, useState } from "react"
import { Image, Keyboard, Pressable, StyleSheet, TextInput as TextInputNative } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from "react-i18next"

import { ScrollView, Text, TextInput, View } from '@/components/base/BaseComponents'
import ImageLibrary from "@/components/ImageLibrary"
import IIngredinent from "@/interfaces/Ingredient"
import IPrefItem from "@/interfaces/PrefItem"
import { useAuth } from "@/contexts/authContext"
import { get, post } from "@/services/apiRequests"
import { logError, isNeedToUpdate } from "@/services/utils"
import { Colors } from "@/constants/Colors"

interface Props {
    placeholder?: string
    type?: 'ingredient' | 'category'
    selected: (IPrefItem | IIngredinent | null)[]
    onSelectedIngredient: (ingredient: IPrefItem | IIngredinent) => void
    textInputStyle?: any
}

export default function IngredientSearchInput({
    placeholder,
    type='category',
    selected=[],
    onSelectedIngredient,
    textInputStyle,
}: Props) {
    const inputRef = useRef(null)
    const { user } = useAuth()
    const { t } = useTranslation()

    const [val, setVal] = useState<string>('')
    const [ingredients, setIngredients] = useState<IIngredinent[]>([])
    const [categories, setCategories] = useState<IPrefItem[]>([])
    const [filtered, setFiltered] = useState<(IPrefItem | IIngredinent)[]>([])

    const fetchIngredients = useCallback(() => {
        get({ url: '/ingredient/all', token: user?.token})
            .then(ings => {
                setIngredients(ings)
                AsyncStorage.setItem('ingredients', JSON.stringify(ings))
            })
            .catch(logError)
    }, [])

    const fetchCategories = useCallback(() => {
        post({ url: '/ingredient/categories', token: user?.token})
            .then(cats => {
                setCategories(cats)
                AsyncStorage.setItem('ingredientCategories', JSON.stringify(cats))
            })
            .catch(logError)
    }, [])

    useEffect(() => {
        isNeedToUpdate('filtersCategoriesLastUpdate').then(needToUpdate => {
            if (needToUpdate) {
                fetchCategories()
                AsyncStorage.setItem('filtersCategoriesLastUpdate', JSON.stringify(new Date()))
                return
            }
            AsyncStorage.getItem('ingredientCategories')
                .then(categoriesData => {
                    if (categoriesData) {
                        setCategories(JSON.parse(categoriesData))
                        return
                    }
                    fetchCategories()
                })
                .catch(e => console.error('fetching categories', e))
        })

        isNeedToUpdate('filtersIngredientsLastUpdate').then(needToUpdate => {
            if (needToUpdate) {
                fetchIngredients()
                AsyncStorage.setItem('filtersIngredientsLastUpdate', JSON.stringify(new Date()))
                return
            }
            AsyncStorage.getItem('ingredients')
                .then(ingredientsData => {
                    if (ingredientsData) {
                        setIngredients(JSON.parse(ingredientsData))
                        return
                    }
                    fetchIngredients()
                })
                .catch(e => console.error('fetching ingredients', e))
        })
    }, [])

    const onChange = useCallback((val: string) => {
        setVal(val)
        if (val.length < 2) {
            return setFiltered([])
        }
        const t = type === 'category' ? categories : ingredients
        const selectedTitles = selected.map(item => item?.title)
        
        setFiltered(
            t.filter(item => item.title!.toLowerCase().includes(val.toLowerCase()))
                .filter(item => {
                    return !selectedTitles.includes(item.title)
                })
        )
    }, [val, selected])

    return (
        <View style={s.container}>
            <TextInput
                ref={inputRef}
                value={val}
                autoCorrect={false}
                styleContainer={[s.inputContainer, textInputStyle]}
                startIcon={require('@/assets/icons/search.png')}
                placeholder={placeholder || t('Search...')}
                onChangeText={onChange}
                onBlur={() => Keyboard.dismiss()}
            />

            { filtered.length > 0 && <ScrollView style={s.popup}>
                {filtered.map(ing => (
                    <Pressable
                        key={ing.id}
                        style={s.item}
                        onPress={() => {
                            inputRef.current && (inputRef.current as TextInputNative).clear()
                            setFiltered([])
                            onSelectedIngredient(ing)
                        }}
                    >
                        <Image
                            source={type === 'category'
                                ? ImageLibrary.icons[(ing as IPrefItem).icon as keyof typeof ImageLibrary.icons]
                                : ImageLibrary.icons[(ing as IIngredinent).category.icon as keyof typeof ImageLibrary.icons]
                            }
                            style={{width: 22, height: 22}}
                        />
                        <Text style={{flex: 1}}>{ing.title}</Text>
                    </Pressable>
                ))}
            </ScrollView> }
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
    },
    inputContainer: {
        backgroundColor: '#00000008',
        borderWidth: 0,
        // flex: 1,
    },
    popup: {
        flex: 1,
        position: 'relative',
        zIndex: 100,
        left: 0,
        width: '100%',
        maxHeight: 200,
        borderColor: Colors.lightGrey,
        borderWidth: 1,
        borderRadius: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 8,
    },
})
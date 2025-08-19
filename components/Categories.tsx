import { useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import ICategory from '@/interfaces/Category'
import { Text, View } from '@/components/base/BaseComponents'
import { get } from '@/services/apiRequests'
import { useAuth } from "@/contexts/authContext"
import { Colors } from '@/constants/Colors'
import { theme } from '@/constants/Theme'
import { logError, isNeedToUpdate } from "@/services/utils"

interface CategoryProps {
    category: ICategory
    onPress?: () => void
}

function Category({category, onPress}: CategoryProps) {
    return (
        <Pressable style={s.category} onPress={onPress}>
            <Image source={{uri: category.photo}} style={s.categoryImage} />
            <LinearGradient colors={['#00000000', '#000000b2']} style={s.categoryGradient} />
            <Text style={[theme.bold, s.categoryTitle]}>{category.title}</Text>
        </Pressable>
    )
}

export default function Categories({style}: {style?: any}) {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useTranslation()

    const [categories, setCategories] = useState<ICategory[]>([])

    useEffect(() => {
        const fetchCategories = () => {
            get({ url: '/meta/categories', token: user?.token})
                .then(cats => {
                    AsyncStorage.setItem('categories', JSON.stringify(cats))
                    const preparedCats: ICategory[] = cats.map((cat: any) => ({...cat, photo: cat.photo ?? 'https://picsum.photos/600'}))
                    setCategories(preparedCats)
                })
                .catch(logError)
        }

        isNeedToUpdate('filtersCategoriesLastUpdate').then(needToUpdate => {
            if (needToUpdate) {
                const nowString = JSON.stringify(new Date())
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
    }, [])

    return (
        <View style={[style, s.container]}>
            <Text type="caption" style={{ marginBottom: 12 }}>{t('Categories')}</Text>

            <View style={[s.categories, {}]}>
                {categories.map((category) => <Category
                    key={category.id}
                    category={category}
                    onPress={() => router.push({pathname: '/(pages)/feed', params: {title: category.title, filterCategories: category.id}})}
                />)}
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    container: {

    },
    categories: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,

    },
    category: {
        width: '48%',
        height: 93,
        borderRadius: 14,
    },
    categoryImage: {
        height: 93,
        borderRadius: 14,
        resizeMode: 'center',
    },
    categoryGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 14,
    },
    categoryTitle: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        color: Colors.white,
    },
})
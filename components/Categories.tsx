import { useEffect, useState } from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import ICategory from '@/interfaces/Category'
import { Text, View } from '@/components/base/BaseComponents'
import { get } from '@/services/apiRequests'
import { useAuth } from "@/contexts/authContext"
import { Colors } from '@/constants/Colors'
import { theme, getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor } from '@/constants/Theme'
import { logError, isNeedToUpdate } from "@/services/utils"
import { useTheme } from '@/contexts/themeContext'


interface CategoryProps {
    category: ICategory
    onPress?: () => void
    styles: any
}

function Category({category, onPress, styles}: CategoryProps) {
    return (
        <Pressable 
            style={styles.categoryItem}
            onPress={onPress}
        >
            {category.icon && category.icon.trim() !== '' ? (
                <Image source={{uri: category.icon}} style={styles.categoryIcon} />
            ) : (
                <View style={[styles.categoryIcon, styles.placeholderIcon]} />
            )}
            <Text style={styles.categoryText}>
                {category.title}
            </Text>
        </Pressable>
    )
}

export default function Categories({style}: {style?: any}) {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useTranslation()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

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

    const renderCategoryItem = ({ item }: { item: ICategory }) => (
        <Category
            key={item.id}
            category={item}
            styles={s}
            onPress={() => router.push({pathname: '/(pages)/feed', params: {title: item.title, filterCategories: item.id}})}
        />
    )

    return (
        <View style={[style, s.container]}>
            <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={s.categories}
            />
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {

    },
    categories: {
        flexDirection: 'row',
        gap: 15,
    },
    categoryItem: {
        alignItems: 'center',
        backgroundColor: isDark ? '#374151' : '#FCEEE1',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 10,
        minWidth: 83,
    },
    categoryItemSelected: {
        backgroundColor: Colors.mainColor,
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryIcon: {
        width: 32,
        height: 32,
        marginBottom: 8,
        borderRadius: 16,
    },
    categoryText: {
        fontSize: 16,
        color: isDark ? Colors.dark.text : '#4F4240',
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
        lineHeight: 18,
    },
    categoryTextSelected: {
        color: Colors.white,
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
    placeholderIcon: {
        backgroundColor: isDark ? '#4b5563' : '#E0E0E0', // A neutral color for the placeholder
    },
})
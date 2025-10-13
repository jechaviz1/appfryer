import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { IngredientButton, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Notifications from '@/components/modals/Notifications'
import Stories from '@/components/Stories'
import Search from '@/components/Search'
import RecipeBrief from '@/components/RecipeBrief'
import { theme, isLight, getBgColor, getCardBackground, getTextColor, getShadowColor } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { useTheme } from '@/contexts/themeContext'
import { useSearchFilters } from '@/contexts/searchFiltersContext'
import { useAppState } from '@/contexts/appStateContext'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IPrefItem from "@/interfaces/PrefItem"
import IRecipe from '@/interfaces/Recipe'
import IFolder from '@/interfaces/Folder'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'

const storiesFake = [
    { id: 1, image: 'https://picsum.photos/200', name: 'Shiovan', link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 2, image: 'https://picsum.photos/200', name: 'Marcia Hernandez', link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 3, image: 'https://picsum.photos/200', name: 'Greg Egan', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
    { id: 4, image: 'https://picsum.photos/200', name: 'Emma', viewed: true, link: 'https://videos.pexels.com/video-files/7929005/7929005-hd_1080_1920_24fps.mp4' },
    { id: 5, image: 'https://picsum.photos/200', name: 'Jaime', viewed: true, link: 'https://videos.pexels.com/video-files/7204663/7204663-hd_1080_1920_24fps.mp4' },
    { id: 6, image: 'https://picsum.photos/200', name: 'Miguel', viewed: true, link: 'https://videos.pexels.com/video-files/7929021/7929021-hd_1080_1920_24fps.mp4' },
]

export default function CreateScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const { user } = useAuth()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const [createOptions] = useState([
        {title: 'Create Recipe', icon: require('@/assets/icons/recipe.png'), action: 'recipe'},
        {title: 'Create Folder', icon: require('@/assets/icons/folder.png'), action: 'folder'},
        {title: 'Create Story', icon: require('@/assets/icons/video-triangle.png'), action: 'story'},
    ])

    const handleCreateAction = useCallback((action: string) => {
        switch(action) {
            case 'recipe':
                router.push('/(pages)/create-recipe' as any)
                break
            case 'folder':
                router.push('/(pages)/create-folder' as any)
                break
            case 'story':
                router.push('/(pages)/create-story' as any)
                break
            default:
                break
        }
    }, [router])

    return (
        <View style={[theme.container, { backgroundColor: getBgColor() }]}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={[theme.mainContainer, { backgroundColor: getBgColor() }]}>
                <View style={[s.titleContainer, { marginBottom: 20 }]}>
                    <Text type="subtitle">{t('Create')}</Text>
                </View>
                <View style={s.createOptions}>
                    {createOptions.map((option, index) => (
                        <Pressable 
                            key={option.action} 
                            style={s.createOption} 
                            onPress={() => handleCreateAction(option.action)}
                        >
                            <View style={s.createOptionIcon}>
                                <Image source={option.icon} style={s.createOptionIconImg} />
                            </View>
                            <Text style={s.createOptionText}>{t(option.title)}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    titleContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'transparent',
    },
    createOptions: {
        gap: 20,
        backgroundColor: 'transparent',
    },
    createOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: getCardBackground(),
        padding: 20,
        borderRadius: 12,
        shadowColor: getShadowColor(),
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    createOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.mainColor + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    createOptionIconImg: {
        width: 24,
        height: 24,
        tintColor: Colors.mainColor,
    },
    createOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: getTextColor(),
        fontFamily: 'Poppins-Medium',
    },
})

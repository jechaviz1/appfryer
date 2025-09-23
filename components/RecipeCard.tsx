import { Image, Pressable, StyleSheet, Dimensions, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import { Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { theme } from '@/constants/Theme'
import { useAuth } from '@/contexts/authContext'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'

const window = Dimensions.get('window')

export interface IRecipeCard {
    id: number
    image: string
    title: string
    profileName: string
    cntLikes?: number
    cntComments?: number
    isDraft?: boolean
}

export default function RecipeCard({recipe, bookmarkedRecipes, toggleBookmark, disableBookmarkAction}: {
    recipe: IRecipeCard
    bookmarkedRecipes?: Set<number>
    toggleBookmark?: (recipeId: number) => void
    disableBookmarkAction?: boolean
}) {
    const { t } = useTranslation()
    const router = useRouter()

    return (
        <Pressable 
            style={[s.recipeCard, { width: window.width - 48 }]}
            onPress={() => router.push(`/(pages)/recipe/${recipe.id}`)}
        >
            {recipe.image && recipe.image.trim() !== '' ? (
                <Image source={{ uri: recipe.image }} style={s.recipeImage} />
            ) : (
                <View style={[s.recipeImage, s.placeholderImage]} />
            )}
            <LinearGradient
                colors={["#000000", "rgba(217, 217, 217, 0)"]}
                locations={[0.04, 1]}       // 4.07% and 100%
                start={{ x: 0.5, y: 0 }}    // top center
                end={{ x: 0.5, y: 1 }}      // bottom center
                style={s.recipeCardHeader}
            >
                <View style={s.recipeCardUser}>
                    <Image source={require('@/assets/icons/person-round.png')} style={s.userIcon} />
                    <View style={s.recipeCardUserInfo}>
                        <Text style={s.recipeUserName}>{recipe.profileName}</Text>
                        <Text style={s.userCategory}>
                            {t('Recipe')}
                        </Text>
                    </View>
                </View>
                {recipe.isDraft && (
                    <View style={[s.recipeMark, s.recipeDraft]}>
                        <Text style={s.recipeTypeText}>{t('Draft')}</Text>
                    </View>
                )}
            </LinearGradient>
            <View style={s.recipeCardFooter}>
                <View style={s.footerSection}>
                    <View style={s.engagementMetrics}>
                        <Pressable 
                            style={s.metricItem}
                            onPress={() => {
                                console.log('Like toggled for recipe:', recipe.id)
                            }}
                        >
                            <Image source={require('@/assets/icons/liked.png')} style={s.metricIcon} />
                            <Text style={s.metricText}>{recipe.cntLikes ?? 0}</Text>
                        </Pressable>
                        <Pressable 
                            style={s.metricItem}
                            onPress={() => {
                                console.log('Comment pressed for recipe:', recipe.id)
                            }}
                        >
                            <Image source={require('@/assets/icons/chat-box.png')} style={s.metricIcon} />
                            <Text style={s.metricText}>{recipe.cntComments ?? 0}</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={s.footerSection}>
                    <View style={s.paginationDots}>
                        <View style={[s.dot, s.dotActive]} />
                        <View style={[s.dot, s.dotInactive]} />
                        <View style={[s.dot, s.dotInactive]} />
                    </View>
                </View>
                <View style={s.footerSection}>
                    {toggleBookmark && (
                        <Pressable 
                            style={s.bookmarkBtn}
                            onPress={() => toggleBookmark(recipe.id)}
                            disabled={disableBookmarkAction}
                        >
                            <Image 
                                source={
                                    bookmarkedRecipes?.has(recipe.id)
                                        ? require('@/assets/icons/ribbon-filled.png')
                                        : require('@/assets/icons/ribbon.png')
                                } 
                                style={[
                                    s.bookmarkIcon,
                                    disableBookmarkAction && s.bookmarkIconDisabled
                                ]} 
                            />
                        </Pressable>
                    )}
                </View>
            </View>
            
            <Text style={s.recipeTitle}>{recipe.title}</Text>
            <Text style={s.recipeTime}>
                {t('Just published')}
            </Text>
        </Pressable>
    )
}

const s = StyleSheet.create({
    // Recipe Card - EXACTLY same as explore page
    recipeCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
    },
    recipeMark: {
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 8,
        backgroundColor: Colors.disabledButton,
    },
    recipeDraft: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    recipeTypeText: {
        color: Colors.white,
    },
    recipeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        position: 'absolute',
        width: '100%',
        zIndex: 2,
        height: 160,
    },
    recipeCardUser: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'transparent',
    },
    recipeCardUserInfo: {
        backgroundColor: 'transparent',
    },
    userIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        tintColor: Colors.white,
    },
    recipeUserName: {
        fontSize: 16,
        lineHeight: 22,
        color: Colors.white,
        fontFamily: 'Poppins-SemiBold',
        backgroundColor: 'transparent',
    },
    userCategory: {
        fontSize: 13,
        lineHeight: 17,
        color: Colors.white,
        fontFamily: 'Poppins',
        backgroundColor: 'transparent',
    },
    bookmarkBtn: {
        flexDirection: 'row',
        padding: 6,
        justifyContent: 'flex-end',
        borderRadius: 4,
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
    },
    bookmarkIconDisabled: {
        opacity: 0.5,
    },
    recipeImage: {
        width: '100%',
        height: 450,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
    },
    placeholderImage: {
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        borderRadius: 14,
    },
    footerSection: {
        flex: 1,
        justifyContent: 'center',
    },
    engagementMetrics: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricIcon: {
        width: 24,
        height: 24,
    },
    metricText: {
        fontSize: 14,
        lineHeight: 18,
        color: '#919191',
        fontFamily: 'Poppins',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: Colors.mainColor,
    },
    dotInactive: {
        backgroundColor: '#e0e0e0',
    },
    recipeTitle: {
        fontSize: 16,
        color: Colors.black,
        marginBottom: 6,
        fontFamily: 'Poppins',
        paddingHorizontal: 16,
        lineHeight: 22,
    },
    recipeTime: {
        fontSize: 13,
        color: '#919191',
        fontFamily: 'Poppins',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
})
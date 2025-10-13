import { Image, Pressable, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { Text, View } from '@/components/base/BaseComponents'
import { useSavedRecipe } from '@/contexts/savedRecipeContext'
import { Colors } from '@/constants/Colors'
import { theme, getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor, getShadowColor } from '@/constants/Theme'
import { useTheme } from '@/contexts/themeContext'

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
    const { showSavedRecipeModal } = useSavedRecipe()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const handleRecipePress = () => {
        router.push(`/(pages)/recipe/${recipe.id}`)
    }

    const handleLikePress = () => {
        console.log('Like toggled for recipe:', recipe.id)
    }

    const handleCommentPress = () => {
        console.log('Comment pressed for recipe:', recipe.id)
    }

    const handleBookmarkPress = () => {
        if (toggleBookmark) {
            // Check if this is a save action (not currently bookmarked)
            const isCurrentlyBookmarked = bookmarkedRecipes?.has(recipe.id) || false
            if (!isCurrentlyBookmarked) {
                // This is a save action, show the SavedRecipe modal
                toggleBookmark(recipe.id)
                showSavedRecipeModal(recipe.id)
            } else {
                // This is an unsave action, just toggle without showing modal
                toggleBookmark(recipe.id)
            }
        }
    }

    return (
        <Pressable 
            style={[s.recipeCard, { width: window.width - 48 }]}
            onPress={handleRecipePress}
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
                            onPress={handleLikePress}
                        >
                            <Image source={require('@/assets/icons/liked.png')} style={s.metricIcon} />
                            <Text style={s.metricText}>{recipe.cntLikes ?? 0}</Text>
                        </Pressable>
                        <Pressable 
                            style={s.metricItem}
                            onPress={handleCommentPress}
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
                            onPress={handleBookmarkPress}
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

const createStyles = (isDark: boolean) => StyleSheet.create({
    // Recipe Card - EXACTLY same as explore page
    recipeCard: {
        backgroundColor: getCardBackground(),
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: getShadowColor(),
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        backgroundColor: isDark ? Colors.dark.borderColor : '#f5f5f5',
        borderRadius: 10,
    },
    placeholderImage: {
        backgroundColor: isDark ? Colors.dark.borderColor : '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: getCardBackground(),
        borderRadius: 14,
    },
    footerSection: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    engagementMetrics: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'transparent',
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
        color: getSecondaryTextColor(),
        fontFamily: 'Poppins',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: 'transparent',
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
        backgroundColor: isDark ? Colors.dark.borderColor : '#e0e0e0',
    },
    recipeTitle: {
        fontSize: 16,
        color: getTextColor(),
        marginBottom: 6,
        fontFamily: 'Poppins',
        paddingHorizontal: 16,
        lineHeight: 22,
    },
    recipeTime: {
        fontSize: 13,
        color: getSecondaryTextColor(),
        fontFamily: 'Poppins',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
})
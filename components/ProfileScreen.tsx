import { Dimensions, Image, Platform, Pressable, StyleSheet, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { launchMediaLibrary } from '@/services/mediaPicker'
import { useRouter } from "expo-router"
import { useTranslation } from 'react-i18next'

import { Button, Text, View } from "@/components/base/BaseComponents"
import Search from '@/components/Search'
import Challenges from '@/components/Challenges'
import Achievements from '@/components/Achievements'
import { post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import { theme, paddings, isLight, getBgColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import IRecipe, { RecipeStatus } from '@/interfaces/Recipe'
import RecipeCard from './RecipeCard'
import { MediaType } from '@/interfaces/Media'

interface IProfileScreenProps {
    page: string
    person: { [key: string]: any } | null
    initRecipes: IRecipe[]
}

export default function ProfileScreen({page, person, initRecipes}: IProfileScreenProps) {
    const router = useRouter()
    const { user, setUser } = useAuth()
    const { t } = useTranslation()

    const [activeTab, setActiveTab] = useState<number>(0)
    const [avatar, setAvatar] = useState<any>(null)
    const [avatarError, setAvatarError] = useState<string>('')
    const [interests, setInterests] = useState<string[]>([])
    const [recipes, setRecipes] = useState<IRecipe[]>(initRecipes)
    const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Set<number>>(new Set())
    const [disableBookmarkAction, setDisableBookmarkAction] = useState<boolean>(false)

    useEffect(() => {
        setRecipes(initRecipes)
    }, [initRecipes])

    useEffect(() => {
        // prime bookmark set from current recipes
        const next = new Set<number>()
        recipes?.forEach((r: IRecipe) => {
            if (r.isSaved) {
                next.add(r.id)
            }
        })
        setBookmarkedRecipes(next)
    }, [recipes])

    useEffect(() => {
        person?.profileImage
            ? setAvatar({uri: person.profileImage})
            : setAvatar(require('@/assets/images/icon.png'))
    }, [person?.profileImage])

    useEffect(() => { 
        if (person?.interests) {
            const interestsTmp = person?.interests
                .map((item: any) => item.title)
            setInterests(interestsTmp)
        }
    }, [person?.interests])

    // No-op: FlatList removed; activeTab now switches content via conditional render

    const uploadAvatar = async () => {
        try {
            const pickerResponse = await launchMediaLibrary({ mediaType: 'photo' })

            if (pickerResponse.errorCode) {
                setAvatarError(pickerResponse.errorMessage || t('Failed to open image picker'))
                return
            }

            if (!pickerResponse.assets || pickerResponse.assets.length === 0 || !pickerResponse.assets[0].uri) {
                return
            }

            const pickedAsset = pickerResponse.assets[0]
            setAvatarError('')

            post({
                url: '/profile/update',
                files: [['profileImage', {
                    uri: Platform.OS === 'ios' ? pickedAsset.uri!.replace('file://', '') : pickedAsset.uri!,
                    type: pickedAsset.type,
                    name: pickedAsset.fileName,
                }]],
                token: person?.token
            })
                .then(userData => {
                    setUser({ ...person, ...userData })

                    userData.profileImageHq
                        ? setAvatar({uri: userData.profileImageHq})
                        : setAvatar(require('@/assets/images/icon.png'))
                })
                .catch(e => {
                    if (e.response) {
                        setAvatarError(e.response.data.message)
                        console.log(e.response.status, e.response.data)
                    }
                })
        } catch (error) {
            setAvatarError(t('Failed to open image picker'))
        }
    }

    const window = Dimensions.get('window')
    
    const modifyRecipesForCards = (input: IRecipe[]) => {
        return input.map((r: IRecipe) => {
            const img = r.medias?.find((media: any) => media.type == MediaType.IMAGE)
            return {
                id: r.id,
                title: r.title,
                image: img?.url || '',
                profileName: r.userFullname,
                cntLikes: r.cntLikes,
                cntComments: r.cntComments,
                isDraft: r.status === RecipeStatus.DRAFT,
            }
        })
    }

    const toggleBookmark = (recipeId: number) => {
        if (disableBookmarkAction) {
            return
        }
        const isCurrentlyBookmarked = bookmarkedRecipes.has(recipeId)
        const url = `/recipe/${recipeId}/${isCurrentlyBookmarked ? 'unsave' : 'save'}`

        setDisableBookmarkAction(true)
        post({ url, token: user?.token })
            .then((response) => {
                if (response.isSaved) {
                    setBookmarkedRecipes(prev => {
                        const next = new Set(prev)
                        next.add(recipeId)
                        return next
                    })
                } else {
                    setBookmarkedRecipes(prev => {
                        const next = new Set(prev)
                        next.delete(recipeId)
                        return next
                    })
                }
                setDisableBookmarkAction(false)
            })
            .catch((error) => {
                setDisableBookmarkAction(false)
                console.log(error)
                Alert.alert(
                    'Error',
                    t('Could not update bookmark. Please try again.')
                )
            })
    }

    const renderTab = (tab: { item: string, index: number }) => {
        if (tab.item === 'recipes') {
            const recipeCards = modifyRecipesForCards(recipes)
            return (
                <View style={[theme.tabInner, {flexDirection: 'column', justifyContent: 'flex-start', width: window.width - paddings * 2}]}> 
                    <Search page={page} onSearch={setRecipes} personId={person?.id} />
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>{t('My recipes')}</Text>
                            <Pressable onPress={() => router.navigate('/(tabs)/explore')}>
                                <Text style={s.seeAllText}>{t('See all')}</Text>
                            </Pressable>
                        </View>
                        <View style={[s.recipesWrapper, {width: window.width - paddings * 2}]}> 
                            {recipeCards.map(card => (
                                <RecipeCard
                                    key={card.id}
                                    recipe={card}
                                    bookmarkedRecipes={bookmarkedRecipes}
                                    toggleBookmark={toggleBookmark}
                                    disableBookmarkAction={disableBookmarkAction}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            )
        }

        return (
            <View style={[theme.tabInner, { width: window.width - paddings * 2, flexDirection: 'column', justifyContent: 'flex-start'}]}> 
                {/* Challenges Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Challenges')}</Text>
                        <Pressable onPress={() => router.navigate('/(tabs)/explore')}>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    <Challenges />
                </View>

                {/* Your Achievements (compact row) */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Your achievements')}</Text>
                        <Pressable onPress={() => router.navigate('/(tabs)/explore')}>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    <Achievements variant='compact' style={{ backgroundColor: getBgColor() }} />
                </View>

                {/* Achievements full list */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('Achievements')}</Text>
                        <Pressable onPress={() => router.navigate('/(tabs)/explore')}>
                            <Text style={s.seeAllText}>{t('See all')}</Text>
                        </Pressable>
                    </View>
                    <Achievements style={{ backgroundColor: getBgColor() }} />
                </View>
            </View>
        )
    }

    const greyTextColor = isLight() ? Colors.grey : Colors.lightGrey

    return (
        <View style={[theme.container, { marginBottom: 0 }]}>
            <View style={s.profileContainer}>
                <View style={s.profileOverview}>
                    <Pressable onPress={() => {person?.id === user?.id && uploadAvatar()}}>
                        { avatar && <Image source={ avatar } style={s.avatar} /> }
                    </Pressable>
                    <View style={s.profileTextWrap}>
                        {avatarError !== '' && <Text type='error'>{avatarError}</Text> }
                        <Text style={s.fullname} type='subtitle'>{person?.fullname}</Text>
                        <Text style={s.email} type='link' >{person?.email}</Text>
                        <Text style={[s.interestsText, { color: greyTextColor }]}>{interests?.join(', ')}</Text>
                    </View>
                </View>

                {/* Statistics */}
                {user?.isRoleCreator && <View style={s.stats}>
                    <View style={s.statBox}>
                        <Text style={s.statValue} type='subtitle'>{person?.recipesCnt}</Text>
                        <Text style={s.statLabel}>{t('Recipes')}</Text>
                    </View>
                    <View style={s.statDivider} />

                    <Pressable style={s.statBox} onPress={() => {
                        person?.id === user?.id && router.push({
                            pathname: '/(pages)/user-list',
                            params: {type: 'followers'}
                        })
                    }}>
                        <Text style={s.statValue} type='subtitle'>{person?.followersCnt}</Text>
                        <Text style={s.statLabel}>{t('Followers')}</Text>
                    </Pressable>
                    <View style={s.statDivider} />

                    <Pressable style={s.statBox} onPress={() => {
                        person?.id === user?.id && router.push({
                            pathname: '/(pages)/user-list',
                            params: {type: 'following'}
                        })
                    }}>
                        <Text style={s.statValue} type='subtitle'>{person?.followingCnt}</Text>
                        <Text style={s.statLabel}>{t('Following')}</Text>
                    </Pressable>
                </View> }

                {/* Recent achievements badges row */}
                {user?.isRoleCreator && <Achievements title={t('Recent achievements') as unknown as string} variant='badges' style={{ backgroundColor: 'transparent' }} showCheck={false}/>}

                {/* Button 'Create Recipe', only on Profile screen */}
                {/* {user?.isRoleCreator && page === 'me' && <View style={{marginTop: 24}}>
                    <Button
                        text={t('Create new recipe')}
                        size='large'
                        onPress={() => router.push('/(create)/new-recipe')}
                    />
                </View>} */}
            </View>

            <View style={s.tabsContainer}>
                {/* Tabs */}
                {user?.isRoleCreator && <View style={s.pillTabs}>
                    <Pressable style={[s.pillTab, activeTab === 0 ? s.pillTabActive : s.pillTabInactive]} onPress={() => setActiveTab(0)}>
                        <Text style={[s.pillTabText, activeTab === 0 ? s.pillTabTextActive : s.pillTabTextInactive]}>{t('Recipes')}</Text>
                    </Pressable>
                    <Pressable style={[s.pillTab, activeTab === 1 ? s.pillTabActive : s.pillTabInactive]} onPress={() => setActiveTab(1)}>
                        <Text style={[s.pillTabText, activeTab === 1 ? s.pillTabTextActive : s.pillTabTextInactive]}>{t('Achievements')}</Text>
                    </Pressable>
                </View> }

                {user?.isRoleCreator && (
                    <View style={[theme.tabsFlatList, { flexDirection: 'column', marginBottom: 80 }]}> 
                        {activeTab === 0 ? renderTab({ item: 'recipes', index: 0 }) : renderTab({ item: 'achievements', index: 1 })}
                    </View>
                )}
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    profileContainer: {
        paddingBottom: 16,
        paddingHorizontal: paddings,
    },
    tabsContainer: {
        paddingHorizontal: paddings,
        backgroundColor: Colors.mainBGColor,
    },
    avatar: {
        width: 94,
        height: 94,
        borderRadius: 47,
        borderWidth: 2,
        borderColor: Colors.mainColor,
    },
    profileOverview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 15,
    },
    profileTextWrap: {
        flex: 1,
    },
    fullname: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        letterSpacing: 0,
        color: '#000000',
        marginBottom: 4,
    },
    email: {
        fontFamily: 'Poppins',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0,
        color: '#C28040',
    },
    interestsText: {
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: getBgColor(),
    },
    section: {
        backgroundColor: getBgColor(),
        width: '100%',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        color: Colors.black,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        backgroundColor: getBgColor(),
        lineHeight: 22,
        letterSpacing: 0,
    },
    seeAllText: {
        fontSize: 14,
        lineHeight: 22,
        letterSpacing: 0,
        textAlign: 'right',
        color: Colors.mainColor,
        fontFamily: 'Poppins',
        backgroundColor: getBgColor(),
    },
    statValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#000000',
    },
    statLabel: {
        fontFamily: 'Poppins',
        fontSize: 13,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#6C7278',
    },
    stats: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statBox: {
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 45,
        backgroundColor: '#E0E0E0',
    },
    recipesWrapper: {
        marginTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: getBgColor(),
    },
    pillTabs: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        marginVertical: 24,
        borderRadius: 30,
    },
    pillTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 30,
    },
    pillTabActive: {
        backgroundColor: Colors.mainColor,
    },
    pillTabInactive: {
        backgroundColor: 'transparent',
    },
    pillTabText: {
        fontFamily: 'Poppins',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0,
        textAlign: 'center',
    },
    pillTabTextActive: {
        color: Colors.white,
    },
    pillTabTextInactive: {
        color: Colors.grey,
    },
})
import { Dimensions, FlatList, Image, Platform, Pressable, StyleSheet } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { launchImageLibrary } from 'react-native-image-picker'
import { useRouter } from "expo-router"
import { useTranslation } from 'react-i18next'

import { Button, Text, View } from "@/components/base/BaseComponents"
import Search from '@/components/Search'
import OwnRecipeCard from '@/components/OwnRecipeCard'
import { post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import { theme, paddings, isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import IRecipe from '@/interfaces/Recipe'

interface IProfileScreenProps {
    page: string
    person: { [key: string]: any } | null
    initRecipes: IRecipe[]
}

export default function ProfileScreen({page, person, initRecipes}: IProfileScreenProps) {
    const router = useRouter()
    const { user, setUser } = useAuth()
    const { t } = useTranslation()

    const tabsRef = useRef<FlatList<string>>(null)
    const [activeTab, setActiveTab] = useState<number>(0)
    const [avatar, setAvatar] = useState<any>(null)
    const [avatarError, setAvatarError] = useState<string>('')
    const [interests, setInterests] = useState<string[]>([])
    const [recipes, setRecipes] = useState<IRecipe[]>(initRecipes)

    useEffect(() => {
        setRecipes(initRecipes)
    }, [initRecipes])

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

    useEffect(() => {
        tabsRef.current?.scrollToIndex({
            index: activeTab,
            animated: true,
        })
    }, [activeTab])

    const uploadAvatar = () => {
        launchImageLibrary({mediaType: 'photo'}, photo => {
            if (!photo.assets || photo.assets.length === 0 || !photo.assets[0].uri) {
                return
            }
            setAvatarError('')

            // we use the 'uri' and so on here, because the iOs and Android use different formats
            // for the 'uri' property. And we cannot use Platform.OS in the helper function.
            post({
                url: '/profile/update',
                files: [['profileImage', {
                    uri: Platform.OS === 'ios' ? photo.assets[0].uri.replace('file://', '') : photo.assets[0].uri,
                    type: photo.assets[0].type,
                    name: photo.assets[0].fileName,
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
        })
    }

    const window = Dimensions.get('window')

    const renderTab = (tab: { item: string, index: number }) => {
        if (tab.item === 'recipes') {
            return (
                <View style={[theme.tabInner, {flexDirection: 'column', width: window.width - paddings * 2}]}>
                    <Search page={page} onSearch={setRecipes} personId={person?.id} />
                    <View style={[s.recipesWrapper, {width: window.width - paddings * 2}]}>
                        {recipes.map(recipe => <OwnRecipeCard key={recipe.id} recipe={recipe} />)}
                    </View>
                </View>
            )
        }

        return (
        <View style={[theme.tabInner, {width: window.width - paddings * 2}]}>
            <Text type='subtitle'>{tab.item}</Text>
            <Text type='subtitle'>{tab.index}</Text>
        </View>
    )}

    const greyTextColor = isLight() ? Colors.grey : Colors.lightGrey

    return (
        <View>
            <View style={s.profileOverview}>
                <Pressable onPress={() => {person?.id === user?.id && uploadAvatar()}}>
                    { avatar && <Image source={ avatar } style={s.avatar} /> }
                </Pressable>
                {avatarError !== '' && <Text type='error'>{avatarError}</Text> }
                <Text type='subtitle'>{person?.fullname}</Text>
                <Text type='link' style={{ fontFamily: 'DMSans-Medium'}}>{person?.email}</Text>
                <Text style={{ color: greyTextColor, textAlign: 'center' }}>{interests?.join(', ')}</Text>
            </View>

            {/* Statistics */}
            {user?.isRoleCreator && <View style={s.stats}>
                <View style={s.statBox}>
                    <Text type='subtitle'>{person?.recipesCnt}</Text>
                    <Text style={{color: greyTextColor}}>{t('Recipes')}</Text>
                </View>

                <Pressable style={s.statBox} onPress={() => {
                    person?.id === user?.id && router.push({
                        pathname: '/(pages)/user-list',
                        params: {type: 'followers'}
                    })
                }}>
                    <Text type='subtitle'>{person?.followersCnt}</Text>
                    <Text style={{color: greyTextColor}}>{t('Followers')}</Text>
                </Pressable>
                
                <Pressable style={s.statBox} onPress={() => {
                    person?.id === user?.id && router.push({
                        pathname: '/(pages)/user-list',
                        params: {type: 'following'}
                    })
                }}>
                    <Text type='subtitle'>{person?.followingCnt}</Text>
                    <Text style={{color: greyTextColor}}>{t('Following')}</Text>
                </Pressable>
            </View> }

            {/* Button 'Create Recipe', only on Profile screen */}
            {user?.isRoleCreator && page === 'me' && <View style={{marginTop: 24}}>
                <Button
                    text={t('Create new recipe')}
                    size='large'
                    onPress={() => router.push('/(create)/0-create')}
                />
            </View>}

            {/* Tabs */}
            {user?.isRoleCreator && <View style={theme.tabs}>
                <Pressable style={[theme.tabCaptionWrapper, activeTab === 0 ? theme.activeTab : {}]} onPress={() => setActiveTab(0)}>
                    <Text style={[theme.tabCaption, { color: activeTab === 0 ? Colors.mainColor : greyTextColor }]}>{t('Recipes')}</Text>
                </Pressable>
                <Pressable style={[theme.tabCaptionWrapper, activeTab === 1 ? theme.activeTab : {}]} onPress={() => setActiveTab(1)}>
                    <Text style={[theme.tabCaption, { color: activeTab === 1 ? Colors.mainColor : greyTextColor }]}>{t('Achivements')}</Text>
                </Pressable>
            </View> }

            {user?.isRoleCreator && <View style={{ flexDirection: 'row', marginBottom: 60 }}>
                <FlatList
                    ref={tabsRef}
                    data={['recipes', 'achivements']}
                    renderItem={renderTab}
                    initialScrollIndex={activeTab}
                    horizontal
                    style={theme.tabsFlatList}
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                />
            </View> }
        </View>
    )
}

const s = StyleSheet.create({
    avatar: {
        width: 142,
        height: 142,
        borderRadius: 999,
    },
    profileOverview: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        marginTop: 20,
    },
    stats: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statBox: {
        alignItems: 'center',
    },
    recipesWrapper: {
        marginTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
})
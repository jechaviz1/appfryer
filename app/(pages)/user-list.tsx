import { useEffect, useState } from "react"
import { Pressable, Image, StyleSheet } from "react-native"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"

import { Button, ScrollView, Text, View } from "@/components/base/BaseComponents"
import { isLight, theme } from "@/constants/Theme"
import { useAuth } from "@/contexts/authContext"
import { post } from "@/services/apiRequests"
import { logError } from "@/services/utils"

interface IUserRecord {
    id: number
    fullname: string
    isPremium: boolean
    profileImage: string
    profileImageThumb: string
    recipesCnt: number
    followersCnt: number
    followingCnt: number
}

function UserLine({ user }: { user: IUserRecord }) {
    const router = useRouter()
    const { t } = useTranslation()
    const profileImg = user.profileImage ? {uri: user.profileImage} : require('@/assets/images/icon.png')

    return (
        <Pressable
            style={s.userLine}
            onPress={() => user.id && router.push({ pathname: '/(pages)/profile', params: { userId: user.id } })}
        >
            <Image
                source={profileImg}
                style={s.avatar}
            />
            <View style={s.userDetails}>
                <Text style={s.username}>{user.fullname}</Text>
                <Text>{t('Recipes')}: {user.recipesCnt}, {t('Followers')}: {user.followersCnt}, {t('Following')}: {user.followingCnt}</Text>
            </View>
        </Pressable>
    )
}

export default function UserListPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()
    const { type } = useGlobalSearchParams() as { type: 'following' | 'followers' }

    const [ isLoaded, setLoaded ] = useState(false)
    const [ userList, setUserList ] = useState<IUserRecord[]>([])
    const [ isPossibleMore, setPossibleMore ] = useState<boolean>(false)

    const types = {
        following: {url: '/profile/me/following', title: 'Following'},
        followers: {url: '/profile/me/followers', title: 'Followers'},
    }

    const fetchUsers = () => {
        if (!type) return

        const filterLimit = 20
        post({
            url: types[type].url,
            data: {
                filterLimit,
                filterLastId: userList.length > 0 ? userList[userList.length - 1].id : undefined,
            },
            token: user?.token
        })
            .then((users: IUserRecord[]) => {
                setLoaded(true)
                setPossibleMore(!(users && users.length < filterLimit))
                setUserList(userList.concat(users))
            })
            .catch(logError)
    }

    useEffect(() => {
        if (!type) {
            router.canGoBack() ? router.back() : router.navigate('/')
            return
        }
        fetchUsers()
    }, [])

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <ScrollView style={theme.mainContainer}>
                <View style={[theme.titleContainer, {marginBottom: 32}]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/profile')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="subtitle">{type ? t(types[type].title) : ''}</Text>
                    </Pressable>
                </View>
                <View style={s.main}>
                    <View style={theme.section}>
                        {userList.map((u, i) => <UserLine user={u} key={i} />)}
                    </View>
                </View>
            </ScrollView>
            <View style={{flex: 1}}>
                {isPossibleMore && <Button
                    text={t('Load more')}
                    onPress={fetchUsers}
                    style={{
                        marginTop: 16,
                        alignSelf: 'center',
                    }}
                /> }
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    topbarInner: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 16,
        width: '100%',
    },
    main: {
        width: '100%',
        gap: 16,
        paddingBottom: 80,
    },
    userLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginVertical: 4,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 999,
    },
    userDetails: {
        
    },
    username: {

    },
})
import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Linking, Pressable, StyleSheet, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import Modal from 'react-native-modal'
import { useTranslation } from 'react-i18next'

import { Button, Checkbox, ModalTitle, Text, View } from '@/components/base/BaseComponents'
import { useAuth } from '@/contexts/authContext'
import { useSettings } from '@/contexts/settingsContext'
import { get, post } from '@/services/apiRequests'
import { theme, getBgColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { logError } from '@/services/utils'

interface IItem {
    email: boolean
    mobile: boolean
}
interface ISettings {
    follow: IItem
    comment: IItem
    commentLiked: IItem
    newRecipe: IItem
}

interface IAPI {
    disabledUntil: string, // if everything is disabled until that time, or "" if notifications enabled
    emailFollower: boolean,
    emailRecipeFollowedUser: boolean,
    emailCommentOnYourRecipe: boolean,
    emailCommentOnLikedRecipe: boolean,
    mobileFollower: boolean,
    mobileRecipeFollowedUser: boolean,
    mobileCommentOnYourRecipe: boolean,
    mobileCommentOnLikedRecipe: boolean,
    tokenIos: string,
    tokenAndroid: string
}

const itemsDetails = {
    follow: {label: 'Someone starts following you', suffix: 'Follower'},
    comment: {label: 'Comments to your recipe', suffix: 'CommentOnYourRecipe'},
    commentLiked: {label: 'Comments to recipe you like', suffix: 'CommentOnLikedRecipe'},
    newRecipe: {label: 'New recipe from someone you follow', suffix: 'RecipeFollowedUser'},
}

export default function NotificationSettings() {
    const router = useRouter()
    const { user, setUser } = useAuth()
    const { settings } = useSettings()
    const { t } = useTranslation()

    const [isLoaded, setIsLoaded] = useState(false)
    const [showBreakModal, setShowBreakModal] = useState(false)
    const [items, setItems] = useState<ISettings>()

    const updateItems = useCallback((data: IAPI) => {
        setIsLoaded(true)
        const updItems = {
            follow: {email: data.emailFollower, mobile: data.mobileFollower},
            comment: {email: data.emailCommentOnYourRecipe, mobile: data.mobileCommentOnYourRecipe},
            commentLiked: {email: data.emailCommentOnLikedRecipe, mobile: data.mobileCommentOnLikedRecipe},
            newRecipe: {email: data.emailRecipeFollowedUser, mobile: data.mobileRecipeFollowedUser},
        }
        setItems(updItems)
        setUser({ ...user, notificationBreak: data.disabledUntil !== '' })
    }, [])

    useEffect(() => {
        get({ url: '/profile/me', token: user?.token })
            .then(userData => setUser({...user, ...userData}))
            .catch(logError)
        get({ url: '/profile/settings/notification', token: user?.token })
            .then((data: IAPI) => {
                updateItems(data)
            })
            .catch(logError)
    }, [])

    const windowWidth = Dimensions.get('window').width

    const onTakeBreak = useCallback((value: boolean) => {
        if (value) {
            return setShowBreakModal(true)
        }
        setUser({ ...user, notificationBreak: value })

        post({
            url: '/profile/settings/notification',
            data: { disableFor: 'enable' },
            token: user?.token
        })
    }, [])

    const hide = useCallback(() => {
        setShowBreakModal(false)
    }, [])

    const onChooseBreak = useCallback((period: string) => {
        setUser({ ...user, notificationBreak: true, notificationBreakValue: period })
        post({
            url: '/profile/settings/notification',
            data: { disableFor: period },
            token: user?.token
        })
        hide()
    }, [])

    const onChange = useCallback((name: string, value: boolean) => {
        setIsLoaded(false)
        post({
            url: '/profile/settings/notification',
            data: {[name]: value},
            token: user?.token
        })
            .then((data: IAPI) => {
                updateItems(data)
            })
            .catch(logError)
    }, [])

    return (
        <View style={theme.container}>
            <Modal
                isVisible={showBreakModal}
                style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
                onModalHide={hide}
                onBackdropPress={hide}
            >
                <View style={{ width: '100%' }}>
                    <Pressable onPress={hide} style={{ alignSelf: 'flex-end' }}>
                        <Image source={require('@/assets/icons/x.png')} style={{ width: 18, height: 18 }} />
                    </Pressable>
                </View>

                <Text type='subtitle' style={{ textAlign: 'center' }}>{t('Want to take a break?')}</Text>
                <Text style={s.modalText}>{t(`We won’t send you app notifications. 
Email notifications won’t be affected.`)}</Text>

                <View style={[s.line, {marginTop: 48}]} />
                <Pressable onPress={() => onChooseBreak('8h')} style={s.modalButton}>
                    <Text>{t('8 hours')}</Text>
                </Pressable>
                <View style={s.line} />
                <Pressable onPress={() => onChooseBreak('1d')} style={s.modalButton}>
                    <Text>{t('1 day')}</Text>
                </Pressable>
                <View style={s.line} />
                <Pressable onPress={() => onChooseBreak('1w')} style={s.modalButton}>
                    <Text>{t('1 week')}</Text>
                </Pressable>
                <View style={s.line} />

            </Modal>

            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <ModalTitle title='Notifications settings' onHide={() => router.canGoBack() ? router.back() : router.navigate('/(settings)/settings')} />
                <View style={{marginBottom: 180}}>

                    <View style={[s.textWrapper, {width: windowWidth}]}>
                        <Image source={ require('@/assets/icons/bell.png')} style={{width: 18, height: 18, marginHorizontal: 30}} />
                        <View>
                            <Text type='caption'>{t('Open Notification Settings')}</Text>
                            <Text style={{ width: windowWidth - 100 }}>{t('Make sure Appfryer’s app notifications are turned on:')}</Text>
                        </View>
                    </View>

                    <Button
                        style={{marginBottom: 10}}
                        textStyle={{fontWeight: '600', fontFamily: 'DMSans-Bold'}}
                        text={t('Open notification settings')}
                        onPress={() => Linking.openSettings()}
                    />

                    <View style={[theme.section, s.breakWrapper]}>
                        <View>
                            <Text>{t('Take a break')}</Text>
                            <Text style={[s.itemText, {color: Colors.neutralGrey}]}>{t('Pause notifications for short time')}</Text>
                        </View>
                        
                        <Switch
                            value={user?.notificationBreak}
                            trackColor={Colors.switchTrack}
                            onValueChange={onTakeBreak}
                        />
                    </View>

                    <View style={theme.section}>
                        { !user?.isVerified && ( <Text type='error' style={s.confirmEmailText}>
                            {t('Please clicking on link sent to your email address, to confirm it')}
                        </Text> )}
                        <View style={s.line} />
                        {items && Object.keys(items).map(key => {
                            const isEmailDisabled = !user?.isVerified
                            const isMobileDisabled = !settings?.notificationToken
                            return ( <View key={key}>
                                <View style={s.itemWrapper}>
                                    <Text style={[s.itemText, {flex: 1}]}>{t(itemsDetails[key as keyof ISettings].label)}</Text>
                                    <Text type={isEmailDisabled ? 'disabled' : 'default'} style={s.itemText}>{t('Email')}</Text>
                                    <Checkbox
                                        disabled={!isLoaded || isEmailDisabled}
                                        checked={items[key as keyof ISettings].email}
                                        onPress={() => {
                                            const field = `email${itemsDetails[key as keyof ISettings].suffix}`
                                            onChange(field, !items[key as keyof ISettings].email)
                                        }}
                                    />
                                    <Text type={isMobileDisabled ? 'disabled' : 'default'} style={s.itemText}>{t('Mobile')}</Text>
                                    <Checkbox
                                        disabled={!isLoaded || isMobileDisabled}
                                        checked={items[key as keyof ISettings].mobile}
                                        onPress={() => {
                                            const field = `mobile${itemsDetails[key as keyof ISettings].suffix}`
                                            onChange(field, !items[key as keyof ISettings].mobile)
                                        }}
                                    />
                                </View>
                                <View style={s.line} />
                            </View> )
                        })}
                    </View>
                </View>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    modal: {
        marginTop: Dimensions.get('window').height * 0.60,
        paddingTop: 16,
        justifyContent: 'flex-start',
    },
    modalText: {
        textAlign: 'center',
        marginHorizontal: '12%',
        color: Colors.neutralGrey,
    },
    line: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.lightGrey,
    },
    confirmEmailText: {
        marginBottom: 12,
    },
    modalButton: {
        width: '100%',
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    breakWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    itemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        marginVertical: 12,
    },
    itemText: {
        fontSize: 11.5,
    },
})
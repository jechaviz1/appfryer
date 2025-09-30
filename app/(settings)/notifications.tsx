import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Linking, Pressable, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, Checkbox, ModalTitle, Text, View } from '@/components/base/BaseComponents'
import Header from '@/components/Header'
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
    follow: {label: 'Someone started following you', suffix: 'Follower'},
    comment: {label: 'Comments on your recipe', suffix: 'CommentOnYourRecipe'},
    commentLiked: {label: 'Comments on a recipe you like', suffix: 'CommentOnLikedRecipe'},
    newRecipe: {label: 'New recipe from someone you follow', suffix: 'RecipeFollowedUser'},
}

const getNotificationIcon = (type: keyof ISettings) => {
    switch (type) {
        case 'follow':
            return require('@/assets/icons/add-friend.png')
        case 'comment':
            return require('@/assets/icons/message.png')
        case 'commentLiked':
            return require('@/assets/icons/heart.png')
        case 'newRecipe':
            return require('@/assets/icons/recipe-book.png')
        default:
            return require('@/assets/icons/notification.png')
    }
}

export default function NotificationSettings() {
    const router = useRouter()
    const { user, setUser } = useAuth()
    const { settings } = useSettings()
    const { t } = useTranslation()

    const [isLoaded, setIsLoaded] = useState(false)
    const [showBreakOptions, setShowBreakOptions] = useState(false)
    const [items, setItems] = useState<ISettings>()
    const [selectedNotificationType, setSelectedNotificationType] = useState<'email' | 'mobile'>('email')

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
        console.log('onTakeBreak', value)
        if (value) {
            return setShowBreakOptions(true)
        }
        
        // Optimistic update
        setUser({ ...user, notificationBreak: value })

        post({
            url: '/profile/settings/notification',
            data: { disableFor: 'enable' },
            token: user?.token
        })
        .catch((error) => {
            logError(error)
            // Revert optimistic update on error
            setUser({ ...user, notificationBreak: !value })
        })
    }, [user])

    const hide = useCallback(() => {
        setShowBreakOptions(false)
    }, [])

    const onChooseBreak = useCallback((period: string) => {
        // Optimistic update
        setUser({ ...user, notificationBreak: true, notificationBreakValue: period })
        
        post({
            url: '/profile/settings/notification',
            data: { disableFor: period },
            token: user?.token
        })
        .catch((error) => {
            logError(error)
            // Revert optimistic update on error
            setUser({ ...user, notificationBreak: false, notificationBreakValue: undefined })
        })
        
        setShowBreakOptions(false)
    }, [user])

    const onChange = useCallback((name: string, value: boolean) => {
        // Optimistic update - update UI immediately
        if (items) {
            const fieldName = name.replace(/^(email|mobile)/, '').toLowerCase()
            const type = fieldName.charAt(0).toLowerCase() + fieldName.slice(1)
            const notificationType = name.startsWith('email') ? 'email' : 'mobile'
            
            // Find the correct item and update it optimistically
            const updatedItems = { ...items }
            if (type === 'follower') {
                updatedItems.follow[notificationType] = value
            } else if (type === 'commentOnYourRecipe') {
                updatedItems.comment[notificationType] = value
            } else if (type === 'commentOnLikedRecipe') {
                updatedItems.commentLiked[notificationType] = value
            } else if (type === 'recipeFollowedUser') {
                updatedItems.newRecipe[notificationType] = value
            }
            setItems(updatedItems)
        }

        // Then make the API call
        post({
            url: '/profile/settings/notification',
            data: {[name]: value},
            token: user?.token
        })
            .then((data: IAPI) => {
                updateItems(data)
            })
            .catch((error) => {
                logError(error)
                // Revert optimistic update on error
                get({ url: '/profile/settings/notification', token: user?.token })
                    .then((data: IAPI) => {
                        updateItems(data)
                    })
                    .catch(logError)
            })
    }, [items, user?.token])

    return (
        <View style={s.container}>

            <View style={theme.statusBarHeight} />
            <Header 
                title={t('Notification Settings')}
                onBack={() => router.canGoBack() ? router.back() : router.navigate('/(settings)/settings')}
            />

            <ScrollView style={s.content}>
                {/* Notification Settings Card */}
                <View style={s.notificationCard}>
                    <View style={s.notificationCardContent}>
                        <Image source={require('@/assets/icons/notification.png')} style={s.notificationIcon} />
                        <View style={s.notificationTextContainer}>
                            <Text style={s.notificationTitle}>{t('Open Notification Settings')}</Text>
                            <Text style={s.notificationSubtitle}>{t('Make sure Appfryer app notifications are enabled')}</Text>
                            <TouchableOpacity style={s.configureButton} onPress={() => Linking.openSettings()}>
                                <Text style={s.configureButtonText}>{t('Configure Notifications')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Take a Break Section */}
                <View style={s.breakSection}>
                    <View style={s.breakContent}>
                        <Text style={s.breakTitle}>{t('Take a break')}</Text>
                        <Text style={s.breakSubtitle}>{t('Pause notifications for a while')}</Text>
                    </View>
                    <Switch
                        value={user?.notificationBreak}
                        trackColor={{ false: '#E5E5E5', true: '#C28040' }}
                        thumbColor={user?.notificationBreak ? '#FFFFFF' : '#FFFFFF'}
                        onValueChange={onTakeBreak}
                    />
                </View>

                {/* Notification Type Selector */}
                <View style={s.pillTabs}>
                    <TouchableOpacity 
                        style={[s.pillTab, selectedNotificationType === 'email' ? s.pillTabActive : s.pillTabInactive]}
                        onPress={() => setSelectedNotificationType('email')}
                    >
                        <Text style={[s.pillTabText, selectedNotificationType === 'email' ? s.pillTabTextActive : s.pillTabTextInactive]}>
                            {t('Email')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[s.pillTab, selectedNotificationType === 'mobile' ? s.pillTabActive : s.pillTabInactive]}
                        onPress={() => setSelectedNotificationType('mobile')}
                    >
                        <Text style={[s.pillTabText, selectedNotificationType === 'mobile' ? s.pillTabTextActive : s.pillTabTextInactive]}>
                            {t('Mobile')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Notification Items */}
                <View style={s.notificationItems}>
                    {items && Object.keys(items).map((key, index) => {
                        const item = items[key as keyof ISettings]
                        const isEmailDisabled = !user?.isVerified
                        const isMobileDisabled = !settings?.notificationToken
                        const isActive = selectedNotificationType === 'email' ? item.email : item.mobile
                        const isDisabled = selectedNotificationType === 'email' ? isEmailDisabled : isMobileDisabled
                        
                        return (
                            <View key={key} style={s.notificationItem}>
                                <View style={s.notificationItemContent}>
                                    <Image 
                                        source={getNotificationIcon(key as keyof ISettings)} 
                                        style={s.itemIcon} 
                                    />
                                    <Text style={s.itemText}>{t(itemsDetails[key as keyof ISettings].label)}</Text>
                                </View>
                                <Switch
                                    value={isActive}
                                    disabled={!isLoaded || isDisabled}
                                    trackColor={{ false: '#E5E5E5', true: '#C28040' }}
                                    thumbColor={isActive ? '#FFFFFF' : '#FFFFFF'}
                                    onValueChange={() => {
                                        const field = `${selectedNotificationType}${itemsDetails[key as keyof ISettings].suffix}`
                                        onChange(field, !isActive)
                                    }}
                                />
                            </View>
                        )
                    })}
                </View>

                {/* Break Options Section - Always Visible */}
                {showBreakOptions && (
                    <View style={s.breakOptionsCard}>
                        <View style={s.breakOptionsHeader}>
                            <Text style={s.breakOptionsTitle}>{t('Want to take a break?')}</Text>
                            <TouchableOpacity onPress={hide} style={s.closeButton}>
                                <Image source={require('@/assets/icons/close.png')} style={s.closeIcon} />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.breakOptionsText}>{t('We won\'t send you app notifications. Email notifications won\'t be affected.')}</Text>
                        <View style={s.breakOptionsButtons}>
                            <TouchableOpacity onPress={() => onChooseBreak('8h')} style={s.breakOptionButton}>
                                <Text style={s.breakOptionButtonText}>{t('8 Hours')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onChooseBreak('1d')} style={s.breakOptionButton}>
                                <Text style={s.breakOptionButtonText}>{t('1 Day')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onChooseBreak('1w')} style={s.breakOptionButton}>
                                <Text style={s.breakOptionButtonText}>{t('1 Week')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: getBgColor(),
        paddingTop: 20,
    },
    notificationCard: {
        backgroundColor: '#ECD8C4',
        borderRadius: 13,
        height: 151,
        padding: 20,
        marginBottom: 20,
    },
    notificationCardContent: {
        backgroundColor: '#ECD8C4',
        flexDirection: 'row',
    },
    notificationIcon: {
        width: 24,
        height: 24,
        marginTop: 5,
        marginRight: 20,
        tintColor: '#C28040',
    },
    notificationTextContainer: {
        flex: 1,
        backgroundColor: '#ECD8C4',
    },
    notificationTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        fontWeight: '500',
        color: '#1B1A1D',
    },
    notificationSubtitle: {
        fontFamily: 'Poppins',
        fontSize: 13,
        fontWeight: '400',
        color: '#6C7278',
        lineHeight: 18,
    },
    configureButton: {
        backgroundColor: '#C28040',
        borderRadius: 11,
        paddingVertical: 11,
        paddingHorizontal: 27,
        width: 210,
        height: 40,
        marginTop: 11,
    },
    configureButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Poppins-Medium',
    },
    breakSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 33,
    },
    breakContent: {
        flex: 1,
    },
    breakTitle: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 14,
        letterSpacing: 0,
        color: '#1B1A1D',
        marginBottom: 4,
    },
    breakSubtitle: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 22,
        letterSpacing: 0,
        color: '#919191',
    },
    pillTabs: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 30,
        marginBottom: 20,
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
    notificationItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: 13,
        backgroundColor: getBgColor(),
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 3,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
    },
    notificationItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
        tintColor: '#C28040',
    },
    itemText: {
        fontFamily: 'Poppins',
        fontSize: 13,
        lineHeight: 17,
        fontWeight: '400',
        color: '#919191',
        flex: 1,
    },
    breakOptionsCard: {
        width: 362,
        backgroundColor: '#F6ECE2',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C28040',
        marginTop: 25,
        paddingVertical: 23,
        paddingHorizontal: 24,
        alignSelf: 'center',
    },
    breakOptionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#F6ECE2',
    },
    breakOptionsTitle: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 16,
        letterSpacing: 0,
        color: '#1B1A1D',
        flex: 1,
    },
    closeButton: {
        backgroundColor: '#F6ECE2',
    },
    closeIcon: {
        width: 15,
        height: 15,
        tintColor: '#C28040',
    },
    breakOptionsText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0,
        color: '#6C7278',
        marginBottom: 16,
    },
    breakOptionsButtons: {
        backgroundColor: '#F6ECE2',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
    },
    breakOptionButton: {
        width: 96,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EFF0F6',
    },
    breakOptionButtonText: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0,
        color: '#6C7278',
        textAlign: 'center',
    },
})
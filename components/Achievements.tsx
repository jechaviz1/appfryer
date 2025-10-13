import { Image, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ScrollView, Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import { getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor, theme } from '@/constants/Theme'
import { useTheme } from '@/contexts/themeContext'

interface IAchievement {
    id: number
    title: string
    goal: number
    progress: number
    date?: string
}

const achievementsFake: IAchievement[] = [
    {
        id: 1,
        title: 'Recipes cooked',
        goal: 5,
        progress: 3,
        date: '27 June',
    },
    {
        id: 2,
        title: 'Recipes cooked',
        goal: 50,
        progress: 15,
        date: '27 June',
    },
    {
        id: 3,
        title: 'Comments',
        goal: 20,
        progress: 5,
        date: '27 June',
    },
    {
        id: 4,
        title: 'Comments',
        goal: 120,
        progress: 57,
        date: '27 June',
    },
]

type Variant = 'default' | 'compact' | 'badges'

export default function Achievements({style, title, variant = 'default', showCheck = true}: {style?: any, title?: string, variant?: Variant, showCheck?: boolean}) {
    const { t } = useTranslation()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const [achievements, setAchievements] = useState<IAchievement[]>([])

    useEffect(() => {
        // TODO recive achievements from server, filter needed
        // get('/achievements').then(res => setAchievements(res))
        setAchievements(achievementsFake)
    }, [])

    const badgeImages = [
        require('@/assets/images/achievements/green-chef-badge.png'),
        require('@/assets/images/achievements/carnivore-champion-badge.png'),
        require('@/assets/images/achievements/salad-specialist-badge.png'),
    ]

    function AchievementProgressCard({achievement, image}: {achievement: IAchievement, image: any}) {
        const progress = Math.min(100, achievement.progress / achievement.goal * 100)
        return (
            <View style={s.card}>
                <Image source={image || require('@/assets/images/achievements/placeholder.png')} style={s.cardImage} />
                <Text style={s.cardTitle}>{t(achievement.title)}</Text>
                <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>
        )
    }

    if (variant === 'compact') {
        return (
            <View style={s.container}>
                { title ? <Text type="caption" style={s.title}>{t(title)}</Text> : null}
                <ScrollView style={[style]} horizontal showsHorizontalScrollIndicator={false}>
                    <View style={s.compactRow}>
                        {achievements.map((a, index) => {
                            const img = badgeImages[index]
                            return (
                                <View key={a.id} style={s.compactCard}>
                                    <Image source={img || require('@/assets/images/achievements/placeholder.png')} style={s.compactBadge} />
                                    <Text style={s.compactTitle}>{t(a.title)}</Text>
                                    {a.date && <Text style={s.compactDate}>{t(a.date)}</Text>}
                                    {showCheck && index < 2 && (
                                        <View style={s.compactCheck}>
                                            <Image source={require('@/assets/icons/checkmark.png')} style={s.compactCheckIcon} />
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>
        )
    }

    if (variant === 'badges') {
        return (
            <View style={s.container}>
                { title ? <Text type="caption" style={s.title}>{t(title)}</Text> : null}
                <ScrollView style={[style]} horizontal showsHorizontalScrollIndicator={false}>
                    <View style={s.badgeRow}>
                        {achievements.map((a, index) => {
                            const img = badgeImages[index]
                            return (
                                <View key={a.id} style={s.badgeWrapper}>
                                    <Image source={img || require('@/assets/images/achievements/placeholder.png')} style={s.badgeImage} />
                                    {showCheck && index < 2 && (
                                        <View style={s.compactCheck}>
                                            <Image source={require('@/assets/icons/checkmark.png')} style={s.compactCheckIcon} />
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>
        )
    }

    return (
        <View style={s.container}>
            { title ? <Text type="caption" style={s.title}>{t(title)}</Text> : null}
            <ScrollView style={[style]} horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.achievementRow}>
                    {achievements.map((achievement, index) => {
                        const img = badgeImages[index]
                        return (
                            <AchievementProgressCard key={achievement.id} achievement={achievement} image={img} />
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        marginTop: 20,
    },
    title: {
        fontFamily: 'Poppins',
        fontWeight: '400',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0,
        color: getSecondaryTextColor(),
        marginBottom: 12,
    },
    achievementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: 'transparent',
    },
    achievementCard: {
        width: 132,
        gap: 8,
        marginRight: 8,
        borderRadius: 10,
        marginVertical: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementCircle: {
        width: 69,
        height: 69,
    },
    achievementImg: {
        width: 69,
        height: 69,
    },
    achievementGoal: {
        marginHorizontal: 'auto',
        marginTop: -47,
        height: 28,
        lineHeight: 28,
        fontSize: 24,
        color: Colors.grey,
    },
    achievementTitle: {
        height: 2,
        width: '100%',
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
    },
    achievementProgressLine: {
        width: 104,
        height: 3,
        borderRadius: 2,
        zIndex: 1,
        backgroundColor: Colors.lightGrey,
    },
    achievementProgress: {
        height: 3,
        zIndex: 2,
        borderRadius: 2,
        backgroundColor: Colors.mainColor,
    },
    card: {
        width: 144,
        borderRadius: 12,
        backgroundColor: getCardBackground(),
        padding: 14,
        alignItems: 'center',
    },
    cardImage: {
        width: 86,
        height: 86,
        borderRadius: 43,
        marginBottom: 8,
    },
    cardTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        marginTop: 2,
        marginBottom: 10,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.lightGrey,
    },
    progressFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.mainColor,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: 'transparent',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        backgroundColor: 'transparent',
    },
    badgeWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: getCardBackground(),
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badgeImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    compactCard: {
        width: 144,
        borderRadius: 12,
        backgroundColor: getCardBackground(),
        padding: 14,
        alignItems: 'center',
        position: 'relative',
    },
    compactBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    compactTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        marginTop: 8,
        lineHeight: 17,
        letterSpacing: 0,
        textAlign: 'center',
    },
    compactDate: {
        fontFamily: 'Poppins',
        fontSize: 12,
        color: Colors.grey,
    },
    compactCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.mainColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    compactCheckMark: {
        color: Colors.white,
        fontSize: 12,
        lineHeight: 12,
        fontFamily: 'Poppins-Bold',
    },
    compactCheckIcon: {
        width: 12,
        height: 12,
        tintColor: Colors.white,
        resizeMode: 'contain',
    },
})
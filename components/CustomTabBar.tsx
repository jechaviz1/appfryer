import React from 'react'
import { View, Image, Pressable, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import TabBarIcons from '@/components/TabBarIcons'
import { Colors } from '@/constants/Colors'

interface CustomTabBarProps {
    activeTab?: string
}

export default function CustomTabBar({ activeTab }: CustomTabBarProps) {
    const router = useRouter()
    const { t } = useTranslation()

    const tabs = [
        {
            name: 'index',
            title: t('Home'),
            icon: TabBarIcons.HomeIcon,
            activeIcon: TabBarIcons.HomeActiveIcon,
            route: '/(tabs)/'
        },
        {
            name: 'explore',
            title: t('Explore'),
            icon: TabBarIcons.SearchIcon,
            activeIcon: TabBarIcons.SearchActiveIcon,
            route: '/(tabs)/explore'
        },
        {
            name: 'create',
            title: '',
            icon: TabBarIcons.PlusIcon,
            activeIcon: TabBarIcons.PlusIcon,
            route: '/(tabs)/create'
        },
        {
            name: 'space',
            title: t('My Space'),
            icon: TabBarIcons.BookIcon,
            activeIcon: TabBarIcons.BookActiveIcon,
            route: '/(tabs)/space'
        },
        {
            name: 'profile',
            title: t('Profile'),
            icon: TabBarIcons.UserIcon,
            activeIcon: TabBarIcons.UserActiveIcon,
            route: '/(tabs)/profile'
        }
    ]

    const handleTabPress = (route: string) => {
        router.push(route as any)
    }

    return (
        <View style={s.tabBar}>
            {tabs.map((tab) => (
                <Pressable
                    key={tab.name}
                    style={s.tabItem}
                    onPress={() => handleTabPress(tab.route)}
                >
                    <View style={s.iconContainer}>
                        {tab.name === 'create' ? (
                            <View style={s.plusButtonContainer}>
                                <View style={s.plusButton}>
                                    <Image
                                        source={tab.icon}
                                        style={s.plusIconSize}
                                    />
                                </View>
                            </View>
                        ) : (
                            <Image
                                source={activeTab === tab.name ? tab.activeIcon : tab.icon}
                                style={[s.iconSize, { tintColor: activeTab === tab.name ? Colors.mainColor : '#6C7278' }]}
                            />
                        )}
                    </View>
                    {tab.title && (
                        <Text style={[
                            s.tabBarLabel,
                            { color: activeTab === tab.name ? Colors.mainColor : '#6C7278' }
                        ]}>
                            {tab.title}
                        </Text>
                    )}
                </Pressable>
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    tabBar: {
        width: '100%',
        height: 74,
        paddingTop: 14,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tabItem: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBarLabel: {
        fontFamily: 'Poppins',
        fontWeight: '500',
        fontSize: 12,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusButton: {
        borderRadius: 22,
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSize: {
        width: 24,
        height: 24,
    },
    plusIconSize: {
        width: 46,
        height: 46,
    },
})

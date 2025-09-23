import React from 'react'
import { Image, Pressable, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native'
import { useRouter } from 'expo-router'

import { Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'

interface HeaderProps {
    title: string
    onBack?: () => void
    rightIconSource?: any
    onRightPress?: () => void
    rightIconStyle?: StyleProp<ImageStyle>
    containerStyle?: StyleProp<ViewStyle>
}

export default function Header({
    title,
    onBack,
    rightIconSource,
    onRightPress,
    rightIconStyle,
    containerStyle,
}: HeaderProps) {
    const router = useRouter()

    return (
        <View style={[s.header, containerStyle]}> 
            <Pressable onPress={onBack ?? (() => router.back())} style={s.sideButton}>
                <Image source={require('@/assets/icons/back-2.png')} style={s.backIcon} />
            </Pressable>
            <Text style={s.title}>{title}</Text>
            {rightIconSource ? (
                <Pressable onPress={onRightPress} style={s.sideButton}>
                    <Image source={rightIconSource} style={[s.rightIcon, rightIconStyle]} />
                </Pressable>
            ) : (
                <View style={s.sideButton} />
            )}
        </View>
    )
}

const s = StyleSheet.create({
    header: {
        backgroundColor: '#4F4240',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        height: 54,
    },
    sideButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    backIcon: {
        width: 13,
        height: 23,
        tintColor: Colors.white,
    },
    title: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    rightIcon: {
        width: 26,
        height: 26,
        tintColor: Colors.white,
    },
})



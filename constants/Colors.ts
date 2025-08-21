import { Appearance } from 'react-native'

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4'
const tintColorDark = '#fff'
const mainColor = '#c3803a'
const greyTextColor = '#6C7278'

export const Colors = {
    mainColor,
    greyTextColor,
    mainColorLight: '#c3803a1a',
    lightGrey: '#e9e9e9',
    neutralGrey: '#717171',
    grey: '#474847b2',
    white: '#fff',
    black: '#000',
    purple: '#9f3cc2',
    danger: '#ff2020c0',
    disabledButton: '#474847b2',
    storyGradient: ['#dda63f', '#c3803a'],
    storyGradientViewed: ['#e1e1e1', '#e1e1e1'],
    switchTrack: {
        false: '#767577',
        true: mainColor,
    },
    // Auth common colors
    auth: {
        backgroundOverlay: 'rgba(79, 66, 64, 0.8)',
        inputBorder: 'rgba(237, 241, 243, 1)',
        inputShadow: 'rgba(228, 229, 231, 0.24)',
        dividerLine: '#e9ecef',
        socialButtonBorder: '#e9ecef',
        socialButtonText: 'rgba(27, 26, 29, 1)',
        formShadow: '#000',
    },
    light: {
        text: '#11181c',
        background: '#fff',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#ecedee',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9ba1a6',
        tabIconDefault: '#9ba1a6',
        tabIconSelected: tintColorDark,
    },
};

export const weeklyColors = {
    breakfast: '#C3803A',
    lunch: '#3CC249',
    snack: Colors.purple,
    dinner: '#017FF4',
}

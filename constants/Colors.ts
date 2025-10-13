import { Appearance } from 'react-native'

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4'
const tintColorDark = '#fff'
const mainColor = '#c3803a'
const greyTextColor = '#6C7278'
const mainBGColor = '#F9F5F2'

export const Colors = {
    mainColor,
    mainBGColor,
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
        // Additional light mode colors
        cardBackground: '#fff',
        borderColor: '#e9ecef',
        secondaryText: '#6C7278',
        placeholderText: '#9ba1a6',
        shadowColor: '#000',
        inputBackground: '#fff',
        sectionBackground: '#F9F5F2',
        pillBackground: '#fff',
        pillText: '#474847b2',
        pillTextActive: '#fff',
        checkboxBorder: '#D0D0D0',
        checkboxBackground: '#fff',
        calendarInactive: '#FCEEE1',
        recipeCardBackground: '#fff',
        footerBackground: '#F8F5F0',
        emptyStateText: '#2C1810',
        emptyStateSubtext: '#808080',
    },
    dark: {
        text: '#ecedee',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9ba1a6',
        tabIconDefault: '#9ba1a6',
        tabIconSelected: tintColorDark,
        // Additional dark mode colors
        cardBackground: '#1f2937',
        borderColor: '#374151',
        secondaryText: '#9ca3af',
        placeholderText: '#6b7280',
        shadowColor: '#000',
        inputBackground: '#1f2937',
        sectionBackground: '#111827',
        pillBackground: '#1f2937',
        pillText: '#9ca3af',
        pillTextActive: '#fff',
        checkboxBorder: '#4b5563',
        checkboxBackground: '#1f2937',
        calendarInactive: '#374151',
        recipeCardBackground: '#1f2937',
        footerBackground: '#111827',
        emptyStateText: '#ecedee',
        emptyStateSubtext: '#9ca3af',
    },
};

export const weeklyColors = {
    breakfast: '#C3803A',
    lunch: '#3CC249',
    snack: Colors.purple,
    dinner: '#017FF4',
}

import { useEffect } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'

import Providers from '@/components/onLoad/Providers'
import { useColorScheme } from '@/hooks/useColorScheme'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme()
    const [loaded] = useFonts({
        DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
        DMSansMedium: require('../assets/fonts/DMSans-Medium.ttf'),
        'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
        DMSansBold: require('../assets/fonts/DMSans-Bold.ttf'),
        'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
        Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
        PoppinsMedium: require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
        PoppinsSemiBold: require('../assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    })

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync()
        }
    }, [loaded])

    if (!loaded) {
        return null
    }

    const screens = [
        '(tabs)',
        '(auth)/onboarding',
        '(auth)/login',
        '(auth)/signup',
        '(auth)/forgot-password',
        '(pages)/diet',
        '(pages)/ingredient',
        '(pages)/recipe/[id]',
        '(pages)/feed',
        '(pages)/profile',
        '(pages)/quiz',
        '(pages)/shopping-list',
        '(pages)/start-cooking',
        '(pages)/static-page',
        '(pages)/user-list',
        '(pages)/weekly-plan',
        '(create)/new-recipe',
        '(create)/0-create',
        '(create)/1-upload-media',
        '(create)/2-title',
        '(create)/3-categories',
        '(create)/4-servings',
        '(create)/5-time',
        '(create)/6-ingredients',
        '(create)/7-instructions',
        '(settings)/activity-log',
        '(settings)/delete-account',
        '(settings)/languages',
        '(settings)/notifications',
        '(settings)/settings',
    ]

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Providers>
                <Stack screenOptions={{ headerShown: false }}>
                    {screens.map((name) => (
                        <Stack.Screen key={name} name={name} />
                    ))}
                    <Stack.Screen name="+not-found" />
                </Stack>
            </Providers>
        </ThemeProvider>
    )
}

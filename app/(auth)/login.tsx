import { useCallback, useEffect, useState } from 'react'
import { Platform, Pressable, StyleSheet, ImageBackground, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import * as AppleAuth from 'expo-apple-authentication'

import { Button, Checkbox, Text, TextInput, View } from '@/components/base/BaseComponents'
import Languages from '@/components/modals/Languages'
import Preferences from '@/components/modals/Preferences'
import { validateEmail, validatePassword } from '@/services/validators'
import { post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import { useSettings } from '@/contexts/settingsContext'
import { useAppState } from '@/contexts/appStateContext'
import { fetchLanguages } from '@/services/fetches'
import { logError } from '@/services/utils'
import { theme, isLight, getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { useTheme } from '@/contexts/themeContext'

export default function LoginScreen() {
    const router = useRouter()
    const { i18n, t } = useTranslation()
    const { setUser } = useAuth()
    const { settings, setSettings } = useSettings()
    const { appState, setAppState } = useAppState()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const [loaded, setLoaded] = useState<boolean>(false)
    const [showLanguages, setShowLanguages] = useState<boolean>(false)
    const [showPreferences, setShowPreferences] = useState<boolean>(false)
    const [languages, setLanguages] = useState<Record<string, string>>({})

    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [emailError, setEmailError] = useState<string>('')
    const [passwordError, setPasswordError] = useState<string>('')

    const [rememberMe, setRememberMe] = useState<boolean>(false)
    const [isSentReq, setSentReq] = useState<boolean>(false)

    const [loginError, setLoginError] = useState<string>('')

    const googleIcon = require('@/assets/icons/login-google.png')
    const facebookIcon = require('@/assets/icons/login-facebook.png')

    useEffect(() => {
        AsyncStorage.getItem('settings').then(settingsData => {
            if (settingsData) {
                setSettings(JSON.parse(settingsData))
            }
            setLoaded(true)
        }).catch(e => console.log(e))
        fetchLanguages(setLanguages)
    }, [])

    useEffect(() => {
        if (Object.keys(appState?.languages).length === 0) {
            setAppState({ ...appState, languages })
        }
    }, [languages])

    useEffect(() => {
        // display it, if onboarding is not viewed yet
        if (loaded && !settings?.onboardingViewed) {
            router.push('/(auth)/onboarding')
        }
    }, [settings, loaded])

    const onBlurEmail = useCallback(() => {
        if (!validateEmail(email)) {
            setEmailError(t('Please enter a valid email address'))
            return false
        }
        setEmailError('')
        return true
    }, [email])
    // TODO: add more rules to password validation
    const onBlurPassword = useCallback(() => {
        if (!validatePassword(password)) {
            setPasswordError(t('Password must be at least 6 characters long'))
            return false
        }
        setPasswordError('')
        return true
    }, [password])

    const handleEmailChange = (text: string) => {
        setEmail(text)
        setEmailError('')
        setLoginError('')
    }

    const handlePasswordChange = (text: string) => {
        setPassword(text)
        setPasswordError('')
        setLoginError('')
    }

    const handleRememberMeToggle = () => {
        setRememberMe(!rememberMe)
    }

    const handleForgotPassword = () => {
        router.push('/(auth)/forgot-password')
    }

    const handleGoogleSignIn = () => {
        router.push('/(auth)/signup')
    }

    const handleFacebookSignIn = () => {
        router.push('/(auth)/signup')
    }

    const handleSignUp = () => {
        router.push('/(auth)/signup')
    }

    const tryToLogin = () => {
        if (!onBlurEmail() || !onBlurPassword()) {
            return
        }
        setLoginError('')
        setSentReq(true)

        post({url: '/login_check', data: {
            _username: email,
            _password: password,
        }})
            .then(response => {
                AsyncStorage.setItem('user', JSON.stringify({
                    authenticated: true,
                    email,
                    token: response.token,
                })).catch(e => console.log('Error: AsyncStorage.setItem("user")', e))
        
                setUser({
                    authenticated: true,
                    email,
                    token: response.token,
                })
                router.replace('/')
            })
            .catch(e => {
                logError(e, 'Login failed')
                setLoginError(e.response?.data?.message ?? e.message)
            })
            .finally(() => setSentReq(false))
    }

    function onAppleButtonPress() {
        setLoginError('')
        setSentReq(true)

        // performs login request
        AppleAuth.signInAsync({
            requestedScopes: [
                AppleAuth.AppleAuthenticationScope.FULL_NAME,
                AppleAuth.AppleAuthenticationScope.EMAIL,
            ],
        })
            .then(async (credentials) => {
                if (!credentials || !credentials.user) {
                    setLoginError(t('Apple login failed'))
                    return
                }
                
                // // get current authentication state for user
                // const credentialState = await AppleAuth.getCredentialStateAsync(credentials.user)
                // console.log(credentialState);
                
                // // use credentialState response to ensure the user is authenticated
                // if (credentialState !== AppleAuth.AppleAuthenticationCredentialState.AUTHORIZED) {
                //     setLoginError(t('Apple user is not authorized'))
                //     return
                // }
                // user is authenticated
                const fullnameArr = []
                credentials.fullName?.givenName && fullnameArr.push(credentials.fullName?.givenName)
                credentials.fullName?.middleName && fullnameArr.push(credentials.fullName?.middleName)
                credentials.fullName?.familyName && fullnameArr.push(credentials.fullName?.familyName)
                const fullname = fullnameArr.length === 0 ? '' : fullnameArr.join(' ')
                post({
                    url: '/auth/apple',
                    data: {
                        fullname: fullname,
                        identityToken: credentials.identityToken,
                        language: i18n.language,
                    },
                })
                    .then(async (resp) => {
                        try {
                            await AsyncStorage.setItem('user', JSON.stringify({
                                authenticated: true,
                                email: credentials.email,
                                token: resp.token,
                            }))
                        } catch (e) {
                            console.log('Error: AsyncStorage.setItem("user")', e)
                        }

                        setUser({
                            authenticated: true,
                            email: credentials.email,
                            token: resp.token,
                        })
                        switch (resp.action) {
                            case 'register':
                                setShowPreferences(true)
                                break
                            case 'login':
                                router.push('/')
                                break
                        }
                    })
                    .catch(e => {
                        console.log(e)
                        setLoginError(e.response?.data?.message ?? e.message)
                    })
                    .finally(() => setSentReq(false))
            })
            .catch(e =>{
                console.log(e)
                setLoginError(e?.message ?? t('Apple login failed'))
            })
            .finally(() => setSentReq(false))
    }

    return (
        <KeyboardAwareScrollView keyboardDismissMode='on-drag' style={theme.authScrollView}>
            <ImageBackground 
                source={require('@/assets/images/login-bg.jpg')} 
                style={theme.authScreenContainer}
                resizeMode="cover"
            >
                <View style={theme.authBackgroundOverlay} />
                {showLanguages && <Languages
                    isVisible={showLanguages}
                    onHide={() => setShowLanguages(false)}
                    languages={languages}
                />}
                { showPreferences && <Preferences 
                    isVisible={showPreferences} 
                    onHide={() => {
                        setShowPreferences(false)
                        router.push('/')
                    }}
                /> }
                <View style={theme.statusBarHeight} />
                <View style={theme.authMainContainer}>
                    {/* App Logo */}
                    <View style={theme.authLogoContainer}>
                        <Image 
                            source={require('@/assets/images/logo.png')} 
                            style={theme.authLogoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title Section */}
                    <View style={theme.authTitleSection}>
                        <Text style={theme.authTitle}>
                            {t('Login to your')}{'\n'}{t('account')}
                        </Text>
                        <Text style={theme.authWelcomeText}>
                            {t('Welcome back to AppFryer!')}
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={theme.authFormSection}>
                        <View>
                            <TextInput
                                autoCorrect={false}
                                inputMode='email'
                                keyboardType='email-address'
                                autoCapitalize='none'
                                placeholder={t('Email')}
                                textContentType='emailAddress'
                                value={email}
                                styleContainer={theme.authInputContainer}
                                onChangeText={handleEmailChange}
                                onBlur={onBlurEmail}
                            />
                            {emailError !== '' && <Text type='error' style={theme.authErrorText}>{emailError}</Text>}
                            
                            <TextInput
                                autoCapitalize='none'
                                placeholder={t('Password')}
                                textContentType='password'
                                value={password}
                                secureTextEntry
                                styleContainer={theme.authInputContainer}
                                onChangeText={handlePasswordChange}
                                onBlur={onBlurPassword}
                            />
                            {passwordError !== '' && <Text type='error' style={theme.authErrorText}>{passwordError}</Text>}
                        </View>
                        
                        <View style={s.rememberForgotContainer}>
                            <Checkbox
                                type='square'
                                text={t('Remember me')}
                                onPress={handleRememberMeToggle}
                                checked={rememberMe}
                                style={theme.authCheckbox}
                            />
                            <Pressable onPress={handleForgotPassword}>
                                <Text type='link' style={s.forgotPasswordText}>{t('Forgot Password?')}</Text>
                            </Pressable>
                        </View>

                        {loginError !== '' && <Text style={theme.authErrorText} type='error'>{loginError}</Text>}
                        
                        <Button 
                            disabled={isSentReq} 
                            text={t('Login')} 
                            onPress={tryToLogin}
                            style={theme.authPrimaryButton}
                        />

                        {/* Divider */}
                        <View style={theme.authDividerContainer}>
                            <View style={theme.authDividerLine} />
                            <View style={theme.authDividerCircle} />
                            <View style={theme.authDividerLine} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={theme.authSocialButtonsContainer}>
                            <Pressable onPress={handleGoogleSignIn}  style={theme.authSocialButton}>
                                <Image 
                                    source={googleIcon} 
                                    style={theme.authSocialIcon}
                                />
                                <Text style={theme.authSocialButtonText}>{t('Sign In with Google')}</Text>
                            </Pressable>
                            <Pressable onPress={handleFacebookSignIn}  style={theme.authSocialButton}>
                                <Image 
                                    source={facebookIcon} 
                                    style={theme.authSocialIcon}
                                />
                                <Text style={theme.authSocialButtonText}>{t('Sign In with Facebook')}</Text>
                            </Pressable>
                        </View>

                        { Platform.OS === 'ios' && (
                            <View style={s.appleLoginContainer}>
                                <AppleAuth.AppleAuthenticationButton
                                    buttonType={AppleAuth.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={AppleAuth.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                                    cornerRadius={10}
                                    style={s.appleButton}
                                    onPress={onAppleButtonPress}
                                />
                            </View>
                        )}

                        {/* Sign Up Link */}
                        <View style={theme.authLinkContainer}>
                            <Text style={theme.authSecondaryText}>{t('Don\'t have an account yet?')} </Text>
                            <Text type='link' onPress={handleSignUp} style={theme.authLinkText}>{t('Sign Up')}</Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </KeyboardAwareScrollView>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    rememberForgotContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: Colors.mainColor,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 19.6, // 140% of 14px
        letterSpacing: -0.14, // -1% of 14px
        textAlign: 'right',
    },
    appleLoginContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    appleButton: {
        width: '100%',
        height: 56,
    },
})

import { useCallback, useEffect, useState } from 'react'
import { Platform, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import * as AppleAuth from 'expo-apple-authentication'

import { Button, Checkbox, IconButton, Text, TextInput, View } from '@/components/base/BaseComponents'
import Languages from '@/components/modals/Languages'
import Preferences from '@/components/modals/Preferences'
import { validateEmail, validatePassword } from '@/services/validators'
import { post } from '@/services/apiRequests'
import { useAuth } from '@/contexts/authContext'
import { useSettings } from '@/contexts/settingsContext'
import { useAppState } from '@/contexts/appStateContext'
import { fetchLanguages } from '@/services/fetches'
import { logError } from '@/services/utils'
import { theme, isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'

export default function LoginScreen() {
    const router = useRouter()
    const { i18n, t } = useTranslation()
    const { setUser } = useAuth()
    const { settings, setSettings } = useSettings()
    const { appState, setAppState } = useAppState()

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

    const envelope = require('@/assets/icons/login-envelope.png')
    const lockOn = require('@/assets/icons/login-lock-on.png')
    // const googleIcon = require('@/assets/icons/login-google.png')
    // const facebookIcon = require('@/assets/icons/login-facebook.png')

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
        <View style={theme.container}>
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
            <KeyboardAwareScrollView keyboardDismissMode='on-drag'>
                <View style={[theme.mainContainer, theme.authContainer]}>
                    <View style={theme.titleContainer}>
                        <Text type="title" style={theme.appNameText}>AppFryer</Text>
                    </View>

                    <View style={{flex: 1}}>
                        <Text style={theme.authTitle}>
                            {t('Login to your')}{'\n'}{t('account')}
                        </Text>
                        <Text style={{ paddingTop: 10, paddingBottom: 20 }}>
                            {t('Welcome back to AppFryer!')}
                        </Text>

                        <View style={s.loginFieldsContainer}>
                            <TextInput
                                startIcon={envelope}
                                autoCorrect={false}
                                inputMode='email'
                                keyboardType='email-address'
                                autoCapitalize='none'
                                placeholder={t('Email')}
                                textContentType='emailAddress'
                                value={email}
                                onChangeText={text => {
                                    setEmail(text)
                                    setEmailError('')
                                    setLoginError('')
                                }}
                                onBlur={onBlurEmail}
                            />
                            {emailError !== '' && <Text type='error'>{emailError}</Text>}
                            <TextInput
                                startIcon={lockOn}
                                autoCapitalize='none'
                                placeholder={t('Password')}
                                textContentType='password'
                                value={password}
                                secureTextEntry
                                onChangeText={text => {
                                    setPassword(text)
                                    setPasswordError('')
                                    setLoginError('')
                                }}
                                onBlur={onBlurPassword}
                            />
                            {passwordError !== '' && <Text type='error'>{passwordError}</Text>}
                        </View>
                        
                        <View style={s.loginAdditionalActions}>
                            <Checkbox
                                type='square'
                                text={t('Remember me')}
                                onPress={() => setRememberMe(!rememberMe)}
                                checked={rememberMe}
                            />
                            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                                <Text type='link' style={{ fontFamily: 'DMSans-Medium' }}>{t('Forgot Password?')}</Text>
                            </Pressable>
                        </View>

                        { Platform.OS === 'ios' && <View>
                            <View style={s.loginOrDivider}>
                                <View style={{ height: 1, flex: 1, backgroundColor: Colors.lightGrey }} />
                                <Text style={{ paddingHorizontal: 12, color: isLight() ? Colors.grey : Colors.lightGrey }}>{t('or')}</Text>
                                <View style={{ height: 1, flex: 1, backgroundColor: Colors.lightGrey }} />
                            </View>

                            <View style={s.appleLoginWrap}>
                                <AppleAuth.AppleAuthenticationButton
                                    buttonType={AppleAuth.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={AppleAuth.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                                    cornerRadius={5}
                                    style={{
                                        width: 200,
                                        height: 44,
                                    }}
                                    onPress={() => onAppleButtonPress()}
                                />
                            </View>
                        </View>}

                        {/* <View style={[
                            s.loginAdditionalActions,
                            { gap: 16, marginBottom: 10 },
                        ]}>
                            <IconButton icon={googleIcon} onPress={() => router.push('/(auth)/signup')} />
                            <IconButton icon={facebookIcon} onPress={() => router.push('/(auth)/signup')} />
                        </View> */}
                    </View>

                    <View style={s.bottomPart}>
                        {loginError !== '' && <Text style={{ alignSelf: 'center', marginBottom: 16 }} type='error'>{loginError}</Text>}
                        <Button disabled={isSentReq} text={t('Login')} onPress={tryToLogin} />
                        <View style={s.signupContainer}>
                            <Text>{t("Don't have an account yet?")}</Text>
                            <Text type='link' onPress={() => router.push('/(auth)/signup')}>{t('Sign Up')}</Text>
                        </View>

                        <Pressable style={{ justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowLanguages(true)}>
                            <Text type='link'>{t('Change language')}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    loginFieldsContainer: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
    },
    appleLoginWrap: {
        alignItems: 'center',
    },
    loginAdditionalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    loginOrDivider: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bottomPart: {
        flex: 1,
        alignSelf: 'flex-end',
        marginTop: 12,
        width: '100%',
    },
    signupContainer: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
})

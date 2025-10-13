import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, ImageBackground, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import { Button, Checkbox, Text, TextInput, View } from "@/components/base/BaseComponents"
import Languages from '@/components/modals/Languages'
import Preferences from '@/components/modals/Preferences'
import { useAuth } from '@/contexts/authContext'
import { useAppState } from '@/contexts/appStateContext'
import { validateName, validateEmail, validatePassword } from '@/services/validators'
import { post } from '@/services/apiRequests'
import { fetchLanguages } from '@/services/fetches'
import { theme, isLight, getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { useTheme } from '@/contexts/themeContext'

export default function SignupScreen() {
    const router = useRouter()
    const { t, i18n } = useTranslation()
    const { setUser } = useAuth()
    const { appState, setAppState } = useAppState()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const [showLanguages, setShowLanguages] = useState<boolean>(false)
    const [languages, setLanguages] = useState<Record<string, string>>({})
    const [showPreferences, setShowPreferences] = useState<boolean>(false)

    const [name, setName] = useState<string>('')
    const [nameError, setNameError] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [emailError, setEmailError] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [passwordError, setPasswordError] = useState<string>('')
    const [agreeTerms, setAgreeTerms] = useState<boolean>(false)
    const [agreeTermsError, setAgreeTermsError] = useState<boolean>(false)

    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [registerError, setRegisterError] = useState<string>('')

    const googleIcon = require('@/assets/icons/login-google.png')
    const facebookIcon = require('@/assets/icons/login-facebook.png')

    useEffect(() => {
        if (Object.keys(appState.languages).length === 0) {
            fetchLanguages(setLanguages)
            return
        }
        setLanguages(appState.languages)
    }, [])
    useEffect(() => {
        if (Object.keys(languages).length > 0 && !appState.languages) {
            setAppState({...appState, languages})
        }
    }, [languages])

    const onBlurName = useCallback(() => {
        if (!validateName(name)) {
            setNameError('Please enter a valid name')
            return false
        }
        setNameError('')
        return true
    }, [name])
    const onBlurEmail = useCallback(() => {
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address')
            return false
        }
        setEmailError('')
        return true
    }, [email])
    // TODO: add more rules to password validation
    const onBlurPassword = useCallback(() => {
        if (!validatePassword(password)) {
            setPasswordError('Password must be at least 6 characters long')
            return false
        }
        setPasswordError('')
        return true
    }, [password])

    const onSubmit = useCallback(() => {
        if (!onBlurName() || !onBlurEmail() || !onBlurPassword()) {
            return
        }
        if (!agreeTerms) {
            setAgreeTermsError(true)
            return
        }

        setSentReq(true)
        post({url: '/register', data: {
            fullname: name,
            email,
            password,
            language: i18n.language,
            // username, // optional
        }})
            .then(response => {
                const user = {
                    authenticated: true,
                    fullname: name,
                    email,
                    token: response.token
                }
                AsyncStorage.setItem('user', JSON.stringify(user))
                    .catch(e => console.log('Error: AsyncStorage.setItem("user")', e))
                setUser(user)

                setShowPreferences(true)
            })
            .catch(e => {
                setSentReq(false)
                if (e.response) {
                    console.log(e.response.status, e.response.data)
                    return setRegisterError(e.response.data.message ?? Object.keys(e.response.data.messages).map(key => e.response.data.messages[key]).join('\n'))
                }
                console.log(e)
            })
    }, [name, email, password, agreeTerms])

    return (
        <KeyboardAwareScrollView keyboardDismissMode='on-drag' style={theme.authScrollView}>
            <ImageBackground 
                source={require('@/assets/images/signup-bg.jpg')} 
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
                            {t('Create your')}{'\n'}{t('account')}
                        </Text>
                        <Text style={theme.authWelcomeText}>
                            {t('Welcome to AppFryer!')}
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={theme.authFormSection}>
                        <View>
                            <TextInput
                                autoCorrect={false}
                                inputMode='text'
                                maxLength={30}
                                autoCapitalize='none'
                                placeholder={t('Name')}
                                textContentType='name'
                                value={name}
                                styleContainer={theme.authInputContainer}
                                onChangeText={text => {
                                    setName(text)
                                    setNameError('')
                                    setRegisterError('')
                                }}
                                onBlur={onBlurName}
                            />
                            {nameError !== '' && <Text type='error' style={theme.authErrorText}>{t(nameError)}</Text>}
                            
                            <TextInput
                                autoCorrect={false}
                                inputMode='email'
                                keyboardType='email-address'
                                autoCapitalize='none'
                                placeholder={t('Email')}
                                textContentType='emailAddress'
                                value={email}
                                styleContainer={theme.authInputContainer}
                                onChangeText={text => {
                                    setEmail(text)
                                    setEmailError('')
                                    setRegisterError('')
                                }}
                                onBlur={onBlurEmail}
                            />
                            {emailError !== '' && <Text type='error' style={theme.authErrorText}>{t(emailError)}</Text>}
                            
                            <TextInput
                                autoCapitalize='none'
                                placeholder={t('Password')}
                                textContentType='password'
                                value={password}
                                secureTextEntry
                                styleContainer={theme.authInputContainer}
                                onChangeText={text => {
                                    setPassword(text)
                                    setPasswordError('')
                                    setRegisterError('')
                                }}
                                onBlur={onBlurPassword}
                            />
                            {passwordError !== '' && <Text type='error' style={theme.authErrorText}>{t(passwordError)}</Text>}
                        </View>

                        {registerError !== '' && <Text style={theme.authErrorText} type='error'>{t(registerError)}</Text>}

                        {/* Divider */}
                        <View style={theme.authDividerContainer}>
                            <View style={theme.authDividerLine} />
                            <View style={theme.authDividerCircle} />
                            <View style={theme.authDividerLine} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={theme.authSocialButtonsContainer}>
                            <Pressable style={theme.authSocialButton}>
                                <Image 
                                    source={googleIcon} 
                                    style={theme.authSocialIcon}
                                />
                                <Text style={theme.authSocialButtonText}>{t('Sign Up with Google')}</Text>
                            </Pressable>
                            <Pressable style={theme.authSocialButton}>
                                <Image 
                                    source={facebookIcon} 
                                    style={theme.authSocialIcon}
                                />
                                <Text style={theme.authSocialButtonText}>{t('Sign Up with Facebook')}</Text>
                            </Pressable>
                        </View>

                        {/* Terms and Conditions */}
                        <View style={s.termsContainer}>
                            <Checkbox
                                type='square'
                                checked={agreeTerms}
                                onPress={() => {
                                    setAgreeTerms(!agreeTerms)
                                    setAgreeTermsError(false)
                                }}
                            />
                            <View style={s.termsTextContainer}>
                                <Text style={s.termsText}>{t('I agree to the')} </Text>
                                <Pressable onPress={() => router.push({pathname: '/(pages)/static-page', params: {name: 'terms'}})}>
                                    <Text style={s.termsLink}>{t('Terms and Conditions')}</Text>
                                </Pressable>
                            </View>
                        </View>
                        {agreeTermsError && <Text type='error' style={theme.authErrorText}>{t('Please, confirm that you agree to the Terms and Conditions')}</Text>}
                        
                        <Button 
                            disabled={isSentReq} 
                            text={t('Sign Up')} 
                            onPress={onSubmit}
                            style={theme.authPrimaryButton}
                        />

                        {/* Login Link */}
                        <View style={theme.authLinkContainer}>
                            <Text style={theme.authSecondaryText}>{t('Already have an account?')} </Text>
                            <Text type='link' onPress={() => router.push('/(auth)/login')} style={theme.authLinkText}>{t('Login')}</Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </KeyboardAwareScrollView>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    termsTextContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginLeft: 8,
    },
    termsText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '500',
        color: Colors.greyTextColor,
        lineHeight: 19.6,
        letterSpacing: -0.14,
    },
    termsLink: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        color: Colors.mainColor,
        lineHeight: 19.6,
        letterSpacing: -0.14,
    },
})

import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import { BackButton, Button, Checkbox, IconButton, Text, TextInput, View } from "@/components/base/BaseComponents"
import Languages from '@/components/modals/Languages'
import Preferences from '@/components/modals/Preferences'
import { useAuth } from '@/contexts/authContext'
import { useAppState } from '@/contexts/appStateContext'
import { validateName, validateEmail, validatePassword } from '@/services/validators'
import { post } from '@/services/apiRequests'
import { fetchLanguages } from '@/services/fetches'
import { theme, isLight } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'

export default function SignupScreen() {
    const router = useRouter()
    const { t, i18n } = useTranslation()
    const { setUser } = useAuth()
    const { appState, setAppState } = useAppState()

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

    const person = require('@/assets/icons/login-person.png')
    const envelope = require('@/assets/icons/login-envelope.png')
    const lockOn = require('@/assets/icons/login-lock-on.png')
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
        <View style={theme.container}>

            {showLanguages && <Languages
                isVisible={showLanguages}
                onHide={() => setShowLanguages(false)}
                languages={languages}
            />}

            <View style={theme.statusBarHeight} />
            <KeyboardAwareScrollView keyboardDismissMode='on-drag'>
            <View style={[theme.mainContainer, theme.authContainer]}>
                <View style={{ position: 'absolute', top: -18, left: 0, zIndex: 100 }}>
                    <BackButton />
                </View>
                { showPreferences && <Preferences 
                    isVisible={showPreferences} 
                    onHide={() => {
                        setShowPreferences(false)
                        router.push('/')
                    }}
                /> }
                <View style={[theme.mainContainer, theme.authContainer]}>
                    <View>
                        <View style={theme.titleContainer}>
                            <Text type="title" style={theme.appNameText}>AppFryer</Text>
                        </View>

                        <View>
                            <Text style={theme.authTitle}>
                                {t('Create your')}{'\n'}{t('account')}
                            </Text>
                            <Text style={{ paddingTop: 10, paddingBottom: 20 }}>
                                {t('Welcome to AppFryer!')}
                            </Text>
                        </View>
                        <View style={s.loginFieldsContainer}>
                            <TextInput
                                startIcon={person}
                                autoCorrect={false}
                                inputMode='text'
                                maxLength={30}
                                autoCapitalize='none'
                                placeholder={t('Name')}
                                textContentType='name'
                                value={name}
                                onChangeText={text => {
                                    setName(text)
                                    setNameError('')
                                    setRegisterError('')
                                }}
                                onBlur={onBlurName}
                            />
                            {nameError !== '' && <Text type='error'>{t(nameError)}</Text>}
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
                                    setRegisterError('')
                                }}
                                onBlur={onBlurEmail}
                            />
                            {emailError !== '' && <Text type='error'>{t(emailError)}</Text>}
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
                                    setRegisterError('')
                                }}
                                onBlur={onBlurPassword}
                            />
                            {passwordError !== '' && <Text type='error'>{t(passwordError)}</Text>}
                        </View>

                        {/* <View style={s.loginOrDivider}>
                            <View style={{ height: 1, flex: 1, backgroundColor: Colors.lightGrey }} />
                            <Text style={{ paddingHorizontal: 12, color: Colors.grey }}>{t('or')}</Text>
                            <View style={{ height: 1, flex: 1, backgroundColor: Colors.lightGrey }} />
                        </View>

                        <View style={[
                            s.loginAdditionalActions,
                            { gap: 16, marginBottom: 10 },
                        ]}>
                            <IconButton icon={googleIcon} onPress={() => router.replace('/(auth)/signup')} />
                            <IconButton icon={facebookIcon} onPress={() => router.replace('/(auth)/signup')} />
                        </View> */}
                        <View>
                            <Checkbox
                                type='square'
                                checked={agreeTerms}
                                onPress={() => {
                                    setAgreeTerms(!agreeTerms)
                                    setAgreeTermsError(false)
                                }}
                            >
                                <Text style={{ color: isLight() ? Colors.grey : Colors.lightGrey }}>{t('I agree to the')}</Text>
                                <Pressable onPress={() => router.push({pathname: '/(pages)/static-page', params: {name: 'terms'}})}>
                                    <Text type='link' style={{ fontFamily: 'DMSans-Medium' }}>{t('Terms and Conditions')}</Text>
                                </Pressable>
                            </Checkbox>
                            {agreeTermsError && <Text type='error'>{t('Please, confirm that you agree to the Terms and Conditions')}</Text>}
                        </View>
                    </View>
                    <View style={{ marginBottom: 20 }}>
                        {registerError && <Text style={{ alignSelf: 'center', marginBottom: 16 }} type='error'>{t(registerError)}</Text>}
                        <Button disabled={isSentReq} text={t('Sign Up')} onPress={onSubmit} />

                        <Pressable style={{ marginTop: 20, justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowLanguages(true)}>
                            <Text type='link'>{t('Change language')}</Text>
                        </Pressable>
                    </View>

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
})

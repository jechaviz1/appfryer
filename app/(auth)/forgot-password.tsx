import { useCallback, useState } from 'react'
import { StyleSheet, ImageBackground, Image, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { useTranslation } from 'react-i18next'

import { Button, Text, TextInput, View } from '@/components/base/BaseComponents'
import { validateEmail } from '@/services/validators'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { theme } from '@/constants/Theme'

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const { t } = useTranslation()

    const [email, setEmail] = useState<string>('')
    const [emailError, setEmailError] = useState<string>('')
    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [submitError, setSubmitError] = useState<string>('')
    const [submitSuccess, setSubmitSuccess] = useState<string>('')
    const window = Dimensions.get('window')

    const onBlurEmail = useCallback(() => {
        if (!validateEmail(email)) {
            setEmailError(t('Please enter a valid email address'))
            return false
        }
        setEmailError('')
        return true
    }, [email])

    const handleSubmit = () => {
        if (!onBlurEmail()) {
            return
        }
        
        setSubmitError('')
        setSubmitSuccess('')
        setSentReq(true)

        post({
            url: '/forgot-password',
            data: {
                email: email,
            }
        })
            .then(response => {
                setSubmitSuccess(t('Password reset instructions have been sent to your email'))
                setEmail('')
            })
            .catch(e => {
                logError(e, 'Forgot password failed')
                setSubmitError(e.response?.data?.message ?? e.message ?? t('Failed to send reset email'))
            })
            .finally(() => setSentReq(false))
    }

    return (
        <KeyboardAwareScrollView keyboardDismissMode='on-drag' style={theme.authScrollView}>
            <ImageBackground 
                source={require('@/assets/images/login-bg.jpg')} 
                style={[theme.authScreenContainer, {height: window.height + Constants.statusBarHeight}]}
                resizeMode="cover"
            >
                <View style={[theme.authBackgroundOverlay]} />
                <View style={[theme.authBackgroundWhiteOverlay]} />
            </ImageBackground>
            <View style={[theme.authMainContainer, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}]}>
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
                        {t('Forgot')}{'\n'}{t('Password')}
                    </Text>
                    <Text style={theme.authWelcomeText}>
                        {t('Enter your email to reset your password')}
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
                            onChangeText={text => {
                                setEmail(text)
                                setEmailError('')
                                setSubmitError('')
                                setSubmitSuccess('')
                            }}
                            onBlur={onBlurEmail}
                        />
                        {emailError !== '' && <Text type='error' style={theme.authErrorText}>{emailError}</Text>}
                    </View>
                    
                    {submitError !== '' && <Text style={theme.authErrorText} type='error'>{submitError}</Text>}
                    {submitSuccess !== '' && <Text style={s.successText}>{submitSuccess}</Text>}
                    
                    <Button 
                        disabled={isSentReq} 
                        text={t('Send Reset Link')} 
                        onPress={handleSubmit}
                        style={theme.authPrimaryButton}
                    />

                    {/* Back to Login Link */}
                    <View style={theme.authLinkContainer}>
                        <Text style={theme.authSecondaryText}>{t('Remember your password?')} </Text>
                        <Text type='link' onPress={() => router.push('/(auth)/login')} style={theme.authLinkText}>{t('Login')}</Text>
                    </View>
                </View>
            </View>
            {/* </ImageBackground> */}
        </KeyboardAwareScrollView>
    )
}

const s = StyleSheet.create({
    successText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: '#28a745',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 19.6,
        letterSpacing: -0.14,
    },
})

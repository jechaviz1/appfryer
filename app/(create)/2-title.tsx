import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, Lines, ScrollView, Text, TextInput, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { isLight, theme } from '@/constants/Theme'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'

export default function TitleStep() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const { t } = useTranslation()

    const [title, setTitle] = useState<string>(recipe?.title || '')
    const [description, setDescription] = useState<string>(recipe?.description || '')
    const [canGoNext, setCanGoNext] = useState(title !== '')

    useEffect(() => {
        if (!recipe) {
            router.replace(`/(tabs)/`)
        }
    }, [])

    useEffect(() => {
        setCanGoNext(title !== '')
    }, [title])


    const nextStep = useCallback(() => {
        if (!recipe) {
            return
        }
        setCanGoNext(false)

        // don't send request if nothing changed
        if (recipe.title && recipe.title === title && recipe.description && recipe.description === description) {
            setCanGoNext(true)
            return router.push(`/(create)/3-categories`)
        }

        post({
            url: `/recipe/${recipe.id}/edit`,
            data: { title, description, },
            token: user?.token
        })
            .then(() => {
                setCanGoNext(true)
                setRecipe({...recipe, title, description})
                router.push(`/(create)/3-categories`)
            })
            .catch(e => {
                logError(e)
                setCanGoNext(true)
            })
    }, [recipe, title, description])

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(create)/1-upload-media')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="caption">{t('Step {{num}}', {num: 2})}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <ScrollView style={s.main}>
                    <View style={s.textWrapper}>
                        <Text type="subtitle" style={s.subtitle}>{t('Enter the title and description of your recipe')}</Text>
                        <TextInput
                            placeholder={t('Enter title')}
                            inputMode='text'
                            value={title}
                            onChangeText={setTitle}
                            styleTextInput={s.input}
                            />
                        <TextInput
                            placeholder={t('Enter description')}
                            inputMode='text'
                            value={description}
                            onChangeText={setDescription}
                            styleTextInput={s.input}
                        />
                    </View>
                    
                </ScrollView>

                <View style={s.btnWrapper}>
                    <View style={{ maxWidth: 136, alignSelf: 'center' }}>
                        <Lines count={7} current={1} />
                    </View>
                    <Button text={t('Next')} disabled={!canGoNext} onPress={nextStep} />
                </View>

            </View>
        </View>
    )
}

const s = StyleSheet.create({
    topbarWrap: {
        marginBottom: 110,
        width: '100%',
        justifyContent: 'space-between',
    },
    topbarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    main: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    textWrapper: {
        marginTop: 42,
        marginBottom: 36,
        gap: 14,
    },
    subtitle: {
        marginHorizontal: 40,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        textAlign: 'center',
    },
    btnWrapper: {
        height: 142,
        justifyContent: 'space-between',
        marginBottom: 82,
    },
})
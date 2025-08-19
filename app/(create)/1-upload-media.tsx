import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Platform, Pressable, StyleSheet } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Asset, ImagePickerResponse, launchImageLibrary } from 'react-native-image-picker'
import { useTranslation } from 'react-i18next'

import { Button, Lines, Text, VideoPlayer, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { isLight, paddings, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'

interface SelectedMedia extends Asset {
    uuid?: string
    url?: string
    urlThumb?: string
}

export default function UploadMediaStep() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const globQuery = useGlobalSearchParams()
    const { t } = useTranslation()

    const [isLoaded, setIsLoaded] = useState<boolean>(false)
    const [media, setMedia] = useState<SelectedMedia[]>(recipe?.media || [])
    const [uploading, setUploading] = useState<boolean>()
    const [error, setError] = useState<string>('')
    const [canAddMedia, setCanAddMedia] = useState<boolean>()
    const [canGoNext, setCanGoNext] = useState<boolean>()

    const prepareRecipe = useCallback((recievedRecipe: any) => {
        const cats = recievedRecipe.categories.map((cat: any) => cat.id)
        const tgs = recievedRecipe.tags.map((tg: any) => tg.id)
        return {
            ...recievedRecipe,
            categories: cats,
            tags: tgs
        }
    }, [])

    useEffect(() => {
        if (!globQuery.id) {
            setIsLoaded(true)
            return
        }
        setError('')
        setCanAddMedia(false)
        setCanGoNext(false)
        get({
            url: `/recipe/${globQuery.id}`,
            token: user?.token,
        }).then(r => {
            setRecipe(prepareRecipe(r))
            setMedia(r.medias)
            setCanAddMedia(true)
            setCanGoNext(true)
            setIsLoaded(true)
        }).catch(logError)
    }, [])

    useEffect(() => {
        if (!globQuery.id && !isLoaded) {
            return setIsLoaded(true)
        }
        if (!isLoaded) {
            return
        }
        setError('')
        setRecipe({...recipe, media})
        setCanAddMedia(!uploading && media.length < 6)
        // can go further only when all media have mediaUuid
        setCanGoNext(media.length > 0 && media.filter(m => !m.uuid).length === 0)
    }, [media, uploading, isLoaded])

    const removeMedia = useCallback((index: number) => {
        setError('')
        setMedia(media.filter((_, i) => i !== index))
    }, [])

    const handleSelectedMedia = useCallback((uploadedMedia: ImagePickerResponse) => {
        if (!recipe || !uploadedMedia.assets || uploadedMedia.assets.length === 0 || !uploadedMedia.assets[0].uri) {
            return
        }
        setError('')
        const file = uploadedMedia.assets[0]
        const updMedia = [...media, file]
        setMedia(updMedia)
        setUploading(true)
        const uri = Platform.OS === 'ios' ? file.uri!.replace('file://', '') : file.uri!
        post({
            url: `/recipe/${recipe.id}/mediaUpload`,
            files: [['mediaFile', {
                uri: uri,
                type: file.type,
                name: file.fileName,
            }]],
            token: user?.token
        })
            .then((mediaResponse: {uuid: string, url: string, urlThumb: string}) => {
                const newMedia = updMedia.map(m => m.fileName === file.fileName
                    ? { ...m,
                        uuid: mediaResponse.uuid,
                        url: mediaResponse.url,
                        urlThumb: mediaResponse.urlThumb
                    } : m
                )
                setMedia(newMedia)
                setUploading(false)
            })
            .catch(e => {
                logError(e)
                setUploading(false)
                setError(e.response?.data?.message)
            })
    }, [media])

    const addMedia = useCallback(() => {
        setError('')
        const allowOnlyImages = media.filter((m: Asset) => m.type?.split('/')[0] === 'video').length > 0
        const allowOnlyVideos = media.filter((m: Asset) => m.type?.split('/')[0] === 'image').length === 5

        launchImageLibrary({
                mediaType: allowOnlyImages ? 'photo' : (allowOnlyVideos ? 'video' : 'mixed'),
                quality: 1
            },
            handleSelectedMedia
        )
    }, [media])

    const nextStep = useCallback(() => {
        if (!recipe || !isLoaded) {
            return
        }
        setError('')
        setCanAddMedia(false)
        setCanGoNext(false)

        // don't send request if nothing changed
        // if (recipe.media.length !== 0 && recipe.media.length === media.length) {
        //     const isSomeChanged = media.some((m: SelectedMedia, i: number) => m.uuid !== media[i].uuid)
        //     if (!isSomeChanged) {
        //         setCanGoNext(true)
        //         return router.push(`/(create)/2-title`)
        //     }
        // }

        post({
            url: `/recipe/${recipe.id}/edit`,
            data: { mediaUuidOrder: media.map(m => m.uuid) },
            token: user?.token
        })
            .then((recievedRecipe) => {
                setRecipe({...recipe, ...recievedRecipe, media})
                // needed, if user back from next step
                setCanGoNext(true)
                setCanAddMedia(true)
                router.push(`/(create)/2-title`)
            })
            .catch(e => {
                logError(e)
                setUploading(false)
                setCanAddMedia(true)
                setCanGoNext(true)
            })
    }, [recipe, isLoaded, media])

    if (!recipe || !isLoaded) {
        // router.replace(`/(tabs)/`)
        return null
    }

    const window = Dimensions.get('window')
    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => (canGoNext || media.length === 0) && router.navigate('/(tabs)/profile')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="caption">{t('Step {{num}}', {num: 1})}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <View style={s.main}>
                    <View style={s.textWrapper}>
                        <Text type="subtitle" style={s.text}>{t('Add Recipe Media')}</Text>
                        <Text style={[s.text, { color: isLight() ? Colors.grey : Colors.lightGrey }]}>{t('Upload 1 video and up to 5 images')}</Text>
                    </View>
                    <View style={[s.mediaWrapper, {width: window.width - paddings * 2}]}>
                        {media.map((item, index) => {
                            const type = item.type?.split('/')[0]
                            return (
                                <View key={index}>
                                    {type === 'video' && (
                                        <VideoPlayer
                                            uri={item.uri! ?? item.url!}
                                            style={s.mediaItem}
                                            isRendered={true}
                                            playIconSize={20}
                                            paused
                                        />
                                    )}
                                    {type === 'image' && (
                                        <Image source={{ uri: item.uri || item.url }} style={s.mediaItem} />
                                    )}
                                    { !uploading && canGoNext && <Pressable style={s.closeBtn} onPress={() => removeMedia(index)}>
                                        <Image source={require('@/assets/icons/x-white.png')} style={{ width: 16, height: 16 }} />
                                    </Pressable> }
                                </View>
                            )})}
                        {canAddMedia && (
                            <Pressable onPress={addMedia}>
                                <View style={[s.mediaItem, s.plusBtn]}>
                                    <Image source={require('@/assets/icons/plus-grey.png')} style={{ width: 20, height: 20 }} />
                                </View>
                            </Pressable>
                        )}
                    </View>
                    { uploading && <Text type='defaultSemiBold' style={s.uploadingCaption}>{t('Uploading')}</Text> }
                </View>

                <View style={s.btnWrapper}>
                    <Text style={{ textAlign: 'center' }} type="error">{error}</Text>
                    <View style={{ maxWidth: 136, alignSelf: 'center' }}>
                        <Lines count={7} current={0} />
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
    iconWrapper: {
        width: 116,
        height: 116,
        backgroundColor: Colors.mainColorLight,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textWrapper: {
        marginTop: 42,
        marginBottom: 36,
        gap: 14,
    },
    text: {
        marginHorizontal: 56,
        textAlign: 'center',
    },
    mediaWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 11,
        alignItems: 'flex-start',
    },
    mediaItem: {
        width: 112,
        height: 112,
        borderRadius: 14,
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute',
        zIndex: 100,
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        backgroundColor: '#00000066',
    },
    plusBtn: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingCaption: {
        position: 'absolute',
        bottom: 10,
    },
    btnWrapper: {
        height: 142,
        justifyContent: 'space-between',
        marginBottom: 82,
    },
})
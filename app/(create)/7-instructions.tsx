import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Keyboard, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Asset } from 'react-native-image-picker'
import { Slider } from '@miblanchard/react-native-slider'
import Modal from "react-native-modal"
import { useTranslation } from 'react-i18next'

import { Button, Checkbox, Lines, ScrollView, Text, TextInput, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { getBgColor, isLight, paddings, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { timeFromMinutes } from '@/services/datetime'

interface IStep {
    title: string
    description?: string
    mediaUuid?: string
    info?: string
    cookingTime?: number
}

interface ImageMedia extends Asset {
    uuid: string
    urlThumb: string
}

interface IStepProps {
    index: number
    step: IStep
    stepsArr: IStep[]
    setStepsArr: React.Dispatch<React.SetStateAction<IStep[]>>
    onDelete: () => void
}

function StepRow({ index, step, stepsArr, setStepsArr, onDelete }: IStepProps) {
    const { t } = useTranslation()
    const { recipe } = useRecipe()

    const [stepInner, setStepInner] = useState<IStep>(step)

    useEffect(() => {
        setStepInner(step)
    }, [step])

    const updateArr = useCallback(() => {
        const updArr = [...stepsArr]
        updArr[index] = stepInner
        setStepsArr(updArr)
    }, [stepsArr, stepInner])

    const toggleUsedImage = useCallback((uuid: string) => {
        const updStep = {...stepInner}
        updStep.mediaUuid = updStep.mediaUuid === uuid ? undefined : uuid
        setStepInner(updStep)

        const updArr = [...stepsArr]
        updArr[index] = updStep
        setStepsArr(updArr)
    }, [stepsArr, stepInner])

    return (
        <View>
            <View style={[s.instructionRow]}>
            <View style={{ flex: 1, gap: 10 }}>
                <TextInput
                    styleTextInput={s.input}
                    inputMode='text'
                    placeholder={t('Enter instruction')}
                    value={stepInner.title}
                    onChangeText={(title) => setStepInner({...stepInner, title })}
                    onBlur={updateArr}
                />
                <TextInput
                    multiline
                    styleTextInput={s.input}
                    inputMode='text'
                    styleContainer={{ height: 80 }}
                    placeholder={t('Enter description')}
                    value={stepInner.description}
                    onChangeText={(description) => setStepInner({...stepInner, description })}
                    onBlur={updateArr}
                />

                <View style={s.images}>
                    {recipe?.media.filter((m: ImageMedia) => m.type?.split('/')[0] === 'image').map((m: ImageMedia, i: number) => (
                        <Pressable key={i} onPress={() => toggleUsedImage(m.uuid)}>
                            {m.urlThumb && m.urlThumb.trim() !== '' ? (
                                <Image
                                    source={{uri: m.urlThumb}}
                                    style={s.image}
                                    key={m.uri}
                                />
                            ) : (
                                <View style={[s.image, s.placeholderImage]} />
                            )}
                            { stepInner.mediaUuid === m.uuid && <View style={[s.image, s.selectedImageOverlay]}>
                                <Image source={require('@/assets/icons/x-white.png')} style={s.closeBtn} />
                            </View> }
                        </Pressable>
                    ))}
                </View>

                <TextInput
                    multiline
                    styleTextInput={s.input}
                    inputMode='text'
                    styleContainer={{ height: 60 }}
                    placeholder={t('Enter info (optional)')}
                    value={stepInner.info}
                    onChangeText={(info) => setStepInner({...stepInner, info })}
                    onBlur={updateArr}
                />

                <View style={s.timerCaption}>
                    <Checkbox
                        text={t('Need timer')}
                        checked={stepInner.cookingTime !== undefined && stepInner.cookingTime > 0}
                        onPress={() => setStepInner({...stepInner, cookingTime: stepInner.cookingTime ? 0 : 1})}
                    />
                    {stepInner.cookingTime !== undefined && stepInner.cookingTime > 0 &&
                        <Text>{timeFromMinutes(stepInner.cookingTime)}</Text>
                    }
                </View>

                {stepInner.cookingTime !== undefined && stepInner.cookingTime > 0 &&
                    <Slider
                        value={stepInner.cookingTime || 1}
                        onValueChange={v => setStepInner({...stepInner, cookingTime: Array.isArray(v) ? v[0] : v })}
                        minimumValue={1}
                        maximumValue={240}
                        step={1}
                        minimumTrackTintColor={Colors.mainColor}
                        maximumTrackTintColor={Colors.lightGrey}
                        thumbTintColor={Colors.white}
                        thumbStyle={s.thumb}
                    />
                }
            </View>

            <Pressable onPress={onDelete}>
                <Image source={require('@/assets/icons/trash-can.png')} style={s.trash} />
            </Pressable>
            </View>

            {index !== stepsArr.length - 1 && <View style={s.line} />}
        </View>
        
    )
}

export default function InstructionsStep() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const { t } = useTranslation()

    const [cookingSteps, setCookingSteps] = useState<IStep[]>([])
    const [canGoNext, setCanGoNext] = useState(false)
    const [showPopup, setShowPopup] = useState(false)

    useEffect(() => {
        if (recipe?.cookingSteps) {
            setCookingSteps(recipe.cookingSteps)
        }
    }, [])

    useEffect(() => {
        const isFilledTitles = cookingSteps.length > 0 && cookingSteps.filter(i => i.title !== '').length === cookingSteps.length
        const isFilledDescriptions = cookingSteps.length > 0 && cookingSteps.filter(i => i.description !== '').length === cookingSteps.length

        setCanGoNext(isFilledTitles && isFilledDescriptions)
    }, [cookingSteps])

    const onAddStep = useCallback(() => {
        if (cookingSteps[cookingSteps.length - 1]?.title === '') return
        setCookingSteps([...cookingSteps, {title: ''}])
        Keyboard.dismiss()
    }, [cookingSteps])

    const onDelete = useCallback((index: number) => {
        setCookingSteps(cookingSteps.filter((_, i) => i !== index))
        Keyboard.dismiss()
    }, [cookingSteps])

    const onDone = useCallback(() => {
        Keyboard.dismiss()

        const preparedSteps = cookingSteps.map((s: IStep) => {
            return {
                ...s,
                description: s.description ? s.description : '',
                mediaUuid: s.mediaUuid ? s.mediaUuid : null,
                info: s.info && s.info !== '' ? s.info : null,
                cookingTime: s.cookingTime && s.cookingTime !== 0 ? s.cookingTime : null
            }
        })
        setCanGoNext(false)
        post({
            url: `/recipe/${recipe!.id}/edit`,
            data: {
                cookingSteps: preparedSteps,
                isPublished: true,
            },
            token: user?.token
        })
            .then((r) => {
                setRecipe({ ...recipe, cookingSteps })
                setShowPopup(true)
            })
            .catch(e => {
                logError(e)
                setCanGoNext(true)
            })
    }, [cookingSteps])

    const onClosePopup = useCallback(() => {
        setShowPopup(false)
        router.push('/(tabs)/profile')
    }, [])

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')
    const window = Dimensions.get('window')

    return (
        <View style={theme.container}>
            {showPopup && <Modal
                isVisible={showPopup}
                style={[theme.modal, s.modal, {backgroundColor: getBgColor()}]}
                onModalHide={onClosePopup}
                onBackdropPress={onClosePopup}
            >
                <View style={s.modalContent}>
                    <Text type='title' style={{ textAlign: 'center' }}>{t('Recipe uploaded successfully!')}</Text>
                </View>
            </Modal> }

            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(create)/6-ingredients')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="caption">{t('Step {{num}}', {num: 7})}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <ScrollView style={s.main}>
                    <View style={[s.wrapper, {width: window.width - paddings * 2}]}>
                        <Text type="subtitle" style={s.subtitle}>{t('Enter the instructions for the recipe')}</Text>
                        {cookingSteps.map((instr, index) => (
                            <StepRow
                                key={instr.title || index}
                                index={index}
                                step={instr}
                                stepsArr={cookingSteps}
                                setStepsArr={setCookingSteps}
                                onDelete={() => onDelete(index)}
                            />
                        ))}

                        <Pressable onPress={onAddStep} >
                            <Text type='link'>{t('Add new')}</Text>
                        </Pressable>

                    </View>
                </ScrollView>

                <View style={s.btnWrapper}>
                    <View style={{ maxWidth: 136, alignSelf: 'center' }}>
                        <Lines count={7} current={6} />
                    </View>
                    <Button text={t('Done')} disabled={!canGoNext} onPress={onDone} />
                </View>

            </View>
        </View>
    )
}

const s = StyleSheet.create({
    modal: {
        marginTop: '140%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topbarWrap: {
        marginBottom: 24,
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
        marginBottom: 20,
    },
    wrapper: {
        marginTop: 12,
        marginBottom: 36,
        gap: 14,
    },
    subtitle: {
        marginHorizontal: 48,
        marginBottom: 20,
        textAlign: 'center',
    },
    instructionRow: {
        flexDirection: 'row',
        // alignItems: 'center',
        gap: 6,
    },
    input: {
        flex: 1,
    },
    images: {
        flexDirection: 'row',
        gap: 10,
    },
    image: {
        width: 56,
        height: 56,
        borderRadius: 8,
    },
    placeholderImage: {
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#00000040',
    },
    closeBtn: {
        width: 16,
        height: 16,
        top: 0,
        left: 40,
    },
    timerCaption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    thumb: {
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    trash: {
        marginTop: 18,
        width: 18,
        height: 18,
        flex: 0,
    },
    line: {
        width: "100%",
        height: 1,
        backgroundColor: Colors.neutralGrey,
        marginTop: 16,
    },
    btnWrapper: {
        height: 142,
        justifyContent: 'space-between',
        marginBottom: 82,
    },
})
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Keyboard, Platform, Pressable, StyleSheet } from 'react-native'
import { Asset, ImagePickerResponse, launchImageLibrary } from 'react-native-image-picker'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Slider } from '@miblanchard/react-native-slider'
import Modal from 'react-native-modal'
import { useTranslation } from 'react-i18next'

import { Button, ModalTitle, ScrollView, Text, TextInput, View, VideoPlayer } from '@/components/base/BaseComponents'
import IngredientSearchInput from '@/components/IngredientSearchInput'
import Measures from '@/components/modals/Measures'
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { getBgColor, isLight, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { timeFromMinutes } from '@/services/datetime'
import { fetchMeasures } from '@/services/fetches'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IIngredinent, { IMeasure } from '@/interfaces/Ingredient'
import IPrefItem from '@/interfaces/PrefItem'

// Lazy import to avoid type issues and normalize default export shape
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _RNSearchableDropdown: any = require('react-native-searchable-dropdown')
const SearchableDropdown: any = _RNSearchableDropdown?.default || _RNSearchableDropdown

interface SelectedMedia extends Asset {
    uuid?: string
    url?: string
    urlThumb?: string
}

interface IStep {
    title: string
    description?: string
    mediaUuid?: string
    info?: string
    cookingTime?: number
}

interface IngredientProps {
    section: 'main' | 'other'
    ingredient: IIngredinent | null
    rowIndex: number
    ingredientsArr: (IIngredinent | null)[]
    setIngredientsArr: React.Dispatch<React.SetStateAction<(IIngredinent | null)[]>>
    onDelete: () => void
    measures: IMeasure[]
}

function IngredientRow({
    section,
    ingredient,
    rowIndex,
    ingredientsArr,
    setIngredientsArr,
    onDelete,
    measures,
}: IngredientProps) {
    const { t } = useTranslation()

    const [ingredientInner, setIngredientInner] = useState<IIngredinent | null>(null)
    const [cnt, setCnt] = useState<string>('')
    const [measure, setMeasure] = useState<number>(1)
    const [displayModal, setDisplayModal] = useState(false)
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)

    useEffect(() => {
        if (ingredient) {
            setIngredientInner(ingredient)
            setCnt(ingredient.cnt?.toString() || '')
            setMeasure(ingredient.measureId || 1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const updatedArray = [...ingredientsArr]
        updatedArray[rowIndex] = ingredientInner
        setIngredientsArr(updatedArray)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingredientInner])

    useEffect(() => {
        if (!ingredientInner) return
        const updatedIngredient = { ...ingredientInner, cnt: Number(cnt), measureId: measure }
        setIngredientInner(updatedIngredient)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cnt, measure])

    const onAdd = useCallback((ing: IIngredinent | IPrefItem) => {
        setIngredientInner({ ...(ing as IIngredinent), ingredientId: (ing as any).id, section })
    }, [section])

    return (
        <View style={[s.ingredientRow, isPopupOpen ? s.ingredientRowActive : undefined]}>
            {displayModal && (
                <Measures
                    isVisible={displayModal}
                    onHide={() => setDisplayModal(false)}
                    onSubmit={(m) => setMeasure(m.id)}
                />
            )}

            <View style={s.ingredientWrapper}>
                {ingredientInner ? (
                    <TextInput
                        readOnly
                        multiline
                        value={ingredientInner.title || (ingredientInner as any).ingredientTitle}
                        styleContainer={{ paddingHorizontal: 6 }}
                    />
                ) : (
                    <IngredientSearchInput
                        type='ingredient'
                        selected={ingredientsArr}
                        placeholder={t('Enter ingredient')}
                        onSelectedIngredient={onAdd}
                        onPopupVisibleChange={setIsPopupOpen}
                    />
                )}
            </View>

            <TextInput
                readOnly={!ingredientInner}
                styleContainer={s.quantityInput}
                styleTextInput={{ textAlign: 'center' }}
                placeholder='0'
                inputMode='numeric'
                value={cnt}
                onChangeText={setCnt}
            />
            <Button
                text={measures.find((m) => m.id === measure)?.title}
                shape='square'
                disabled={!ingredientInner}
                style={s.measureBtn}
                onPress={() => setDisplayModal(true)}
            />

            <Pressable onPress={onDelete}>
                <Image source={require('@/assets/icons/trash-can.png')} style={s.trashIcon} />
            </Pressable>
        </View>
    )
}

export default function CreateRecipePage() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const globQuery = useGlobalSearchParams()
    const { t } = useTranslation()

    const [isLoaded, setIsLoaded] = useState<boolean>(false)
    const [media, setMedia] = useState<SelectedMedia[]>([])
    const [uploading, setUploading] = useState<boolean>()
    const [mediaError, setMediaError] = useState<string>('')
    const [canAddMedia, setCanAddMedia] = useState<boolean>()
    const [canGoNext, setCanGoNext] = useState<boolean>()

    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')

    const [categories, setCategories] = useState<IPrefItem[]>([])
    const [tags, setTags] = useState<IPrefItem[]>([])
    const [filteredCats, setFilteredCats] = useState<IPrefItem[]>([])
    const [filteredTags, setFilteredTags] = useState<IPrefItem[]>([])
    const [selectedCategories, setSelectedCategories] = useState<number[]>([])
    const [selectedTags, setSelectedTags] = useState<number[]>([])
    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [showAdding, setShowAdding] = useState<boolean>(false)
    const [addCat, setAddCat] = useState<string>('')
    const [addTag, setAddTag] = useState<string>('')
    const [categoryError, setCategoryError] = useState<string>('')
    
    const [showPortionsDropdown, setShowPortionsDropdown] = useState(false)
    const [portions, setPortions] = useState<number>(1)
    const [showPrepTimeModal, setShowPrepTimeModal] = useState(false)
    const [showCookingTimeModal, setShowCookingTimeModal] = useState(false)
    const [showTempModal, setShowTempModal] = useState(false)

    const [prepTime, setPrepTime] = useState<number>(5)
    const [cookingTime, setCookingTime] = useState<number>(5)
    const [temperature, setTemperature] = useState<number>(20)

    const [mainIngredients, setMainIngredients] = useState<(IIngredinent | null)[]>([])
    const [otherIngredients, setOtherIngredients] = useState<(IIngredinent | null)[]>([])
    const [measures, setMeasures] = useState<IMeasure[]>([])
    const [canConfirmIngredients, setCanConfirmIngredients] = useState<boolean>(false)

    const [cookingSteps, setCookingSteps] = useState<IStep[]>([])

    const [showModal, setShowModal] = useState<boolean>(false)
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
    const [showIngredientsModal, setShowIngredientsModal] = useState<boolean>(false)

    useEffect(() => {
        if (showIngredientsModal) {
            fetchMeasures(setMeasures, user!.token)
        }
    }, [showIngredientsModal, user])

    useEffect(() => {
        const mainArr = mainIngredients.filter((ing: IIngredinent | null): ing is IIngredinent => ing !== null)
        const otherArr = otherIngredients.filter((ing: IIngredinent | null): ing is IIngredinent => ing !== null)
        if (mainArr.length === 0 && otherArr.length === 0) {
            setCanConfirmIngredients(false)
            return
        }
        const hasEmptyQty = [...mainArr, ...otherArr].some((ing: IIngredinent) => !ing.cnt)
        setCanConfirmIngredients(!hasEmptyQty)
    }, [mainIngredients, otherIngredients])

    const onAddIngredient = useCallback((type: 'main' | 'other') => {
        const [arr, setArr] = type === 'main' ? [mainIngredients, setMainIngredients] : [otherIngredients, setOtherIngredients]
        if (arr[arr.length - 1] === null) {
            return
        }
        setArr([...arr, null])
    }, [mainIngredients, otherIngredients])

    const onDeleteIngredient = useCallback((type: 'main' | 'other', index: number) => {
        const [arr, setArr] = type === 'main' ? [mainIngredients, setMainIngredients] : [otherIngredients, setOtherIngredients]
        const updated = [...arr]
        updated.splice(index, 1)
        setArr(updated)
    }, [mainIngredients, otherIngredients])

    const prepareRecipe = useCallback((recievedRecipe: any) => {
        const cats = recievedRecipe.categories.map((cat: any) => cat.id)
        const tgs = recievedRecipe.tags.map((tg: any) => tg.id)
        return {
            ...recievedRecipe,
            categories: cats,
            tags: tgs,
        }
    }, [])

    useEffect(() => {
        if (!globQuery.id) {
            setIsLoaded(true)
            return
        }
        setMediaError('')
        setCanAddMedia(false)
        setCanGoNext(false)
        get({
            url: `/recipe/${globQuery.id}`,
            token: user?.token,
        })
            .then(r => {
                const preparedRecipe = prepareRecipe(r)
                setRecipe(preparedRecipe)
                setMedia(r.medias)
                setTitle(r.title || '')
                setDescription(r.description || '')
                setSelectedCategories(preparedRecipe.categories || [])
                setSelectedTags(preparedRecipe.tags || [])
                setPortions(r.portions || 1)
                setPrepTime(r.timePreparation || 5)
                setCookingTime(r.timeCooking || 5)
                setTemperature(r.temperature || 20)
                setMainIngredients(r.ingredients?.filter((ing: IIngredinent) => ing.section === 'main') || [])
                setOtherIngredients(
                    r.ingredients?.filter((ing: IIngredinent) => ing.section === null || ing.section === 'other') || []
                )
                setCookingSteps(r.cookingSteps || [])
                setCanAddMedia(true)
                setCanGoNext(true)
                setIsLoaded(true)
            })
            .catch(logError)
    }, [])

    useEffect(() => {
        get({ url: '/meta/categories', token: user?.token })
            .then(cats => {
                setCategories(cats)
                setFilteredCats(cats)
            })
            .catch(logError)

        get({ url: '/meta/tags', token: user?.token })
            .then(tgs => {
                setTags(tgs)
                setFilteredTags(tgs)
            })
            .catch(logError)
    }, [user?.token])

    useEffect(() => {
        if (!globQuery.id && !isLoaded) {
            setIsLoaded(true)
            return
        }
        if (!isLoaded) {
            return
        }
        setMediaError('')
        setRecipe(prev => (prev ? { ...prev, media } : prev))
        setCanAddMedia(!uploading && media.length < 6)
        setCanGoNext(media.length > 0 && media.filter(m => !m.uuid).length === 0)
    }, [media, uploading, isLoaded, setRecipe, globQuery.id])

    const removeMedia = useCallback((index: number) => {
        setMediaError('')
        setMedia(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleSelectedMedia = useCallback((uploadedMedia: ImagePickerResponse) => {
        if (!uploadedMedia?.assets || uploadedMedia.assets.length === 0 || !uploadedMedia.assets[0].uri) {
            return
        }
        if (!recipe) {
            // ensure recipe is created before trying again
            return
        }
        setMediaError('')
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
            token: user?.token,
        })
            .then((mediaResponse: { uuid: string, url: string, urlThumb: string }) => {
                const newMedia = updMedia.map(m => m.fileName === file.fileName
                    ? {
                        ...m,
                        uuid: mediaResponse.uuid,
                        url: mediaResponse.url,
                        urlThumb: mediaResponse.urlThumb,
                    } : m
                )
                setMedia(newMedia)
                setUploading(false)
            })
            .catch(e => {
                logError(e)
                setUploading(false)
                setMediaError(e.response?.data?.message || t('Failed to upload media'))
            })
    }, [media, recipe, user?.token, t])

    const addMedia = useCallback(() => {
        setMediaError('')

        if (!user?.token) {
            setMediaError(t('Please login first'))
            return
        }

        if (!recipe) {
            post({ url: '/recipe/create', token: user.token })
                .then((obtainedEmptyRecipe) => {
                    const createdRecipe = { ...obtainedEmptyRecipe, id: obtainedEmptyRecipe.recipeId }
                    setRecipe(createdRecipe)
                    try {
                        if (!launchImageLibrary) {
                            setMediaError(t('Image picker not available'))
                            return
                        }
                        const allowOnlyImages = media.filter((m: Asset) => m.type?.split('/')[0] === 'video').length > 0
                        const allowOnlyVideos = media.filter((m: Asset) => m.type?.split('/')[0] === 'image').length === 5
                        launchImageLibrary({
                            mediaType: allowOnlyImages ? 'photo' : (allowOnlyVideos ? 'video' : 'mixed'),
                            quality: 1,
                        }, handleSelectedMedia)
                    } catch (error) {
                        console.error('Error launching image library:', error)
                        setMediaError(t('Failed to open image picker'))
                    }
                })
                .catch(e => {
                    logError(e)
                    setMediaError(t('Failed to create recipe'))
                })
            return
        }

        const allowOnlyImages = media.filter((m: Asset) => m.type?.split('/')[0] === 'video').length > 0
        const allowOnlyVideos = media.filter((m: Asset) => m.type?.split('/')[0] === 'image').length === 5

        try {
            if (!launchImageLibrary) {
                setMediaError(t('Image picker not available'))
                return
            }

            launchImageLibrary({
                mediaType: allowOnlyImages ? 'photo' : (allowOnlyVideos ? 'video' : 'mixed'),
                quality: 1,
            }, handleSelectedMedia)
        } catch (error) {
            console.error('Error launching image library:', error)
            setMediaError(t('Failed to open image picker'))
        }
    }, [media, handleSelectedMedia, recipe, user?.token, setRecipe, t])

    const toggleFilters = useCallback(() => {
        if (showFilters) {
            setFilteredCats(categories)
            setFilteredTags(tags)
        }
        if (!showFilters && showAdding) {
            setShowAdding(false)
        }
        setShowFilters(!showFilters)
    }, [showFilters, showAdding, categories, tags])

    const changeFilterCats = useCallback((text: string) => {
        if (text.length > 0) {
            setFilteredCats(categories.filter((cat: IPrefItem) => cat.title.toLowerCase().includes(text.toLowerCase())))
        } else {
            setFilteredCats(categories)
        }
    }, [categories])

    const changeFilterTags = useCallback((text: string) => {
        if (text.length > 2) {
            setFilteredTags(tags.filter((tag: IPrefItem) => tag.title.toLowerCase().includes(text.toLowerCase())))
        } else {
            setFilteredTags(tags)
        }
    }, [tags])

    const toggleAdding = useCallback(() => {
        if (showAdding) {
            setAddCat('')
            setAddTag('')
            setCategoryError('')
        }
        if (!showAdding && showFilters) {
            setShowFilters(false)
            setFilteredCats(categories)
            setFilteredTags(tags)
        }
        setShowAdding(!showAdding)
    }, [showAdding, showFilters, categories, tags])

    const onAddCategory = useCallback(() => {
        const trimmedCat = addCat.trim()
        const trimmedTag = addTag.trim()
        if (trimmedCat === '' && trimmedTag === '') {
            return
        }

        const types = {
            category: {
                url: '/meta/category/create',
                data: { title: trimmedCat },
                setList: setCategories,
                setSelected: setSelectedCategories,
                setFilteredList: setFilteredCats,
                list: categories,
                selectedList: selectedCategories,
                filteredList: filteredCats,
            },
            tag: {
                url: '/meta/tag/create',
                data: { title: trimmedTag },
                setList: setTags,
                setSelected: setSelectedTags,
                setFilteredList: setFilteredTags,
                list: tags,
                selectedList: selectedTags,
                filteredList: filteredTags,
            },
        }
        const type = trimmedCat !== '' ? 'category' : 'tag'

        post({
            url: types[type].url,
            data: types[type].data,
            token: user?.token,
        })
            .then(resp => {
                types[type].setList([resp, ...types[type].list])
                types[type].setFilteredList([resp, ...types[type].filteredList])
                types[type].setSelected([...types[type].selectedList, resp.id])

                setAddCat('')
                setAddTag('')
                setShowAdding(false)
                setCategoryError('')
            })
            .catch(e => {
                logError(e)
                setCategoryError(e.response?.data?.message || t('Failed to add item'))
            })
    }, [showAdding, addCat, addTag, categories, tags, selectedCategories, selectedTags, filteredCats, filteredTags, user?.token, t])

    const saveRecipe = useCallback(() => {
        Keyboard.dismiss()

        if (!title.trim()) {
            alert(t('Please enter a title'))
            return
        }
        if (media.length === 0) {
            alert(t('Please add at least one photo or video'))
            return
        }
        if (selectedCategories.length === 0) {
            alert(t('Please select at least one category'))
            return
        }

        const mainArr = mainIngredients.filter((ing): ing is IIngredinent => ing !== null)
        const otherArr = otherIngredients.filter((ing): ing is IIngredinent => ing !== null)

        if (mainArr.length === 0 && otherArr.length === 0) {
            alert(t('Please add at least one ingredient'))
            return
        }

        if ([...mainArr, ...otherArr].some((ing) => !ing.cnt)) {
            alert(t('Please enter quantity for each ingredient'))
            return
        }

        const preparedSteps = cookingSteps
            .filter(step => step.title && step.title.trim() !== '')
            .map(step => ({
                ...step,
                title: step.title.trim(),
                description: step.description ? step.description.trim() : '',
                mediaUuid: step.mediaUuid ?? null,
                info: step.info && step.info.trim() !== '' ? step.info.trim() : null,
                cookingTime: step.cookingTime && step.cookingTime > 0 ? step.cookingTime : null,
            }))

        if (preparedSteps.length === 0) {
            alert(t('Please enter recipe instructions'))
            return
        }

        if (preparedSteps.some(step => step.description === '')) {
            alert(t('Please add descriptions for each instruction'))
            return
        }

        const payload = {
            title,
            description,
            categories: selectedCategories,
            tags: selectedTags,
            portions,
            timePreparation: prepTime,
            timeCooking: cookingTime,
            temperature,
            ingredients: [...mainArr, ...otherArr],
            cookingSteps: preparedSteps,
            isPublished: true,
        }

        const submit = (targetRecipe: any) => {
            post({
                url: `/recipe/${targetRecipe.id}/edit`,
                data: payload,
                token: user?.token,
            })
                .then((r) => {
                    setRecipe({ ...targetRecipe, ...r, ...payload, media })
                    setShowSuccessModal(true)
                })
                .catch(logError)
        }

        if (!recipe) {
            if (!user?.token) {
                alert(t('Please login first'))
                return
            }
            post({ url: '/recipe/create', token: user.token })
                .then((obtainedEmptyRecipe) => {
                    const createdRecipe = { ...obtainedEmptyRecipe, id: obtainedEmptyRecipe.recipeId }
                    setRecipe(createdRecipe)
                    submit(createdRecipe)
                })
                .catch(logError)
            return
        }

        submit(recipe)
    }, [
        title,
        t,
        media,
        selectedCategories,
        mainIngredients,
        otherIngredients,
        cookingSteps,
        description,
        selectedTags,
        portions,
        prepTime,
        cookingTime,
        temperature,
        recipe,
        user?.token,
        setRecipe,
        setShowSuccessModal,
    ])

    const hide = useCallback(() => {
        setShowModal(false)
        router.navigate(`/(tabs)/`)
    }, [router])

    const onCloseSuccessModal = useCallback(() => {
        setShowSuccessModal(false)
        router.push('/(tabs)/profile')
    }, [router])

    if (!recipe && !isLoaded) {
        return null
    }

    return (
        <View style={s.container}>
            <Modal
                isVisible={showModal}
                style={[theme.modal, s.modal, { backgroundColor: getBgColor() }]}
                onModalHide={hide}
                onBackdropPress={hide}
            >
                <View>
                    <ModalTitle title={t('You are not a creator')} onHide={hide} />
                </View>
            </Modal>

            {showSuccessModal && (
                <Modal
                    isVisible={showSuccessModal}
                    style={[theme.modal, s.modal, { backgroundColor: getBgColor() }]}
                    onModalHide={onCloseSuccessModal}
                    onBackdropPress={onCloseSuccessModal}
                >
                    <View style={s.modalContent}>
                        <Text type='title' style={{ textAlign: 'center' }}>{t('Recipe uploaded successfully!')}</Text>
                    </View>
                </Modal>
            )}

            <View style={theme.statusBarHeight} />

            <View style={s.header}>
                <Pressable onPress={() => router.navigate('/(tabs)/')} style={s.headerButton}>
                    <Image source={require('@/assets/icons/back-2.png')} style={s.headerIcon} />
                </Pressable>
                <Text style={s.headerTitle}>{t('New recipe')}</Text>
                <View style={s.headerButton} />
            </View>

            <ScrollView
                style={s.main}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
            >
                {/* Media Upload Section */}
                <View style={s.mediaSection}>
                    <Text style={s.sectionTitle}>{t('Add recipe photos or videos')}</Text>
                    <Text style={s.sectionSubtitle}>{t('Upload 1 video and up to 5 images')}</Text>
                    <View style={s.mediaWrapper}>
                        {media.map((item, index) => {
                            const type = item.type?.split('/')[0]
                            return (
                                <View key={`${item.fileName || item.uuid || index}`} style={s.mediaItemContainer}>
                                    {type === 'video' && (
                                        <VideoPlayer
                                            uri={item.uri ?? item.url ?? ''}
                                            style={s.mediaItem}
                                            isRendered
                                            playIconSize={20}
                                            paused
                                        />
                                    )}
                                    {type === 'image' && (
                                        <Image source={{ uri: item.uri || item.url }} style={s.mediaItem} />
                                    )}
                                    {!uploading && canGoNext && (
                                        <Pressable style={s.closeBtn} onPress={() => removeMedia(index)}>
                                            <Image source={require('@/assets/icons/x-white.png')} style={s.closeIcon} />
                                        </Pressable>
                                    )}
                                </View>
                            )
                        })}
                        {(canAddMedia || !recipe) && user?.token && (
                            <Pressable onPress={addMedia}>
                                <View style={[s.mediaItem, s.plusBtn]}>
                                    <Image source={require('@/assets/icons/plus-grey.png')} style={s.plusIcon} />
                                </View>
                            </Pressable>
                        )}
                    </View>
                    {uploading ? <Text type='defaultSemiBold' style={s.uploadingCaption}>{t('Uploading')}</Text> : null}
                    {mediaError ? <Text type='error' style={s.errorText}>{mediaError}</Text> : null}
                    {!user?.token && <Text type='caption' style={s.mediaHint}>{t('Please login first to add media')}</Text>}
                </View>

                {/* Title Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Add a catchy title')}</Text>
                    <TextInput
                        placeholder={t('Add a catchy title')}
                        inputMode='text'
                        value={title}
                        onChangeText={setTitle}
                        styleContainer={s.newInputContainer}
                        styleTextInput={s.newInputText}
                    />
                </View>

                {/* Description Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Write a description of your recipe')}</Text>
                    <TextInput
                        placeholder={t('Write a description of your recipe')}
                        inputMode='text'
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        styleContainer={[s.newInputContainer, s.newTextAreaContainer]}
                        styleTextInput={[s.newTextArea, s.newInputText]}
                    />
                    <Text style={s.characterCounter}>{description.length}/400</Text>
                </View>

                {/* Categories Section */}
                <View style={s.inputSection}>
                    <SearchableDropdown
                        multi={true}
                        chip={false}
                        resetValue={false}
                        listProps={{ nestedScrollEnabled: true, scrollEnabled: false }}
                        onTextChange={(text: string) => {
                            setShowFilters(true)
                            changeFilterCats(text)
                        }}
                        onItemSelect={(item: { id: number; name: string }) => {
                            if (selectedCategories.includes(item.id)) {
                                setSelectedCategories(selectedCategories.filter(id => id !== item.id))
                            } else {
                                setSelectedCategories([...selectedCategories, item.id])
                            }
                            setShowFilters(false)
                            setFilteredCats(categories)
                        }}
                        onRemoveItem={(item: { id: number }) => {
                            setSelectedCategories(selectedCategories.filter(id => id !== item.id))
                        }}
                        containerStyle={{}}
                        items={categories.map((c: IPrefItem) => ({ id: c.id, name: c.title }))}
                        textInputProps={{
                            placeholder: t('Add categories') as string,
                            underlineColorAndroid: 'transparent',
                            autoCorrect: false,
                            style: {
                                backgroundColor: Colors.white,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E0E0E0',
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                fontSize: 16,
                                color: Colors.black,
                            },
                        }}
                        itemsContainerStyle={{
                            backgroundColor: Colors.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E0E0E0',
                        }}
                        itemStyle={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#E0E0E0',
                            height: 50,
                        }}
                        itemTextStyle={{ color: Colors.black }}
                        placeholderTextColor={Colors.grey}
                        underlineColorAndroid="transparent"
                        selectedItems={selectedCategories
                            .map(id => {
                                const cat = categories.find(c => c.id === id)
                                return cat ? { id: cat.id, name: cat.title } : null
                            })
                            .filter(Boolean)}
                    />

                    {showAdding && (
                        <View style={s.addCategoryContainer}>
                            <TextInput
                                value={addCat}
                                onChangeText={(val) => {
                                    setAddCat(val)
                                    categoryError && setCategoryError('')
                                }}
                                placeholder={t('Add category')}
                                styleContainer={s.newInputContainer}
                                styleTextInput={s.newInputText}
                            />
                            {addCat.trim() !== '' && (
                                <Button
                                    text={t('Add category')}
                                    onPress={onAddCategory}
                                    shape='round'
                                    style={s.addButton}
                                />
                            )}
                        </View>
                    )}

                    {categoryError !== '' && <Text type='error' style={s.errorText}>{categoryError}</Text>}
                    
                    {/* Selected Categories as Tags */}
                    {selectedCategories.length > 0 && (
                        <View style={s.tagsContainer}>
                            {selectedCategories.map((catId) => {
                                const cat = categories.find(c => c.id === catId)
                                return cat ? (
                                    <View key={cat.id} style={s.tag}>
                                        <Text style={s.tagText}>{cat.title}</Text>
                                        <Pressable onPress={() => setSelectedCategories(selectedCategories.filter(id => id !== cat.id))}>
                                            <Image source={require('@/assets/icons/circle-x-2.png')} style={s.tagCloseIcon} />
                                        </Pressable>
                                    </View>
                                ) : null
                            })}
                        </View>
                    )}
                </View>

                {/* Tags Section */}
                <View style={s.inputSection}>
                    <SearchableDropdown
                        multi={true}
                        chip={false}
                        resetValue={false}
                        listProps={{ nestedScrollEnabled: true, scrollEnabled: false }}
                        onItemSelect={(item: { id: number; name: string }) => {
                            if (selectedTags.includes(item.id)) {
                                setSelectedTags(selectedTags.filter(id => id !== item.id))
                            } else {
                                setSelectedTags([...selectedTags, item.id])
                            }
                        }}
                        oneSubmit={false}
                        containerStyle={{}}
                        selectedItems={selectedTags
                            .map(id => {
                                const tg = tags.find(t => t.id === id)
                                return tg ? { id: tg.id, name: tg.title } : null
                            })
                            .filter(Boolean)}
                        items={tags.map((t: IPrefItem) => ({ id: t.id, name: t.title }))}
                        textInputProps={{
                            placeholder: t('Add tags') as string,
                            underlineColorAndroid: 'transparent',
                            autoCorrect: false,
                            style: {
                                backgroundColor: Colors.white,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E0E0E0',
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                fontSize: 16,
                                color: Colors.black,
                            },
                        }}
                        itemsContainerStyle={{
                            backgroundColor: Colors.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E0E0E0',
                            marginTop: 8,
                        }}
                        itemStyle={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#E0E0E0',
                            height: 50,
                        }}
                        itemTextStyle={{ color: Colors.black }}
                        placeholderTextColor={Colors.grey}
                        underlineColorAndroid="transparent"
                        onRemoveItem={(item: { id: number }) => {
                            setSelectedTags(selectedTags.filter(id => id !== item.id))
                        }}
                    />

                    {/* Selected Tags as Chips */}
                    {selectedTags.length > 0 && (
                        <View style={s.tagsContainer}>
                            {selectedTags.map((tagId) => {
                                const tg = tags.find(t => t.id === tagId)
                                return tg ? (
                                    <View key={tg.id} style={s.tag}>
                                        <Text style={s.tagText}>{tg.title}</Text>
                                        <Pressable onPress={() => setSelectedTags(selectedTags.filter(id => id !== tg.id))}>
                                            <Image source={require('@/assets/icons/circle-x-2.png')} style={s.tagCloseIcon} />
                                        </Pressable>
                                    </View>
                                ) : null
                            })}
                        </View>
                    )}
                </View>

                {/* Servings Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Number of servings')}</Text>
                    <Pressable
                        style={s.dropdownContainer}
                        onPress={() => setShowPortionsDropdown(prev => !prev)}
                    >
                        <Text style={[s.newInputText, {flex:1}]}>{`${portions} ${t('Servings')}`}</Text>
                        <Image source={require('@/assets/icons/chevron-down-light.png')} style={s.dropdownIcon} />
                    </Pressable>

                    {showPortionsDropdown && (
                        <View style={s.dropdownMenu}>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
                                <Pressable
                                    key={val}
                                    style={s.dropdownItem}
                                    onPress={() => {
                                        setPortions(val)
                                        setShowPortionsDropdown(false)
                                    }}
                                >
                                    <Text style={s.dropdownItemText}>{`${val} ${t('Servings')}`}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                {/* Preparation Time Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Preparation time')}</Text>
                    <Pressable style={s.dropdownContainer} onPress={() => setShowPrepTimeModal(true)}>
                        <Text style={[s.newInputText, {flex:1}]}>{timeFromMinutes(prepTime)}</Text>
                    </Pressable>
                </View>

                {/* Cooking Time Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Cooking time')}</Text>
                    <Pressable style={s.dropdownContainer} onPress={() => setShowCookingTimeModal(true)}>
                        <Text style={[s.newInputText, {flex:1}]}>{timeFromMinutes(cookingTime)}</Text>
                    </Pressable>
                </View>

                {/* Temperature Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Temperature')}</Text>
                    <Pressable style={s.dropdownContainer} onPress={() => setShowTempModal(true)}>
                        <Text style={[s.newInputText, {flex:1}]}>{`${temperature}°C`}</Text>
                    </Pressable>
                </View>

                {/* Ingredients Section */}
                <View style={s.inputSection}>
                    <Pressable
                        style={s.ingredientsButton}
                        onPress={() => {
                            if (mainIngredients.length === 0) {
                                setMainIngredients([null])
                            }
                            setShowIngredientsModal(true)
                        }}
                    >
                        <Text style={s.ingredientsButtonText}>{t('Enter ingredients and quantities')}</Text>
                        <Image source={require('@/assets/icons/chevron-right-neutral-grey.png')} style={s.chevronIcon} />
                    </Pressable>
                </View>

                {/* Instructions Section */}
                <View style={s.inputSection}>
                    <Text style={s.inputLabel}>{t('Recipe instructions')}</Text>
                    <TextInput
                        placeholder={t('Recipe instructions')}
                        inputMode='text'
                        value={cookingSteps.map(step => step.title).join('\n\n')}
                        onChangeText={(text) => {
                            const steps = text.split('\n\n').filter(s => s.trim() !== '').map(title => ({ title: title.trim(), description: '' }))
                            setCookingSteps(steps)
                        }}
                        multiline
                        styleContainer={[s.newInputContainer, s.newTextAreaContainer]}
                        styleTextInput={[s.newTextArea, s.newInputText]}
                    />
                    <Text style={s.characterCounter}>{cookingSteps.map(step => step.title).join('\n\n').length}/400</Text>
                </View>
            </ScrollView>

            {/* Create Recipe Button */}
            <View style={s.btnWrapper}>
                <Button
                    text={t('Create recipe')}
                    onPress={saveRecipe}
                    style={s.createButton}
                />
            </View>
            {showPrepTimeModal && (
                <Modal isVisible={showPrepTimeModal} onBackdropPress={()=>setShowPrepTimeModal(false)} style={[theme.modal, {backgroundColor: getBgColor()}]}>
                    <View style={s.modalContent}>
                        <Text type='subtitle'>{t('Preparation time')}</Text>
                        <Text style={{textAlign:'center', marginBottom:12}}>{timeFromMinutes(prepTime)}</Text>
                        <Slider
                            value={prepTime}
                            onValueChange={v=>setPrepTime(Array.isArray(v)?v[0]:v)}
                            minimumValue={5}
                            maximumValue={240}
                            step={5}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbStyle={s.thumb}
                        />
                        <Button text={t('OK')} onPress={()=>setShowPrepTimeModal(false)} style={{marginTop:20}} />
                    </View>
                </Modal>
            )}
            {showCookingTimeModal && (
                <Modal isVisible={showCookingTimeModal} onBackdropPress={()=>setShowCookingTimeModal(false)} style={[theme.modal, {backgroundColor: getBgColor()}]}>
                    <View style={s.modalContent}>
                        <Text type='subtitle'>{t('Cooking time')}</Text>
                        <Text style={{textAlign:'center', marginBottom:12}}>{timeFromMinutes(cookingTime)}</Text>
                        <Slider
                            value={cookingTime}
                            onValueChange={v=>setCookingTime(Array.isArray(v)?v[0]:v)}
                            minimumValue={5}
                            maximumValue={240}
                            step={5}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbStyle={s.thumb}
                        />
                        <Button text={t('OK')} onPress={()=>setShowCookingTimeModal(false)} style={{marginTop:20}} />
                    </View>
                </Modal>
            )}
            {showTempModal && (
                <Modal isVisible={showTempModal} onBackdropPress={()=>setShowTempModal(false)} style={[theme.modal, {backgroundColor: getBgColor()}]}>
                    <View style={s.modalContent}>
                        <Text type='subtitle'>{t('Temperature')}</Text>
                        <Text style={{textAlign:'center', marginBottom:12}}>{`${temperature}°C`}</Text>
                        <Slider
                            value={temperature}
                            onValueChange={v=>setTemperature(Array.isArray(v)?v[0]:v)}
                            minimumValue={20}
                            maximumValue={260}
                            step={5}
                            minimumTrackTintColor={Colors.mainColor}
                            maximumTrackTintColor={Colors.lightGrey}
                            thumbStyle={s.thumb}
                        />
                        <Button text={t('OK')} onPress={()=>setShowTempModal(false)} style={{marginTop:20}} />
                    </View>
                </Modal>
            )}
            {showIngredientsModal && (
                <Modal isVisible={showIngredientsModal} onBackdropPress={()=>setShowIngredientsModal(false)} style={[theme.modal, {backgroundColor: getBgColor()}]}>
                    <View style={s.modalContent}>
                        <Text type='subtitle' style={{textAlign:'center'}}>{t('Ingredients and Quantities')}</Text>
                        <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} keyboardShouldPersistTaps="always" nestedScrollEnabled>
                            <View style={{ gap: 12 }}>
                                <Text type='caption'>{t('Main')}</Text>
                                {mainIngredients.map((ingredient, index) => (
                                    <IngredientRow
                                        key={`main-${index}`}
                                        section='main'
                                        ingredient={ingredient}
                                        rowIndex={index}
                                        ingredientsArr={mainIngredients}
                                        setIngredientsArr={setMainIngredients}
                                        onDelete={() => onDeleteIngredient('main', index)}
                                        measures={measures}
                                    />
                                ))}
                                <Pressable onPress={() => onAddIngredient('main')}>
                                    <Text type='link'>{t('Add new')}</Text>
                                </Pressable>

                                <Text type='caption'>{t('Other')}</Text>
                                {otherIngredients.map((ingredient, index) => (
                                    <IngredientRow
                                        key={`other-${index}`}
                                        section='other'
                                        ingredient={ingredient}
                                        rowIndex={index}
                                        ingredientsArr={otherIngredients}
                                        setIngredientsArr={setOtherIngredients}
                                        onDelete={() => onDeleteIngredient('other', index)}
                                        measures={measures}
                                    />
                                ))}
                                <Pressable onPress={() => onAddIngredient('other')}>
                                    <Text type='link'>{t('Add new')}</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                        <Button text={t('Done')} disabled={!canConfirmIngredients} onPress={()=>setShowIngredientsModal(false)} style={{marginTop:20}} />
                    </View>
                </Modal>
            )}
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    modal: {
        marginTop: Dimensions.get('window').height * 0.6,
        paddingTop: 16,
        justifyContent: 'flex-start',
    },
    modalContent: {
        padding: 20,
        borderRadius: 16,
        gap: 12,
    },
    header: {
        backgroundColor: '#4F4240',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        height: 60,
    },
    headerButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    headerIcon: {
        width: 13,
        height: 23,
        tintColor: Colors.white,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    main: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 100,
        gap: 20,
        backgroundColor: Colors.mainBGColor,
    },
    mediaSection: {
        gap: 12,
        backgroundColor: Colors.mainBGColor,
    },
    sectionTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    sectionSubtitle: {
        fontFamily: 'Poppins',
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 22,
        color: '#6C7278',
    },
    inputSection: {
        backgroundColor: Colors.mainBGColor,
    },
    inputLabel: {
        fontFamily: 'Poppins',
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 22,
        color: '#919191',
        marginBottom: 5,
    },
    newInputContainer: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    newInputText: {
        fontSize: 15,
        color: '#1B1A1D',
        lineHeight: 22,
        fontFamily: 'Poppins',
        fontWeight: '400',
        paddingVertical: 13,
    },
    newTextAreaContainer: {
        height: 120,
        paddingVertical: 0,
        alignItems: 'flex-start',
    },
    newTextArea: {
        textAlignVertical: 'top',
        height: '100%',
        fontSize: 16,
        color: Colors.black,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
    },
    searchIcon: {
        width: 16,
        height: 16,
        marginRight: 12,
        tintColor: Colors.grey,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    searchInputText: {
        fontSize: 16,
        color: Colors.black,
    },
    tagsContainer: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: Colors.mainBGColor,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6ECE2',
        borderRadius: 18,
        paddingHorizontal: 15,
        height: 34,
        borderWidth: 1,
        borderColor: '#C28040',
        gap: 6,
    },
    tagText: {
        color: '#6C7278',
        fontSize: 14,
        fontWeight: '500',
    },
    tagCloseIcon: {
        width: 18,
        height: 18,
    },
    categoryListContainer: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    categoryListTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.black,
    },
    closeFilterIcon: {
        width: 16,
        height: 16,
        tintColor: Colors.grey,
    },
    categoryList: {
        gap: 0,
    },
    categoryItem: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 0,
        borderColor: 'transparent',
    },
    categoryItemText: {
        fontSize: 16,
        color: Colors.black,
    },
    categoryItemSelected: {
        backgroundColor: Colors.mainColor,
    },
    categoryItemTextSelected: {
        color: Colors.white,
    },
    noResultsContainer: {
        padding: 16,
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 14,
        color: Colors.grey,
        fontStyle: 'italic',
    },
    addCategoryContainer: {
        gap: 12,
        marginTop: 8,
    },
    addButton: {
        backgroundColor: Colors.mainColor,
        borderRadius: 8,
        height: 44,
    },
    dropdownMenu: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
        overflow: 'hidden',
    },
    dropdownItem: {
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF1F3',
    },
    dropdownItemText: {
        fontSize: 15,
        color: Colors.black,
    },
    dropdownContainer: {
        position: 'relative',
        width: '100%',
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    dropdownIcon: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -5 }],
        width: 20,
        height: 10,
        tintColor: '#C28040',
    },
    ingredientsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    ingredientsButtonText: {
        fontSize: 16,
        color: Colors.black,
    },
    chevronIcon: {
        width: 10,
        height: 20,
        tintColor: 'Colors.mainColor',
    },
    stepCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#00000012',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        gap: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.mainColorLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBadgeText: {
        color: Colors.mainColor,
        fontWeight: '600',
    },
    stepHeaderText: {
        flex: 1,
        gap: 6,
    },
    stepTitle: {
        fontSize: 16,
    },
    stepCaption: {
        fontSize: 14,
        color: Colors.grey,
    },
    stepActions: {
        flexDirection: 'row',
        gap: 12,
    },
    stepContent: {
        gap: 16,
    },
    mediaWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 11,
        alignItems: 'flex-start',
        backgroundColor: Colors.mainBGColor,
    },
    mediaItemContainer: {
        position: 'relative',
        width: 106,
        height: 106,
        borderWidth: 1,
        backgroundColor: '#EDF1F3',
    },
    mediaItem: {
        width: 106,
        height: 106,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EDF1F3',
    },
    closeBtn: {
        position: 'absolute',
        zIndex: 100,
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#00000066',
    },
    closeIcon: {
        width: 16,
        height: 16,
    },
    plusBtn: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusIcon: {
        width: 23,
        height: 23,
        tintColor: '#919191',
    },
    uploadingCaption: {
        textAlign: 'center',
    },
    mediaHint: {
        textAlign: 'center',
        color: Colors.grey,
    },
    errorText: {
        textAlign: 'center',
        color: Colors.danger,
    },
    inputContainer: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    textAreaContainer: {
        height: 120,
        paddingVertical: 16,
        alignItems: 'flex-start',
    },
    textArea: {
        textAlignVertical: 'top',
        height: '100%',
    },
    centeredText: {
        textAlign: 'center',
    },
    characterCounter: {
        fontSize: 12,
        color: Colors.grey,
        textAlign: 'right',
    },
    inlinePanel: {
        backgroundColor: Colors.mainBGColor,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    inlineFields: {
        gap: 12,
    },
    stepActionIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.mainBGColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIcon: {
        width: 20,
        height: 20,
    },
    fullWidthButton: {
        width: '100%',
    },
    sectionLabel: {
        marginTop: 8,
        marginBottom: 4,
    },
    choiceList: {
        gap: 12,
    },
    sliderLabel: {
        fontSize: 14,
        color: Colors.black,
    },
    thumb: {
        borderWidth: 5,
        borderColor: Colors.mainColor,
        borderRadius: 10,
        width: 20,
        height: 20,
        backgroundColor: Colors.white,
        alignItems: 'center',
    },
    sectionHelper: {
        color: Colors.grey,
    },
    emptyCaption: {
        color: Colors.grey,
    },
    inlineAction: {
        alignSelf: 'flex-start',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.lightGrey,
    },
    input: {
        flex: 1,
    },
    ingredientRow: {
        flexDirection: 'row',
        gap: 10,
        minHeight: 50,
    },
    ingredientRowActive: {
        zIndex: 2000,
    },
    ingredientWrapper: {
        flex: 1,
    },
    quantityInput: {
        width: 50,
        height: 50,
        paddingHorizontal: 6,
    },
    measureBtn: {
        width: 50,
        height: 50,
    },
    trashIcon: {
        width: 18,
        height: 18,
        marginTop: 16,
    },
    instructionWrapper: {
        gap: 12,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    instructionFields: {
        flex: 1,
        gap: 12,
    },
    instructionDescription: {
        height: 100,
    },
    instructionInfo: {
        height: 70,
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
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedImageIcon: {
        width: 18,
        height: 18,
    },
    timerCaption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    trashButton: {
        paddingTop: 10,
    },
    instructionDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.lightGrey,
    },
    btnWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    createButton: {
        backgroundColor: '#C28040',
        borderRadius: 11,
        height: 54,
        paddingVertical: 11,
        paddingHorizontal: 27,
        width: 308,
        marginHorizontal: 'auto',
    },
})

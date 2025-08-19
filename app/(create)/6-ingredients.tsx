import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, Lines, ScrollView, Text, TextInput, View } from "@/components/base/BaseComponents"
import IngredientSearchInput from "@/components/IngredientSearchInput"
import Measures from "@/components/modals/Measures"
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { isLight, paddings, theme } from '@/constants/Theme'
import { post } from '@/services/apiRequests'
import { fetchMeasures } from '@/services/fetches'
import { logError } from '@/services/utils'
import IIngredinent, { IMeasure } from "@/interfaces/Ingredient"
import IPrefItem from '@/interfaces/PrefItem'

interface IngredientProps {
    section: 'main' | 'other'
    ingredient: IIngredinent | null
    ingredientsArr: (IIngredinent | null)[]
    setIngredientsArr: React.Dispatch<React.SetStateAction<(IIngredinent | null)[]>>
    onDelete: () => void
    measures: IMeasure[]
}
function IngredientRow({
    section,
    ingredient,
    ingredientsArr,
    setIngredientsArr,
    onDelete,
    measures,
}: IngredientProps) {
    const { t } = useTranslation()

    const [ingredientInner, setIngredientInner] = useState<IIngredinent | null>(ingredient)
    const [cnt, setCnt] = useState<string>(ingredient?.cnt?.toString() || '')
    const [measure, setMeasure] = useState<number>(ingredient?.measureId || 1)
    const [displayModal, setDisplayModal] = useState(false)

    useEffect(() => {
        if (ingredient) {
            setIngredientInner(ingredient)
            setCnt(ingredient.cnt?.toString() || '')
            setMeasure(ingredient.measureId || 1)
        }
    }, [])

    useEffect(() => {
        const updArr = [...ingredientsArr]
        let index = updArr.findIndex((item: IIngredinent | null) => item?.id === ingredientInner?.id)
        if (index === -1) {
            index = updArr.length === 0 ? 0 : updArr.length - 1
        }
        updArr[index] = ingredientInner
        setIngredientsArr(updArr)
    }, [ingredientInner])

    useEffect(() => {
        if (!ingredientInner) return
        const updIng = {...ingredientInner, cnt: Number(cnt), measureId: measure}
        setIngredientInner(updIng)
    },[cnt, measure])

    const onAdd = useCallback((ing: IIngredinent | IPrefItem) => {
        setIngredientInner({...ing as IIngredinent, ingredientId: ing.id, section})
    }, [])

    return (
        <View style={s.row}>
            {displayModal && <Measures
                isVisible={displayModal}
                onHide={() => setDisplayModal(false)}
                onSubmit={(m) => setMeasure(m.id)}
            /> }
            
            <View style={s.ingredientWrapper}>
                {ingredientInner
                    ? <TextInput
                        readOnly
                        multiline
                        value={ingredientInner.title || ingredientInner.ingredientTitle}
                        styleContainer={{ paddingHorizontal: 6 }}
                    />
                    : <IngredientSearchInput
                        type='ingredient'
                        selected={ingredientsArr}
                        placeholder={t('Enter ingredient')}
                        onSelectedIngredient={onAdd}
                    />
                }
            </View>

            {/* Quantity can modify only after choosing ingredient */}
            <TextInput
                readOnly={!ingredientInner}
                styleContainer={s.input}
                styleTextInput={{ textAlign: 'center'}}
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
                <Image source={require('@/assets/icons/trash-can.png')} style={s.trash} />
            </Pressable>
        </View>
    )
}

export default function IngredientsStep() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const { t } = useTranslation()
    const [mainIngredients, setMainIngredients] = useState<(IIngredinent | null)[]>([])
    const [otherIngredients, setOtherIngredients] = useState<(IIngredinent | null)[]>([])
    const [canGoNext, setCanGoNext] = useState(false)
    const [measures, setMeasures] = useState<IMeasure[]>([])

    useEffect(() => {
        fetchMeasures(setMeasures, user!.token)
    }, [])

    useEffect(() => {
        if (!recipe) {
            router.replace(`/(tabs)/`)
            return
        }
        const mainArr = recipe.ingredients?.filter((ing: IIngredinent) => ing.section === 'main') || []
        const otherArr = recipe.ingredients?.filter((ing: IIngredinent) => ing.section === null || ing.section === 'other') || []
        setMainIngredients(mainArr)
        setOtherIngredients(otherArr)
    }, [recipe])

    useEffect(() => {
        // is choosed ingredients
        // don't consider empty ingredients
        const mainArr = mainIngredients.filter((ing: IIngredinent | null) => ing !== null)
        const otherArr = otherIngredients.filter((ing: IIngredinent | null) => ing !== null)
        if (mainArr.length === 0 && otherArr.length === 0) {
            setCanGoNext(false)
            return
        }
        // quantity is filled
        if (mainArr.filter((ing: IIngredinent) => !ing.cnt).length > 0 || otherArr.filter((ing: IIngredinent) => !ing.cnt).length > 0) {
            setCanGoNext(false)
            return
        }

        setCanGoNext(true)
    }, [mainIngredients, otherIngredients])

    const onAddIngredient = useCallback((type: 'main' | 'other') => {
        const [arr, setArr] = type === 'main' ? [mainIngredients, setMainIngredients] : [otherIngredients, setOtherIngredients]
        // add only if last ingredient filled
        if (arr[arr.length - 1] === null) {
            return
        }
        setArr([...arr, null])
    }, [mainIngredients, otherIngredients])

    const onDelete = useCallback((type: 'main' | 'other', index: number) => {
        const [arr, setArr] = type === 'main' ? [mainIngredients, setMainIngredients] : [otherIngredients, setOtherIngredients]
        const updArr = [...arr]
        
        updArr.splice(index, 1)
        setArr(updArr)
    }, [mainIngredients, otherIngredients])

    const nextStep = useCallback(() => {
        setCanGoNext(false)

        const ingredients = [
            mainIngredients.filter((ing: IIngredinent | null) => ing !== null),
            otherIngredients.filter((ing: IIngredinent | null) => ing !== null)
        ].flat()

        if (ingredients.length === recipe?.ingredients?.length) {
            const isSomeChanged = recipe.ingredients.some((ing: IIngredinent, i: number) => {
                return ing.ingredientId !== ingredients[i].ingredientId
                    && ing.cnt !== ingredients[i].cnt
                    && ing.measureId !== ingredients[i].measureId
                    && ing.section !== ingredients[i].section
            })

            if (!isSomeChanged) {
                setCanGoNext(true)
                return router.push(`/(create)/7-instructions`)
            }
        }

        post({
            url: `/recipe/${recipe!.id}/edit`,
            data: { ingredients },
            token: user?.token
        })
            .then((r) => {
                setCanGoNext(true)
                setRecipe({ ...recipe, ingredients })
                router.push(`/(create)/7-instructions`)
            })
            .catch(e => {
                setCanGoNext(true)
                logError(e)
            })
    }, [mainIngredients, otherIngredients])

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')
    const window = Dimensions.get('window')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(create)/5-time')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="caption">{t('Step {{num}}', {num: 6})}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <ScrollView style={s.main}>
                    <View style={[s.wrapper, {width: window.width - paddings * 2}]}>
                        <Text type="subtitle" style={s.subtitle}>{t('Enter ingredients and quantities')}</Text>
                        <Text type='caption'>{t('Main')}</Text>
                        {mainIngredients.map((ingredient, index) => (
                            <IngredientRow
                                key={ingredient?.id || index}
                                section='main'
                                ingredient={ingredient}
                                ingredientsArr={mainIngredients}
                                setIngredientsArr={setMainIngredients}
                                onDelete={() => onDelete('main', index)}
                                measures={measures}
                            />
                        ))}

                        <Pressable onPress={() => onAddIngredient('main')} >
                            <Text type='link'>{t('Add new')}</Text>
                        </Pressable>

                        <Text type='caption'>{t('Other')}</Text>
                        {otherIngredients.map((ingredient, index) => (
                            <IngredientRow
                                key={ingredient?.id || index}
                                section='other'
                                ingredient={ingredient}
                                ingredientsArr={otherIngredients}
                                setIngredientsArr={setOtherIngredients}
                                onDelete={() => onDelete('other', index)}
                                measures={measures}
                            />
                        ))}

                        <Pressable onPress={() => onAddIngredient('other')} >
                            <Text type='link'>{t('Add new')}</Text>
                        </Pressable>

                    </View>
                </ScrollView>

                <View style={s.btnWrapper}>
                    <View style={{ maxWidth: 136, alignSelf: 'center' }}>
                        <Lines count={7} current={5} />
                    </View>
                    <Button text={t('Next')} disabled={!canGoNext} onPress={nextStep} />
                </View>

            </View>
        </View>
    )
}

const s = StyleSheet.create({
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
        marginTop: 42,
        marginBottom: 36,
        gap: 14,
    },
    subtitle: {
        marginHorizontal: 48,
        marginBottom: 20,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ingredientWrapper: {
        flex: 1,
    },
    input: {
        width: '14%',
        paddingHorizontal: 6,
    },
    measureBtn: {
        maxWidth: '22%',
    },
    trash: {
        width: 18,
        height: 18,
        flex: 0,
    },
    btnWrapper: {
        height: 142,
        justifyContent: 'space-between',
        marginBottom: 82,
    },
})
import { useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { DonutChart } from "react-native-circular-chart"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import { Button, Text, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import INutritional, { nutrientMap } from '@/interfaces/Nutritional'
import IIngredinent from '@/interfaces/Ingredient'
import { isLight, paddings, theme } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IRecipe from '@/interfaces/Recipe'

interface NutritionalValuesProps {
    isPremium: boolean
    recipe?: IRecipe
    nutrientsInit?: INutritional
    setRecipe?: React.Dispatch<React.SetStateAction<IRecipe | undefined>>
    onSaveLocal?: () => void
}

interface IMacrosResponse {
    ingredients: IIngredinent[]
    nutrients: INutritional
    portionsCnt: number
}

const commonNutrients = [
    'fatTotalG',
    'fatMonoG',
    'fatPolyG',
    'fatSaturatedG',
    'carbG',
    'sugarTotalG',
    'fiberG',
    'proteinG',
]

export default function NutritionalValues({ isPremium, recipe, nutrientsInit, setRecipe, onSaveLocal }: NutritionalValuesProps) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [isAdjustingMacros, setAdjustingMacros] = useState<Boolean>(false)
    const [fatsFactor, setFatsFactor] = useState<number>(recipe?.macrosFactors?.fats ?? 1)
    const [carbsFactor, setCarbsFactor] = useState<number>(recipe?.macrosFactors?.carbs ?? 1)
    const [proteinFactor, setProteinFactor] = useState<number>(recipe?.macrosFactors?.protein ?? 1)
    const [portionsCnt, setPortionsCnt] = useState<number>(recipe?.macrosPortions ?? 1)
    const [nutrients, setNutrients] = useState<INutritional>()

    useEffect(() => {
        setNutrients(nutrientsInit ?? recipe?.nutrients)
    }, [recipe?.nutrients])
    
    // Nutritional values for free account
    if (!isPremium) {
        return (
            <View style={s.wrapper}>
                <Text type='caption' style={{ marginBottom: 12 }}>{t('Nutritional values')}</Text>
                <View style={s.freeWrapper}>
                    <Image source={require('@/assets/images/nutrition.png')} style={s.freeImg}/>
                    <View style={s.freeOverlay}>
                        <View style={s.freeImgWrapper}>
                            <Image source={require('@/assets/icons/lock-on-white.png')} style={s.freeOverlayImg}/>
                        </View>
                        <Text type='caption' style={{ color: Colors.white }}>{t('Coming soon!')}</Text>
                        {/* <Text style={s.freeOverlayText}>{t('Subscribe to see nutritional values and macros for each recipe, adjust quantities and macros, and enjoy an ad-free experience.')}</Text> */}
                    </View>
                </View>
            </View>
        )
    }

    const fetchNewData = (data: {fats: number, carbs: number, protein: number}) => {
        if (!recipe || !setRecipe) {
            return
        }
        setSentReq(true)
        post({
            url: `/recipe/${recipe.id}/changeMacros`,
            data,
            token: user?.token
        })
            .then((macrosResp: IMacrosResponse) => {
                setRecipe({
                    ...recipe,
                    nutrients: macrosResp.nutrients,
                    ingredients: macrosResp.ingredients,
                    macrosPortions: macrosResp.portionsCnt
                })
                setPortionsCnt(macrosResp.portionsCnt)
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }

    const macroMap = {
        fats: {val: fatsFactor, setVal: setFatsFactor},
        carbs: {val: carbsFactor, setVal: setCarbsFactor},
        protein: {val: proteinFactor, setVal: setProteinFactor},
    }
    const changeMacros = (type: keyof typeof macroMap, dir: 'up' | 'down') => {
        const macro = macroMap[type].val
        const newVal = dir === 'up' ? macro + 0.5 : macro - 0.5
        macroMap[type].setVal(newVal)
        const data = {
            fats: fatsFactor,
            carbs: carbsFactor,
            protein: proteinFactor,
        }
        data[type] = newVal
        fetchNewData(data)
    }

    const saveLocal = () => {
        if (!recipe || !onSaveLocal) {
            return
        }
        AsyncStorage.setItem(`recipe/${recipe.id}`, JSON.stringify({
            ...recipe,
            isSaved: true,
            macrosPortions: portionsCnt,
            macrosFactors: {
                fats: fatsFactor,
                carbs: carbsFactor,
                protein: proteinFactor
            },
        }))
        onSaveLocal()
        setAdjustingMacros(false)
    }

    const resetMacros = () => {
        if (!recipe) {
            return
        }
        setAdjustingMacros(false)
        AsyncStorage.removeItem(`recipe/${recipe.id}`)
        if (fatsFactor === 1 && carbsFactor === 1 && proteinFactor === 1) {
            return
        }
        setFatsFactor(1)
        setCarbsFactor(1)
        setProteinFactor(1)
        fetchNewData({
            fats: 1,
            carbs: 1,
            protein: 1,
        })
    }

    const subrecordColor = isLight() ? Colors.grey : Colors.lightGrey
    const windowWidth = Dimensions.get('window').width
    const tolalNutrVal = (nutrients?.carbG ?? 0)
        + (nutrients?.fatTotalG ?? 0)
        + (nutrients?.proteinG ?? 0)
    
    const leftChevron = require('@/assets/icons/chevron-left-neutral-grey.png')
    const rightChevron = require('@/assets/icons/chevron-right-neutral-grey.png')

    return (
        <View style={[s.wrapper, {width: (windowWidth - paddings * 2)}]}>
            <Text type='caption' style={{ marginBottom: 12 }}>{t('Nutritional values')}</Text>
            <View style={[theme.section, {marginBottom: 12, gap: 12}]}>
                <View style={s.recordWrap}>
                    <Text style={s.recordText}>{t('Calories')}</Text>
                    <Text style={s.recordText}>{Number(nutrients?.calories).toFixed(2) || '0'}</Text>
                </View>

                {/* Fat */}
                <View style={s.line} />
                <View style={s.recordWrap}>
                    <Text style={s.recordText}>{t('Total fat')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { isAdjustingMacros && <Text>{fatsFactor}x</Text>}
                        { isAdjustingMacros && fatsFactor > 0.5 ?
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('fats', 'down')}>
                            <Image source={leftChevron} style={s.chevronImg}/>
                        </Pressable> : <Text> </Text> }
                        <Text style={s.recordText}>{nutrients?.fatTotalG || '0'} g</Text>
                        { isAdjustingMacros && fatsFactor < 2 &&
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('fats', 'up')}>
                            <Image source={rightChevron} style={s.chevronImg}/>
                        </Pressable> }
                    </View>
                </View>
                <View style={s.subrecordWrap}>
                    <Text style={[s.subrecordText, {color: subrecordColor}]}>{t('Saturated fat')}</Text>
                    <Text style={s.subrecordText}>{nutrients?.fatSaturatedG || '0'} {t('g')}</Text>
                </View>
                <View style={s.subrecordWrap}>
                    <Text style={[s.subrecordText, {color: subrecordColor}]}>{t('Monounsaturated fat')}</Text>
                    <Text style={s.subrecordText}>{nutrients?.fatMonoG ?? '0'} {t('g')}</Text>
                </View>
                <View style={s.subrecordWrap}>
                    <Text style={[s.subrecordText, {color: subrecordColor}]}>{t('Polyunsaturated fat')}</Text>
                    <Text style={s.subrecordText}>{nutrients?.fatPolyG ?? '0'} {t('g')}</Text>
                </View>

                {/* Carbs */}
                <View style={s.line} />
                <View style={s.recordWrap}>
                    <Text style={s.recordText}>{t('Carbs')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { isAdjustingMacros && <Text>{carbsFactor}x</Text>}
                        { isAdjustingMacros && carbsFactor > 0.5 ?
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('carbs', 'down')}>
                            <Image source={leftChevron} style={s.chevronImg}/>
                        </Pressable> : <Text> </Text> }
                        <Text style={s.recordText}>{nutrients?.carbG ?? '0'} g</Text>
                        { isAdjustingMacros && carbsFactor < 2 &&
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('carbs', 'up')}>
                            <Image source={rightChevron} style={s.chevronImg}/>
                        </Pressable> }
                    </View>
                </View>
                <View style={s.subrecordWrap}>
                    <Text style={[s.subrecordText, {color: subrecordColor}]}>{t('Sugar')}</Text>
                    <Text style={s.subrecordText}>{nutrients?.sugarTotalG ?? '0'} {t('g')}</Text>
                </View>
                <View style={s.subrecordWrap}>
                    <Text style={[s.subrecordText, {color: subrecordColor}]}>{t('Fiber')}</Text>
                    <Text style={s.subrecordText}>{nutrients?.fiberG ?? '0'} {t('g')}</Text>
                </View>

                {/* Protein */}
                <View style={s.line} />
                <View style={s.recordWrap}>
                    <Text style={s.recordText}>{t('Protein')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { isAdjustingMacros && <Text>{proteinFactor}x</Text>}
                        { isAdjustingMacros && proteinFactor > 0.5 ?
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('protein', 'down')}>
                            <Image source={leftChevron} style={s.chevronImg}/>
                        </Pressable> : <Text> </Text> }
                        <Text style={s.recordText}>{nutrients?.proteinG ?? '0'} g</Text>
                        { isAdjustingMacros && proteinFactor < 3 &&
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('protein', 'up')}>
                            <Image source={rightChevron} style={s.chevronImg}/>
                        </Pressable> }
                    </View>
                </View>

                {portionsCnt !== 1 && 
                <View style={s.portionsWrap}>
                    <Text style={s.portionsText}>{t('Eat {{portionsCnt}} portions to match your Macro needs', {portionsCnt})}</Text>
                </View>}

                {/* Macros button */}
                { recipe && (!isAdjustingMacros
                ? <Button
                    text={t('Change Macros')}
                    style={{ marginTop: 32 }}
                    onPress={() => setAdjustingMacros(true)}
                />
                : <View style={s.macrosBtns}>
                    <Button
                        text={t('Save')}
                        isWide={false}
                        style={{ paddingHorizontal: 48 }}
                        onPress={saveLocal}
                    />
                    <Button
                        text={t('Reset')}
                        isWide={false}
                        style={{ paddingHorizontal: 48 }}
                        onPress={resetMacros}
                    />
                </View> )}

                {/* Donut chart */}
                <View style={s.chartWrapper}>
                    {tolalNutrVal !== 0 ? <DonutChart
                        type="round"
                        data={[
                            {name: t('Carbs'), value: nutrients?.carbG ?? 0, color: '#8E59FF'},
                            {name: t('Protein'), value: nutrients?.proteinG ?? 0, color: '#FF5555'},
                            {name: t('Fat'), value: nutrients?.fatTotalG ?? 0, color: '#20BFF7'}
                        ]}
                        radius={53}
                        startAngle={0}
                        endAngle={360}
                        strokeWidth={8}
                        containerWidth={(windowWidth - paddings * 2) / 2}
                        containerHeight={180}
                        animationType="slide"
                        labelTitleStyle={{ display: 'none' }}
                        labelValueStyle={{ display: 'none' }}
                    /> : null }
                    <View style={[s.chartLegendWrap, {width: (windowWidth - paddings * 2) / 2.5}]}>
                        <View style={[s.recordWrap, {gap: 8}]}>
                            <View style={[s.chartLegendColor, {backgroundColor: '#8E59FF'}]}/>
                            <Text style={[s.recordText, {flex: 1}]}>{t('Carbs')}</Text>
                            <Text style={s.subrecordText}>{tolalNutrVal === 0 ? '0' : Math.round((nutrients?.carbG ?? 0) / tolalNutrVal * 100)}%</Text>
                        </View>
                        <View style={[s.recordWrap, {gap: 8}]}>
                            <View style={[s.chartLegendColor, {backgroundColor: '#FF5555'}]}/>
                            <Text style={[s.recordText, {flex: 1}]}>{t('Protein')}</Text>
                            <Text style={s.subrecordText}>{tolalNutrVal === 0 ? '0' : Math.round((nutrients?.proteinG ?? 0) / tolalNutrVal * 100)}%</Text>
                        </View>
                        <View style={[s.recordWrap, {gap: 8}]}>
                            <View style={[s.chartLegendColor, {backgroundColor: '#20BFF7'}]}/>
                            <Text style={[s.recordText, {flex: 1}]}>{t('Fat')}</Text>
                            <Text style={s.subrecordText}>{tolalNutrVal === 0 ? '0' : Math.round((nutrients?.fatTotalG ?? 0) / tolalNutrVal * 100)}%</Text>
                        </View>
                    </View>
                </View>
            </View>

            { nutrients && Object.entries(nutrients)
                .filter(([key, value]) => !commonNutrients.includes(key) && key !== 'ndbNumber' && value !== 0)
                .length !== 0 ? (
            <View>
                <Text type='caption' style={{ marginVertical: 16 }}>{t('Vitamins & Minerals')}</Text>
                <View style={[theme.section ]}>
                    {Object.entries(nutrients)
                        .filter(([key, value]) => !commonNutrients.includes(key) && key !== 'ndbNumber' && value !== 0)
                        .map(([key, value], index, arr) => (
                            <View key={key} style={{gap: 6, marginBottom: 6}}>
                                <View style={s.recordWrap}>
                                    <Text style={s.recordText}>{t(nutrientMap[key as keyof INutritional].title)}</Text>
                                    <Text style={s.recordText}>{Number(value).toFixed(2)}{t(nutrientMap[key as keyof INutritional].unit)}</Text>
                                </View>
                                {arr.length - 1 !== index && (<View style={s.line} />)}
                            </View> )
                        )}
                </View>
            </View> ) : null }
        </View>
    )
}

const s = StyleSheet.create({
    wrapper: {
        marginVertical: 20,
    },
    freeWrapper: {
        borderRadius: 14,
        position: 'relative',
    },
    freeImg: {
        width: '100%',
        minHeight: 210,
    },
    freeOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: 210,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 27,
    },
    freeImgWrapper: {
        width: 47,
        height: 47,
        borderRadius: 100,
        backgroundColor: '#ffffff4d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    freeOverlayImg: {
        width: 18,
        height: 18,
    },
    freeOverlayText: {
        fontSize: 12,
        lineHeight: 15.5,
        marginTop: 6,
        color: Colors.white,
        textAlign: 'center',
    },
    chevronImg: {
        width: 18,
        height: 18,
    },
    portionsWrap: {

    },
    portionsText: {
        color: Colors.mainColor,
    },
    macrosBtns: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recordWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recordText: {
        fontSize: 14,
        lineHeight: 17,
        fontWeight: 'bold',
        fontFamily: 'DMSans-Bold',
    },
    line: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.lightGrey,
        marginVertical: 6,
    },
    subrecordWrap: {
        marginLeft: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subrecordText: {
        fontSize: 14,
        lineHeight: 17,
        fontWeight: 'medium',
        fontFamily: 'DMSans-Medium',
    },
    chartWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    chartLegendWrap: {
        gap: 20,
        alignContent: 'center',
    },
    chartLegendColor: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
})
import { useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { DonutChart } from "react-native-circular-chart"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'

import { Button, Text, View } from "@/components/base/BaseComponents"
import { useAuth } from '@/contexts/authContext'
import INutritional, { nutrientMap } from '@/interfaces/Nutritional'
import IIngredinent from '@/interfaces/Ingredient'
import { getBgColor, isLight, paddings, theme } from '@/constants/Theme'
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
                        <Text type='caption' style={{ color: Colors.white }}>{t('Subscribe to Premium!')}</Text>
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
        <View style={s.nutritionalSection}>
            <Text style={s.sectionTitle}>{t('Nutritional Values')}</Text>
            
            {/* Calories Card */}
            <View style={s.nutritionalCard}>
                <View style={s.nutritionalItem}>
                    <Text style={s.nutritionalLabel}>{t('Calories')}</Text>
                    <Text style={s.nutritionalValue}>{Number(nutrients?.calories).toFixed(0) || '0'}</Text>
                </View>
            </View>
            
            {/* Total Fat Card */}
            <View style={s.nutritionalCard}>
                <View style={s.nutritionalItem}>
                    <Text style={s.nutritionalLabel}>{t('Total Fat')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { isAdjustingMacros && <Text style={s.factorText}>{fatsFactor}x</Text>}
                        { isAdjustingMacros && fatsFactor > 0.5 ?
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('fats', 'down')}>
                            <Image source={leftChevron} style={s.chevronImg}/>
                        </Pressable> : <Text style={s.spacer}> </Text> }
                        <Text style={s.nutritionalValue}>{nutrients?.fatTotalG || '0'} g</Text>
                        { isAdjustingMacros && fatsFactor < 2 &&
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('fats', 'up')}>
                            <Image source={rightChevron} style={s.chevronImg}/>
                        </Pressable> }
                    </View>
                </View>
                <View style={s.nutritionalSubItem}>
                    <Text style={s.nutritionalSubLabel}>{t('Saturated fats')}</Text>
                    <Text style={s.nutritionalSubValue}>{nutrients?.fatSaturatedG || '0'} g</Text>
                </View>
                <View style={s.nutritionalSubItem}>
                    <Text style={s.nutritionalSubLabel}>{t('Monounsaturated fats')}</Text>
                    <Text style={s.nutritionalSubValue}>{nutrients?.fatMonoG ?? '0'} g</Text>
                </View>
                <View style={s.nutritionalSubItem}>
                    <Text style={s.nutritionalSubLabel}>{t('Polyunsaturated fats')}</Text>
                    <Text style={s.nutritionalSubValue}>{nutrients?.fatPolyG ?? '0'} g</Text>
                </View>
            </View>
            
            {/* Carbohydrates Card */}
            <View style={s.nutritionalCard}>
                <View style={s.nutritionalItem}>
                    <Text style={s.nutritionalLabel}>{t('Carbohydrates')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { isAdjustingMacros && <Text style={s.factorText}>{carbsFactor}x</Text>}
                        { isAdjustingMacros && carbsFactor > 0.5 ?
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('carbs', 'down')}>
                            <Image source={leftChevron} style={s.chevronImg}/>
                        </Pressable> : <Text style={s.spacer}> </Text> }
                        <Text style={s.nutritionalValue}>{nutrients?.carbG ?? '0'} g</Text>
                        { isAdjustingMacros && carbsFactor < 2 &&
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('carbs', 'up')}>
                            <Image source={rightChevron} style={s.chevronImg}/>
                        </Pressable> }
                    </View>
                </View>
                <View style={s.nutritionalSubItem}>
                    <Text style={s.nutritionalSubLabel}>{t('Sugar')}</Text>
                    <Text style={s.nutritionalSubValue}>{nutrients?.sugarTotalG ?? '0'} g</Text>
                </View>
                <View style={s.nutritionalSubItem}>
                    <Text style={s.nutritionalSubLabel}>{t('Fiber')}</Text>
                    <Text style={s.nutritionalSubValue}>{nutrients?.fiberG ?? '0'} g</Text>
                </View>
            </View>
            
            {/* Protein Card */}
            <View style={s.nutritionalCard}>
                <View style={s.nutritionalItem}>
                    <Text style={s.nutritionalLabel}>{t('Protein')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        { isAdjustingMacros && <Text style={s.factorText}>{proteinFactor}x</Text>}
                        { isAdjustingMacros && proteinFactor > 0.5 ?
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('protein', 'down')}>
                            <Image source={leftChevron} style={s.chevronImg}/>
                        </Pressable> : <Text style={s.spacer}> </Text> }
                        <Text style={s.nutritionalValue}>{nutrients?.proteinG ?? '0'} g</Text>
                        { isAdjustingMacros && proteinFactor < 3 &&
                        <Pressable disabled={isSentReq} onPress={() => changeMacros('protein', 'up')}>
                            <Image source={rightChevron} style={s.chevronImg}/>
                        </Pressable> }
                    </View>
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
                style={{ marginBottom: 8 }}
                onPress={() => setAdjustingMacros(true)}
            />
            : <View style={s.macrosBtns}>
                <Button
                    text={t('Save')}
                    isWide={false}
                    style={{ width: (windowWidth - paddings * 2) / 2 }}
                    onPress={saveLocal}
                />
                <Button
                    text={t('Reset')}
                    isWide={false}
                    style={{ width: (windowWidth - paddings * 2) / 2 }}
                    onPress={resetMacros}
                />
            </View> )}

            {/* Donut chart */}
            <View style={s.chartWrapper}>
                {tolalNutrVal !== 0 ? <DonutChart
                    type="butt"
                    data={[
                        {name: t('Carbs'), value: nutrients?.carbG ?? 0, color: '#8E59FF'},
                        {name: t('Protein'), value: nutrients?.proteinG ?? 0, color: '#FF5555'},
                        {name: t('Fat'), value: nutrients?.fatTotalG ?? 0, color: '#20BFF7'}
                    ]}
                    radius={50}
                    startAngle={0}
                    endAngle={360}
                    strokeWidth={20}
                    containerWidth={124}
                    containerHeight={124}
                    animationType="slide"
                    labelTitleStyle={{ display: 'none' }}
                    labelValueStyle={{ display: 'none' }}
                    containerStyle={{ paddingRight: 20 }}
                /> : null }
                <View style={[s.chartLegendWrap, {width: (windowWidth - paddings * 2) / 1.75}]}>
                    <View style={[s.recordWrap, {gap: 8}]}>
                        <Image source={require('@/assets/icons/carbohidrato.png')} style={s.chartLegendIcon}/>
                        <Text style={[s.nutritionalSubValue, {flex: 1}]}>{t('Carbs')}</Text>
                        <Text style={s.nutritionalSubLabel}>{tolalNutrVal === 0 ? '0' : Math.round((nutrients?.carbG ?? 0) / tolalNutrVal * 100)}%</Text>
                    </View>
                    <View style={[s.recordWrap, {gap: 8}]}>
                        <Image source={require('@/assets/icons/proteinas.png')} style={s.chartLegendIcon}/>
                        <Text style={[s.nutritionalSubValue, {flex: 1}]}>{t('Protein')}</Text>
                        <Text style={s.nutritionalSubLabel}>{tolalNutrVal === 0 ? '0' : Math.round((nutrients?.proteinG ?? 0) / tolalNutrVal * 100)}%</Text>
                    </View>
                    <View style={[s.recordWrap, {gap: 8}]}>
                        <Image source={require('@/assets/icons/trans-fats-free.png')} style={s.chartLegendIcon}/>
                        <Text style={[s.nutritionalSubValue, {flex: 1}]}>{t('Fat')}</Text>
                        <Text style={s.nutritionalSubLabel}>{tolalNutrVal === 0 ? '0' : Math.round((nutrients?.fatTotalG ?? 0) / tolalNutrVal * 100)}%</Text>
                    </View>
                </View>
            </View>

            {/* Vitamins & Minerals */}
            { nutrients && Object.entries(nutrients)
                .filter(([key, value]) => !commonNutrients.includes(key) && key !== 'ndbNumber' && value !== 0)
                .length !== 0 ? (
            <View style={s.vitaminsSection}>
                <Text style={s.sectionTitle}>{t('Vitamins & Minerals')}</Text>
                {Object.entries(nutrients)
                    .filter(([key, value]) => !commonNutrients.includes(key) && key !== 'ndbNumber' && value !== 0)
                    .map(([key, value]) => (
                        <View key={key} style={s.vitaminCard}>
                            <View style={s.vitaminItem}>
                                <Text style={s.vitaminLabel}>{t(nutrientMap[key as keyof INutritional].title)}</Text>
                                <Text style={s.vitaminValue}>{Number(value).toFixed(0)}{t(nutrientMap[key as keyof INutritional].unit)}</Text>
                                <Image source={require('@/assets/icons/chevron-right-neutral-grey.png')} style={s.vitaminArrow} />
                            </View>
                        </View>
                    ))}
            </View> ) : null }
        </View>
    )
}

const s = StyleSheet.create({
    wrapper: {
        marginVertical: 20,
        backgroundColor: getBgColor(),
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: getBgColor(),
        marginBottom: 8,
    },
    factorText: {
        fontSize: 14,
        color: Colors.mainColor,
        fontWeight: '500',
        marginRight: 8,
    },
    spacer: {
        width: 18,
    },
    
    // Nutritional Section Styles
    nutritionalSection: {
        marginVertical: 20,
        paddingHorizontal: 0,
        marginBottom: 32,
        backgroundColor: getBgColor(),
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
        marginBottom: 16,
    },
    nutritionalCard: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
        backgroundColor: '#ffffff',
        marginBottom: 5,
        paddingHorizontal: 12,
        paddingVertical: 15,
        justifyContent: 'center',
    },
    nutritionalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nutritionalLabel: {
        fontFamily: 'Poppins',
        fontSize: 16,
        lineHeight: 22,
        color: '#1B1A1D',
    },
    nutritionalValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'right',
        color: '#1B1A1D',
    },
    nutritionalSubItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 13,
    },
    nutritionalSubLabel: {
        fontFamily: 'Poppins',
        fontSize: 16,
        lineHeight: 22,
        color: Colors.grey,
    },
    nutritionalSubValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        lineHeight: 22,
        color: Colors.grey,
    },
    
    // Vitamins Section Styles
    vitaminsSection: {
        backgroundColor: getBgColor(),
    },
    vitaminCard: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
        backgroundColor: '#ffffff',
        marginBottom: 5,
        paddingHorizontal: 12,
        paddingVertical: 15,
        justifyContent: 'center',
    },
    vitaminItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    vitaminLabel: {
        fontSize: 16,
        color: Colors.black,
        fontWeight: '500',
        flex: 1,
    },
    vitaminValue: {
        fontSize: 16,
        color: Colors.black,
        fontWeight: 'bold',
        marginRight: 8,
    },
    vitaminArrow: {
        width: 12,
        height: 19,
        tintColor: Colors.mainColor,
    },
    
    // Donut Chart Styles
    chartWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EDF1F3',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        paddingVertical: 16,
        marginBottom: 17,
    },
    chartLegendWrap: {
        gap: 13,
        alignContent: 'center',
    },
    chartLegendIcon: {
        width: 16,
        height: 16,
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
    subrecordText: {
        fontSize: 14,
        lineHeight: 17,
        fontWeight: 'medium',
        fontFamily: 'DMSans-Medium',
    },
})
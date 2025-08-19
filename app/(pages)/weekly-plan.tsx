import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import Modal from 'react-native-modal'
import DatePicker from 'react-native-date-picker'
import { useTranslation } from 'react-i18next'

import { Button, ModalTitle, ScrollView, Text, View } from "@/components/base/BaseComponents"

import { isLight, theme, getBgColor } from '@/constants/Theme'
import { Colors, weeklyColors } from '@/constants/Colors'
import { useAuth } from '@/contexts/authContext'
import { post } from '@/services/apiRequests'
import { dateToDisplay, timeFromMinutes } from '@/services/datetime'
import { logError } from '@/services/utils'
import IPlanMeal from '@/interfaces/WeeklyPlan'

interface IRecipeCard {
    meal: IPlanMeal
    displayOptions: () => void
}

function RecipeCard({ meal, displayOptions }: IRecipeCard) {
    const router = useRouter()
    const { t } = useTranslation()

    return (
        <View style={[theme.section, s.recipeCard]}>
            <Pressable onPress={() => router.push({ pathname: `/(pages)/recipe/${meal.recipe.id}` as '(pages)/recipe/[:id]' })}>
                <Image source={{ uri: meal.recipe.medias[0].urlThumb ?? meal.recipe.medias[0].url }} style={s.cardImg} />
            </Pressable>
            <View style={{ flex: 1 }}>
                {/* Title and options */}
                <View style={s.cardTitleWrapper}>
                    <Pressable onPress={() => router.push({ pathname: `/(pages)/recipe/${meal.recipe.id}` as '(pages)/recipe/[:id]' })}>
                        <Text>{meal.recipe.title}</Text>
                    </Pressable>
                    <Pressable style={s.dotsWrapper} onPress={displayOptions}>
                        <Image source={require('@/assets/icons/three-dots.png')} style={s.cardThreeDots}/>
                    </Pressable>
                </View>

                {/* Badge */}
                <View style={[s.cardTypeWrapper, { backgroundColor: meal.mealType ? weeklyColors[meal.mealType] + '10' : weeklyColors.breakfast}]}>
                    <Text style={{
                        textTransform: 'capitalize',
                        color: meal.mealType ? weeklyColors[meal.mealType] : weeklyColors.breakfast,
                    }}>
                        {meal.mealType}
                    </Text>
                </View>

                {/* Details */}
                <View style={s.cardDetailsWrapper}>
                    {meal.recipe.avgRating && (
                        <View style={s.detailItem}>
                            <Image source={require('@/assets/icons/star.png')} style={s.detailIcon}/>
                            <Text>{meal.recipe.avgRating}</Text>
                        </View>
                    )}
                    {meal.recipe.timeCooking && (
                        <View style={s.detailItem}>
                            <Image source={require('@/assets/icons/clock.png')} style={s.detailIcon}/>
                            <Text>{timeFromMinutes(meal.recipe.timeCooking)}</Text>
                        </View>
                    )}
                    {/* {recipe.calories && ( */}
                        <View style={s.detailItem}>
                            <Image source={require('@/assets/icons/fire-akar.png')} style={s.detailIcon}/>
                            <Text>{meal.recipe.calories ?? 0} {t('cal')}</Text>
                        </View>
                    {/* )} */}
                </View>
            </View>
        </View>
    )
}

interface IWeekDay {
    date: Date
    dayName: string
    dayNumber: number
    isCurrent: boolean
}

const leftChevronLight = require('@/assets/icons/chevron-left-grey.png')
const leftChevronDark = require('@/assets/icons/chevron-left-light-grey.png')
const rightChevronLight = require('@/assets/icons/chevron-right-grey.png')
const rightChevronDark = require('@/assets/icons/chevron-right-light-grey.png')
const leftChevron = isLight() ? leftChevronLight : leftChevronDark
const rightChevron = isLight() ? rightChevronLight : rightChevronDark

export default function WeeklyPlan() {
    const { user } = useAuth()
    const router = useRouter()
    const glob = useGlobalSearchParams()
    const { i18n, t } = useTranslation()

    const [window] = useState(Dimensions.get('window'))
    const [isModalVisible, setModalVisible] = useState(false)
    const [currentMeals, setCurrentMeals] = useState<IPlanMeal[]>([])
    const [selectedMeal, setSelectedMeal] = useState<IPlanMeal | null>(null)
    const [openDatePicker, setOpenDatePicker] = useState<boolean>(false)
    const [planDate, setPlanDate] = useState<Date>(new Date())
    const [planType, setPlanType] = useState<IPlanMeal['mealType']>()
    const [planError, setPlanError] = useState<string>('')
    const [showingWeek, setShowingWeek] = useState<IWeekDay[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [canGoBack, setCanGoBack] = useState<boolean>(false)
    const [canGoForward, setCanGoForward] = useState<boolean>(false)

    const [today] = useState<Date>(new Date())

    useEffect(() => {
        if (glob?.date) {
            const date = new Date(glob.date as string)
            generateWeek(date)
            setSelectedDate(date)
            return
        }
        generateWeek()
    }, [])

    // on change day
    useEffect(() => {
        if (selectedDate === undefined) {
            return
        }
        getRecipesForDate(selectedDate)

        const week = showingWeek.map(day => ({ ...day, isCurrent: false }))
        const day = week.find(day => day.date.toISOString().split('T')[0] === today.toISOString().split('T')[0])
        if (day) {
            day.isCurrent = true
        }
        setShowingWeek(week)
    }, [selectedDate])

    // sort recipes by type
    useEffect(() => {
        const typeOrder = Object.keys(weeklyColors).map(key => key as IPlanMeal['mealType'])
        const oldOrder = currentMeals.map(m => m.id)
        const updRecipes = currentMeals.sort((a, b) => typeOrder.indexOf(a.mealType) - typeOrder.indexOf(b.mealType))
        const newOrder = updRecipes.map(m => m.id)

        if (JSON.stringify(oldOrder) !== JSON.stringify(newOrder)) {
            setCurrentMeals(updRecipes)
        }
    }, [currentMeals])

    const generateWeek = useCallback((fromDate: Date = new Date()) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dayOfWeek = fromDate.getDay() // from 0 to 6
        const sunday = dayOfWeek === 0 ? fromDate : new Date(fromDate.getTime() - (1000 * 60 * 60 * 24) * dayOfWeek)
        const week: IWeekDay[] = []
        let updSelectedDate: Date = selectedDate ?? today

        for (let i = 0; i < 7; i++) {
            const day = new Date(sunday.getTime() + (1000 * 60 * 60 * 24) * i)
            week[i] = {
                date: day,
                dayName: days[i],
                dayNumber: day.getDate(),
                isCurrent: day.toISOString().split('T')[0] === today.toISOString().split('T')[0],
            }
            if (day.getDay() === updSelectedDate.getDay()) {
                updSelectedDate = day
            }
        }
        
        setShowingWeek(week)
        setSelectedDate(updSelectedDate)

        setCanGoBack(today.getTime() - sunday.getTime() < 1000 * 60 * 60 * 24 * 28 )
        setCanGoForward(sunday.getTime() - today.getTime() < 1000 * 60 * 60 * 24 * 28 )
    }, [])

    const getRecipesForDate = useCallback((date: Date) => {
        post({
            url: '/plan',
            data: { mealDateFrom: date.toISOString().split('T')[0], mealDateTo: date.toISOString().split('T')[0] },
            token: user?.token,
        }).then((meals: IPlanMeal[]) => {
            setCurrentMeals(meals)
            setPlanDate(date)
        }).catch(logError)
    }, [])

    const onHide = useCallback(() => {
        setModalVisible(false)
        setSelectedMeal(null)
    }, [])
    const displayOptions = useCallback((meal: IPlanMeal) => {
        setSelectedMeal(meal)
        setPlanType(meal.mealType)
        setModalVisible(true)
    }, [])

    const onEdit = useCallback(() => {
        if (!selectedMeal || (
            selectedMeal.mealDate === planDate.toISOString().split('T')[0] && selectedMeal.mealType === planType
        )) {
            onHide()
            return
        }
        post({
            url: '/plan/edit',
            data: {
                action: 'edit',
                id: selectedMeal?.id,
                mealType: planType,
                mealDate: planDate.toISOString().split('T')[0]
            },
            token: user?.token
        }).then((mealsForDay: IPlanMeal[]) => {
            setCurrentMeals(mealsForDay)
            onHide()
        }).catch(logError)
    }, [selectedMeal, planDate, planType])

    const onRemove = useCallback(() => {
        if (!selectedMeal) {
            return
        }
        post({
            url: '/plan/edit',
            data: {action: 'delete', id: selectedMeal?.id},
            token: user?.token
        }).then((mealsForDay: IPlanMeal[]) => {
            setCurrentMeals(mealsForDay)
            onHide()
        }).catch(logError)
    }, [selectedMeal])

    return (
        <View style={theme.container}>
            {selectedMeal && <Modal
                isVisible={isModalVisible}
                style={[theme.modal, s.modalView, {backgroundColor: getBgColor(), marginTop: window.height * 0.38}]}
                onModalHide={onHide}
                onBackdropPress={onHide}
            >
                <View style={s.modalContent}>
                    <Text type="subtitle" style={s.modalTitle}>{selectedMeal.recipe.title}</Text>

                    <Text style={{textAlign: 'center',}}>{t('Plan date')}</Text>
                    <Button
                        text={dateToDisplay(planDate, i18n.language)}
                        onPress={() => setOpenDatePicker(true)}
                        style={{ marginBottom: 16}}
                    />
                    <DatePicker
                        modal
                        date={planDate}
                        open={openDatePicker}
                        mode='date'
                        minimumDate={new Date()}
                        maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                        onConfirm={(date: Date) => {
                            setPlanError('')
                            setPlanDate(date)
                            setOpenDatePicker(false)
                        }}
                        onCancel={() => setOpenDatePicker(false)}
                    />

                    <Text type="caption">{t('Select type of meal')}</Text>
                    {Object.keys(weeklyColors).map((key, index) => (
                        <Button
                            key={index}
                            text={key}
                            onPress={() => {
                                setPlanError('')
                                setPlanType(key as IPlanMeal['mealType'])
                            }}
                            style={{
                                backgroundColor: weeklyColors[key as keyof typeof weeklyColors] + (planType === key ? 'cc' : '30'),
                            }}
                            textStyle={{
                                color: planType == key ? Colors.black : weeklyColors[key as keyof typeof weeklyColors],
                                textTransform: 'capitalize',
                            }}
                        />
                    ))}

                    {planError !== '' ? <Text type="error">{planError}</Text> : null}
                    
                    <View style={s.modalButtons}>
                        <Pressable>
                            <Text type="link" onPress={onHide}>{t('Cancel')}</Text>
                        </Pressable>
                        <Button
                            text={t('Remove')}
                            onPress={onRemove}
                            isWide={false}
                            style={s.removeButton}
                        />
                        <Button
                            text={t('Save')}
                            disabled={!planDate || !planType}
                            onPress={onEdit}
                            isWide={false}
                            style={{ paddingHorizontal: 30 }}
                        />
                    </View>

                </View>
            </Modal> }

            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <ModalTitle title={t('Weekly plan')} onHide={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/my-space')} />
                {/* Week */}
                <View style={s.weekWrapper}>
                    <Pressable
                        style={s.chevronWrapper}
                        disabled={!canGoBack}
                        onPress={() => generateWeek(new Date(showingWeek[0].date.getTime() - (1000 * 60 * 60 * 24 * 7)))}
                    >
                        <Image source={leftChevron} style={s.chevron}/>
                    </Pressable>
                    {showingWeek.map((day, index) => (
                        <Pressable
                            key={index}
                            onPress={() => setSelectedDate(day.date)}
                            style={[
                                s.weekDay,
                                day.isCurrent && s.currentDay,
                                (index === selectedDate!.getDay() && !day.isCurrent && s.selectedDay)
                            ]}
                        >
                            <Text style={day.isCurrent || index === selectedDate!.getDay() ? s.currentDayName : s.dayName }>{day.dayName}</Text>
                            <Text style={day.isCurrent || index === selectedDate!.getDay() ? s.currentDayNumber : s.dayNumber }>{day.dayNumber}</Text>
                        </Pressable>
                    ))}
                    <Pressable
                        style={s.chevronWrapper}
                        disabled={!canGoForward}
                        onPress={() => generateWeek(new Date(showingWeek[0].date.getTime() + (1000 * 60 * 60 * 24 * 7)))}
                    >
                        <Image source={rightChevron} style={s.chevron}/>
                    </Pressable>
                </View>

                <ScrollView style={s.recipesContainer}>
                    {currentMeals.map((meal, index) => (
                        <RecipeCard key={index} meal={meal} displayOptions={() => displayOptions(meal)} />
                    ))}
                </ScrollView>

                {/* Buttons */}
                <View style={[s.buttons, { width: window.width - 20}]}>
                    <Button style={{ flex: 1 }} size='large' text={t('Add meal')} onPress={() => router.navigate('/(tabs)/explore')} />
                </View>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    modalView: {
        justifyContent: 'flex-start',
        paddingTop: 16,
    },
    modalContent: {
        gap: 14,
    },
    modalTitle: {
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 32,
    },
    removeButton: {
        paddingHorizontal: 20,
        backgroundColor: Colors.danger,
        borderColor: 'red',
        borderWidth: 1,
    },
    weekWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 8,
        // gap: 10,
        marginTop: 6,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    chevronWrapper: {
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    chevron: {
        width: 6,
        height: 10,
    },
    weekDay: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 9,
    },
    dayName: {
        color: Colors.neutralGrey,
    },
    dayNumber: {
        fontWeight: '600',
        fontFamily: 'DMSans-SemiBold',
    },
    currentDay: {
        backgroundColor: Colors.mainColor,
        borderRadius: 40,
    },
    selectedDay: {
        backgroundColor: Colors.grey,
        borderRadius: 40,
    },
    currentDayName: {
        color: Colors.white
    },
    currentDayNumber: {
        color: Colors.white,
        fontWeight: '600',
        fontFamily: 'DMSans-SemiBold',
    },
    recipesContainer: {
        gap: 12,
        maxHeight: '65%',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        marginEnd: 10,
        flexWrap: 'wrap',
    },
    recipeCard: {
        borderRadius: 14,
        paddingHorizontal: 15,
        paddingVertical: 18,
        marginBottom: 12,
        flexDirection: 'row',
        gap: 16,
        position: 'relative',
    },
    cardImg: {
        width: 105,
        height: 98,
        borderRadius: 14,
    },
    cardTitleWrapper: {
        position: 'relative',
        flex: 1,
        paddingRight: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dotsWrapper: {
        position: 'absolute',
        right: -5,
        top: -5,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    cardThreeDots: {
        width: 12,
        height: 2,
    },
    cardTypeWrapper: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 8, 
        marginBottom: 14,
    },
    cardDetailsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 17,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    detailIcon: {
        width: 14,
        height: 14,
    },
})
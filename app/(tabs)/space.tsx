import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'

import { Button, ChoiceItem, ScrollView, Text, View } from "@/components/base/BaseComponents"
import Header from '@/components/Header'
import ImageLibrary from '@/components/ImageLibrary'
import AddIngredientModal from '@/components/modals/AddIngredientModal'
import RecipeCard, { IRecipeCard } from '@/components/RecipeCard'
import WeeklyFeedItem, { IWeeklyFeed } from '@/components/WeeklyFeedItem'
import Folders from '@/components/modals/Folders'
import { useAuth } from '@/contexts/authContext'
import { get, post } from '@/services/apiRequests'
import { 
    fetchShoppingListByRecipes, 
    addIngredientsFromRecipe, 
    addIngredientManually, 
    markIngredientAsChecked, 
    markIngredientAsUnchecked, 
    deleteAllCheckedIngredients,
    fetchWeeklyPlan,
    editWeeklyPlan
} from '@/services/fetches'
import { theme, isLight, getBgColor, getCardBackground, getTextColor, getSecondaryTextColor, getBorderColor, getShadowColor } from '@/constants/Theme'
import { Colors } from '@/constants/Colors'
import { useTheme } from '@/contexts/themeContext'
import { MediaType } from '@/interfaces/Media'
import { IShoppingListItemByRecipe } from '@/interfaces/ShoppingList'
import IIngredinent, { IIngredientForShoppingList } from '@/interfaces/Ingredient'
import IRecipe from '@/interfaces/Recipe'
import IPlanMeal from '@/interfaces/WeeklyPlan'
import { logError } from '@/services/utils'

interface IInterest {
    id?: number
    title: string
    checked: boolean
}

export default function MySpaceScreen() {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()
    const { isDark } = useTheme()
    
    const s = createStyles(isDark)

    const [isSentReq, setSentReq] = useState<boolean>(false)
    const [showFolders, setShowFolders] = useState(false)
    const [showAddIngredient, setShowAddIngredient] = useState(false)
    const [weeklyPlan, setWeeklyPlan] = useState<IWeeklyFeed[]>([])
    const [shoppingList, setShoppingList] = useState<IShoppingListItemByRecipe[]>([])
    const [activeTab, setActiveTab] = useState<'shopping' | 'weekly'>('shopping')
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() + 1) // Current day (1-7)
    const [showCalendar, setShowCalendar] = useState<boolean>(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Generate current week dates
    const getCurrentWeek = () => {
        const today = new Date()
        const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - currentDay) // Start from Sunday
        
        const weekDays = []
        const dayNames = [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')]
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek)
            date.setDate(startOfWeek.getDate() + i)
            
            weekDays.push({
                id: i + 1,
                day: dayNames[i],
                date: date.getDate().toString(),
                selected: i === currentDay,
                fullDate: date
            })
        }
        
        return weekDays
    }

    const weeklyDays = getCurrentWeek()

    // Generate calendar data for current month
    const getCalendarData = () => {
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startDay = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
        
        // Get previous month's last days
        const prevMonth = new Date(currentYear, currentMonth, 0)
        const daysInPrevMonth = prevMonth.getDate()
        
        const calendarDays = []
        
        // Add previous month's trailing days (only for the first week)
        for (let i = startDay - 1; i >= 0; i--) {
            calendarDays.push({
                date: daysInPrevMonth - i,
                isCurrentMonth: false,
                isToday: false,
                fullDate: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i)
            })
        }
        
        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const fullDate = new Date(currentYear, currentMonth, day)
            const isToday = fullDate.toDateString() === today.toDateString()
            
            calendarDays.push({
                date: day,
                isCurrentMonth: true,
                isToday: isToday,
                fullDate: fullDate
            })
        }
        
        // Calculate how many days we need to complete the last week
        const totalDaysSoFar = calendarDays.length
        const daysInLastWeek = totalDaysSoFar % 7
        const daysNeededToCompleteLastWeek = daysInLastWeek === 0 ? 0 : 7 - daysInLastWeek
        
        // Add next month's leading days (only to complete the last week)
        for (let day = 1; day <= daysNeededToCompleteLastWeek; day++) {
            calendarDays.push({
                date: day,
                isCurrentMonth: false,
                isToday: false,
                fullDate: new Date(currentYear, currentMonth + 1, day)
            })
        }
        
        return calendarDays
    }

    const fetchWeeklyPlanData = useCallback(async () => {
        try {
            const today = new Date()
            const startOfWeek = new Date(today)
            startOfWeek.setDate(today.getDate() - today.getDay()) // Start from Sunday
            
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 13) // 2 weeks ahead
            
            const mealDateFrom = startOfWeek.toISOString().split('T')[0]
            const mealDateTo = endOfWeek.toISOString().split('T')[0]

            const plan = await fetchWeeklyPlan(mealDateFrom, mealDateTo, user?.token)

            const weeklyRecipes: IWeeklyFeed[] = plan.map(item => {
                const img = item.recipe.medias.find((media: any) => media.type == MediaType.IMAGE)
                return {
                    id: item.id,
                    title: item.recipe.title,
                    image: img?.url || '',
                    type: item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1),
                    rating: item.recipe.avgRating,
                    time: item.recipe.timeCooking,
                    mealDate: item.mealDate,
                    mealType: item.mealType,
                    recipe: item.recipe
                }
            })

            setWeeklyPlan(weeklyRecipes)
        } catch (error) {
            logError(error)
        }
    }, [user?.token])

    useFocusEffect(
        useCallback(() => {
            fetchWeeklyPlanData()
            fetchShoppingListByRecipes(setShoppingList, user?.token)
        }, [fetchWeeklyPlanData])
    )

    const toggleSelectedIngredientByRecipe = useCallback((ingredient: IIngredientForShoppingList) => {
        setSentReq(true)
        
        // Update local state immediately for better UX
        setCheckedItems(prev => {
            const newSet = new Set(prev)
            if (ingredient.isChecked) {
                newSet.delete(ingredient.id)
            } else {
                newSet.add(ingredient.id)
            }
            return newSet
        })
        
        const apiCall = ingredient.isChecked 
            ? markIngredientAsUnchecked(ingredient.id, user?.token || '')
            : markIngredientAsChecked(ingredient.id, user?.token || '')
        
        apiCall
            .then((updatedIngredient: IIngredientForShoppingList) => {
                setShoppingList(prev => prev.map(recipe => {
                    return {
                        ...recipe,
                        ingredients: recipe.ingredients.map(i => i.id === updatedIngredient.id ? updatedIngredient : i)
                    }
                }))
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [user?.token])

    const onAddIngredient = useCallback((ingredient: IIngredinent) => {
        setSentReq(true)
        addIngredientManually(
            ingredient.id,
            ingredient.measureId || 1,
            ingredient.cnt || 1,
            user?.token || ''
        )
            .then(newShoppingList => {
                setShoppingList(newShoppingList)
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [user?.token])

    // Add ingredients from recipe
    const addIngredientsFromRecipeToShoppingList = useCallback((recipeIds: number[], portions: number = 1) => {
        setSentReq(true)
        addIngredientsFromRecipe(recipeIds, portions, user?.token || '')
            .then(newShoppingList => {
                setShoppingList(newShoppingList)
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [user?.token])

    // Delete all checked ingredients
    const deleteAllChecked = useCallback(() => {
        setSentReq(true)
        deleteAllCheckedIngredients(user?.token || '')
            .then(newShoppingList => {
                setShoppingList(newShoppingList)
                setCheckedItems(new Set()) // Clear checked items
            })
            .catch(logError)
            .finally(() => setSentReq(false))
    }, [user?.token])

    // Add meal to weekly plan
    const addMealToWeeklyPlan = useCallback(async (mealDate: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', recipeId: number) => {
        setSentReq(true)
        try {
            await editWeeklyPlan([{
                action: 'add',
                mealDate,
                mealType,
                recipeId
            }], user?.token || '')
            
            // Refresh weekly plan data
            await fetchWeeklyPlanData()
        } catch (error) {
            logError(error)
        } finally {
            setSentReq(false)
        }
    }, [user?.token, fetchWeeklyPlanData])

    // Edit meal in weekly plan
    const editMealInWeeklyPlan = useCallback(async (id: number, mealDate: string, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
        setSentReq(true)
        try {
            await editWeeklyPlan([{
                action: 'edit',
                id,
                mealDate,
                mealType
            }], user?.token || '')
            
            // Refresh weekly plan data
            await fetchWeeklyPlanData()
        } catch (error) {
            logError(error)
        } finally {
            setSentReq(false)
        }
    }, [user?.token, fetchWeeklyPlanData])

    // Delete meal from weekly plan
    const deleteMealFromWeeklyPlan = useCallback(async (id: number) => {
        setSentReq(true)
        try {
            await editWeeklyPlan([{
                action: 'delete',
                id
            }], user?.token || '')
            
            // Refresh weekly plan data
            await fetchWeeklyPlanData()
        } catch (error) {
            logError(error)
        } finally {
            setSentReq(false)
        }
    }, [user?.token, fetchWeeklyPlanData])

    const renderShoppingList = () => {
        // If no shopping list data, show empty state
        if (shoppingList.length === 0) {
            return (
                 <ScrollView style={s.contentContainer}>
                     <View style={s.emptyState}>
                         <Text style={s.emptyStateText}>{t('Your shopping list is empty')}</Text>
                         <Text style={s.emptyStateSubtext}>{t('Add ingredients or plan meals to see your shopping list')}</Text>
                         <TouchableOpacity 
                             style={s.addIngredientButton}
                             onPress={() => {
                                 // This would open the AddIngredientModal
                                 // For now, we'll add a sample ingredient
                                 const sampleIngredient = {
                                     id: 999,
                                     ingredientId: 999,
                                     title: 'Sample Ingredient',
                                     measureId: 1,
                                     cnt: 1,
                                     category: { id: 1, title: 'Other', icon: 'other', thumb: '' },
                                     section: 'other'
                                 }
                                 onAddIngredient(sampleIngredient)
                             }}
                         >
                             <Ionicons name="add" size={20} color="white" />
                             <Text style={s.addIngredientText}>{t('Add Ingredient')}</Text>
                         </TouchableOpacity>
                     </View>
                 </ScrollView>
            )
        }

        // Group ingredients by category
        let categorizedItems: { [key: string]: IIngredientForShoppingList[] } = {}
        
        shoppingList.forEach(recipe => {
            recipe.ingredients.forEach(ingredient => {
                const category = ingredient.category.title || t('Other')
                if (!categorizedItems[category]) {
                    categorizedItems[category] = []
                }
                categorizedItems[category].push(ingredient)
            })
        })

        return (
            <ScrollView style={s.contentContainer}>
                {Object.entries(categorizedItems).map(([category, items]) => (
                    <View key={category} style={s.categorySection}>
                        <Text style={s.categoryTitle}>{category}</Text>
                        {items.map((item: IIngredientForShoppingList) => {
                            // Get appropriate emoji based on ingredient name or category
                            const getEmoji = (name: string, categoryTitle?: string) => {
                                const lowerName = (name || '').toLowerCase()
                                const lowerCategory = (categoryTitle || '').toLowerCase()
                                
                                // Category-based emojis
                                if (lowerCategory.includes('cheese')) return '🧀'
                                if (lowerCategory.includes('meat')) return '🥩'
                                if (lowerCategory.includes('vegetable')) return '🥬'
                                if (lowerCategory.includes('fruit')) return '🍎'
                                if (lowerCategory.includes('dairy')) return '🥛'
                                if (lowerCategory.includes('grain')) return '🌾'
                                
                                // Ingredient-based emojis
                                if (lowerName.includes('papaya')) return '🥭'
                                if (lowerName.includes('pineapple')) return '🍍'
                                if (lowerName.includes('rice')) return '🍚'
                                if (lowerName.includes('chickpea')) return '🫘'
                                if (lowerName.includes('chicken')) return '🍗'
                                if (lowerName.includes('cheese')) return '🧀'
                                if (lowerName.includes('goose')) return '🦆'
                                
                                return '🍎'
                            }

                            return (
                                <View key={item.id} style={s.shoppingItem}>
                                    <View style={s.shoppingItemLeft}>
                                        <View style={s.itemImageContainer}>
                                            <Text style={s.itemEmoji}>{getEmoji(item.ingredientTitle, item.category.title)}</Text>
                                        </View>
                                        <View style={s.itemTextContainer}>
                                            <Text style={s.itemName}>{item.ingredientTitle}</Text>
                                            <Text style={s.itemQuantity}>{item.cnt} {item.measureTitle}</Text>
                                        </View>
                                    </View>
                                    <View style={s.shoppingItemRight}>
                                        <TouchableOpacity style={s.arrowButton}>
                                            <Ionicons name="chevron-forward" size={20} color="#C28040" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[s.checkbox, checkedItems.has(item.id) && s.checkboxChecked]}
                                            onPress={() => !isSentReq && toggleSelectedIngredientByRecipe(item)}
                                        >
                                            {checkedItems.has(item.id) && <Ionicons name="checkmark" size={16} color="white" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                ))}
            </ScrollView>
        )
    }

    const handleDayPress = (item: any) => {
        setSelectedDay(item.id)
        console.log('Day selected:', item.day)
    }

    const renderDayItem = ({ item }: { item: any }) => (
        <Pressable 
            style={[s.dayItem, item.id === selectedDay && s.dayItemSelected]}
            onPress={() => handleDayPress(item)}
        >
            <Text style={[s.dayText, item.id === selectedDay && s.dayTextSelected]}>{item.day}</Text>
            <Text style={[s.dateText, item.id === selectedDay && s.dateTextSelected]}>{item.date}</Text>
        </Pressable>
    )

    const renderCalendarDayItem = ({ item, index }: { item: any, index: number }) => {
        const isSelected = selectedDate.toDateString() === item.fullDate.toDateString()
        const dayNames = [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')]
        const dayName = dayNames[item.fullDate.getDay()]
        
        // Check if this day is in the current week
        const today = new Date()
        const currentWeekStart = new Date(today)
        currentWeekStart.setDate(today.getDate() - today.getDay()) // Start from Sunday
        currentWeekStart.setHours(0, 0, 0, 0) // Normalize time
        const currentWeekEnd = new Date(currentWeekStart)
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6) // End on Saturday
        currentWeekEnd.setHours(23, 59, 59, 999) // End of day
        
        // Normalize the item date for comparison
        const itemDate = new Date(item.fullDate)
        itemDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
        
        const isCurrentWeek = itemDate >= currentWeekStart && itemDate <= currentWeekEnd
        
        return (
            <TouchableOpacity
                style={[
                    s.calendarDayItem,
                    isSelected && s.calendarDayItemSelected,
                    !item.isCurrentMonth && s.calendarDayItemInactive
                ]}
                onPress={() => setSelectedDate(item.fullDate)}
            >
                {isCurrentWeek && (
                    <Text style={[
                        s.calendarDayText,
                        isSelected && s.calendarDayTextSelected
                    ]}>
                        {dayName}
                    </Text>
                )}
                <Text style={[
                    s.calendarDateText,
                    isSelected && s.calendarDateTextSelected,
                    !item.isCurrentMonth && s.calendarDateTextInactive
                ]}>
                    {item.date}
                </Text>
            </TouchableOpacity>
        )
    }

    const renderWeeklyPlan = () => {
        return (
            <ScrollView style={s.contentContainer}>
                <View style={s.dateSection}>
                    <Text style={s.todayText}>{t('Today, {{date}}', { 
                        date: new Date().toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                        }) 
                    })}</Text>
                    <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)}>
                        <Text style={s.calendarLink}>
                            {showCalendar ? t('Hide calendar') : t('View calendar')}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {showCalendar ? (
                    <View style={s.calendarContainer}>
                        <FlatList
                            data={getCalendarData()}
                            renderItem={renderCalendarDayItem}
                            keyExtractor={(item, index) => `${item.date}-${index}`}
                            numColumns={7}
                            scrollEnabled={false}
                            contentContainerStyle={s.calendarDaysGrid}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={weeklyDays}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderDayItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={s.daysList}
                    />
                )}

                <View style={s.recipesHeader}>
                    <Text style={s.recipesTitle}>
                        {showCalendar 
                            ? t('Recipes for {{date}}', { 
                                date: selectedDate.toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric' 
                                }) 
                            })
                            : t('Recipes for today')
                        }
                    </Text>
                </View>
                
                {weeklyPlan.length > 0 ? (
                    weeklyPlan
                        .filter(meal => {
                            if (!meal.mealDate) return false
                            const mealDate = new Date(meal.mealDate)
                            const targetDate = showCalendar ? selectedDate : new Date()
                            return mealDate.toDateString() === targetDate.toDateString()
                        })
                        .map((meal, index) => (
                        <View key={meal.id} style={s.recipeCard}>
                            <View style={s.recipeImageContainer}>
                                {meal.image ? (
                                    <Image source={{ uri: meal.image }} style={s.recipeImage} />
                                ) : (
                                    <Text style={s.recipeEmoji}>🍽️</Text>
                                )}
                                <View style={s.playButton}>
                                    <Ionicons name="play" size={16} color="white" />
                                </View>
                            </View>
                            <View style={s.recipeInfo}>
                                <Text style={s.recipeType}>{meal.type}</Text>
                                <Text style={s.recipeName}>{meal.title}</Text>
                                <Text style={s.recipeDetails}>
                                    {meal.recipe?.portions || 1} {t('portions')} | {t('Time')}: {meal.time}min
                                </Text>
                            </View>
                             <View style={s.recipeActions}>
                                 <TouchableOpacity 
                                     style={s.recipeActionButton}
                                     onPress={() => {
                                         // Add ingredients from this recipe to shopping list
                                         if (meal.recipe?.id) {
                                             addIngredientsFromRecipeToShoppingList([meal.recipe.id], 1)
                                         }
                                     }}
                                 >
                                     <Ionicons name="cart" size={16} color="#8B4513" />
                                 </TouchableOpacity>
                                 <TouchableOpacity 
                                     style={s.recipeActionButton}
                                     onPress={() => deleteMealFromWeeklyPlan(meal.id)}
                                 >
                                     <Ionicons name="trash" size={16} color="#8B4513" />
                                 </TouchableOpacity>
                             </View>
                        </View>
                    ))
                ) : (
                    <View style={s.emptyMealsState}>
                        <Text style={s.emptyMealsText}>{t('No meals planned for today')}</Text>
                        <TouchableOpacity 
                            style={s.addMealButton}
                            onPress={() => {
                                // Get today's date in the correct format
                                const today = new Date()
                                const todayStr = today.toISOString().split('T')[0]
                                
                                // For now, we'll add a sample recipe. In a real app, this would open a recipe selection modal
                                const sampleRecipeId = 1 // This would come from a recipe selection
                                const sampleMealType = 'breakfast' as 'breakfast' | 'lunch' | 'snack' | 'dinner'
                                
                                addMealToWeeklyPlan(todayStr, sampleMealType, sampleRecipeId)
                            }}
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={s.addMealText}>{t('Add Meal')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        )
    }

    return (
        <View style={s.container}>
            { showFolders && <Folders
                isVisible={showFolders}
                onHide={() => setShowFolders(false)}
            /> }
            {showAddIngredient && <AddIngredientModal
                isVisible={showAddIngredient}
                hideAndClear={() => setShowAddIngredient(false)}
                onSubmit={onAddIngredient}
            /> }

            <View style={theme.statusBarHeight} />
            {/* Header */}
            <Header 
                title={t('My Space')}
                onBack={() => router.back()}
                rightIconSource={require('@/assets/icons/add.png')}
                onRightPress={() => setShowAddIngredient(true)}
            />

            {/* Tab Navigation */}
            <View style={s.pillTabsContainer}>
                <View style={s.pillTabs}>
                    <TouchableOpacity 
                        style={[s.pillTab, activeTab === 'shopping' ? s.pillTabActive : s.pillTabInactive]}
                        onPress={() => setActiveTab('shopping')}
                    >
                        <Text style={[s.pillTabText, activeTab === 'shopping' ? s.pillTabTextActive : s.pillTabTextInactive]}>
                            {t('Shopping List')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[s.pillTab, activeTab === 'weekly' ? s.pillTabActive : s.pillTabInactive]}
                        onPress={() => setActiveTab('weekly')}
                    >
                        <Text style={[s.pillTabText, activeTab === 'weekly' ? s.pillTabTextActive : s.pillTabTextInactive]}>
                            {t('Weekly Plan')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {activeTab === 'shopping' ? renderShoppingList() : renderWeeklyPlan()}

            {/* Footer Actions for Shopping List - Only show when items are checked */}
            {activeTab === 'shopping' && checkedItems.size > 0 && (
                <View style={s.footerActions}>
                    <TouchableOpacity 
                        style={s.footerButton}
                        onPress={() => {
                            // Mark all checked items as bought (checked)
                            const checkedIngredientIds = Array.from(checkedItems)
                            checkedIngredientIds.forEach(ingredientId => {
                                // Find the ingredient in shopping list and mark as checked
                                setShoppingList(prev => prev.map(recipe => ({
                                    ...recipe,
                                    ingredients: recipe.ingredients.map(ingredient => 
                                        ingredient.id === ingredientId 
                                            ? { ...ingredient, isChecked: true }
                                            : ingredient
                                    )
                                })))
                            })
                            // Clear checked items after marking as bought
                            setCheckedItems(new Set())
                        }}
                        disabled={isSentReq}
                    >
                        <Ionicons name="checkmark" size={20} color="white" />
                        <Text style={s.footerButtonText}>{t('Bought')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={s.footerButton}
                        onPress={deleteAllChecked}
                        disabled={isSentReq}
                    >
                        <Ionicons name="trash" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={s.footerButton}
                        onPress={() => {
                            // Get all checked ingredient IDs
                            const checkedIngredientIds = Array.from(checkedItems)
                            if (checkedIngredientIds.length > 0) {
                                // Add ingredients from checked items to shopping list
                                addIngredientsFromRecipeToShoppingList(checkedIngredientIds, 1)
                            }
                        }}
                        disabled={isSentReq}
                    >
                        <Ionicons name="paper-plane" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: getBgColor(),
    },
    headerContainer: {
        backgroundColor: '#4A3B30',
        paddingTop: 50,
    },
    pillTabsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: getBgColor(),
    },
    pillTabs: {
        flexDirection: 'row',
        backgroundColor: getCardBackground(),
        borderRadius: 30,
    },
    pillTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 30,
    },
    pillTabActive: {
        backgroundColor: Colors.mainColor,
    },
    pillTabInactive: {
        backgroundColor: 'transparent',
    },
    pillTabText: {
        fontFamily: 'Poppins',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0,
        textAlign: 'center',
    },
    pillTabTextActive: {
        color: Colors.white,
    },
    pillTabTextInactive: {
        color: isDark ? Colors.dark.pillText : Colors.light.pillText,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: getBgColor(),
    },
    categorySection: {
        marginBottom: 20,
        backgroundColor: getBgColor(),
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? Colors.dark.emptyStateText : Colors.light.emptyStateText,
        marginBottom: 16,
        marginTop: 8,
    },
    shoppingItem: {
        backgroundColor: getCardBackground(),
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: getShadowColor(),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    shoppingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: getCardBackground(),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: getBorderColor(),
    },
    itemEmoji: {
        fontSize: 20,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? Colors.dark.emptyStateText : Colors.light.emptyStateText,
        marginBottom: 4,
    },
    itemQuantity: {
        fontSize: 14,
        color: isDark ? Colors.dark.emptyStateSubtext : Colors.light.emptyStateSubtext,
        fontWeight: '400',
    },
    shoppingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowButton: {
        marginRight: 12,
        padding: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isDark ? Colors.dark.checkboxBorder : Colors.light.checkboxBorder,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? Colors.dark.checkboxBackground : Colors.light.checkboxBackground,
    },
    checkboxChecked: {
        backgroundColor: '#C28040',
        borderColor: '#C28040',
    },
    dateSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: getBgColor(),
    },
    todayText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        letterSpacing: 0,
        color: getTextColor(),
    },
    calendarLink: {
        fontSize: 14,
        color: '#B8864F',
        fontWeight: '500',
    },
    // Weekly Plan FlatList Styles
    daysList: {
        gap: 2,
        marginBottom: 20,
    },
    dayItem: {
        alignItems: 'center',
        backgroundColor: getCardBackground(),
        borderRadius: 14,
        paddingHorizontal: 3,
        paddingVertical: 3,
        width: 46,
        height: 85,
        marginRight: 6,
    },
    dayItemSelected: {
        backgroundColor: Colors.mainColor,
    },
    dayText: {
        fontSize: 12,
        color: '#B5B5B5',
        fontFamily: 'Poppins-Medium',
        paddingVertical: 7,
    },
    dayTextSelected: {
        color: Colors.white,
    },
    dateText: {
        fontSize: 16,
        lineHeight: 22,
        color: isDark ? Colors.dark.secondaryText : '#B5B5B5',
        fontFamily: 'Poppins-SemiBold',
        padding: 10,
        minWidth: 38,
        textAlign: 'center',
    },
    dateTextSelected: {
        backgroundColor: isDark ? Colors.dark.cardBackground : Colors.white,
        color: Colors.mainColor,
        padding: 10,
        borderRadius: 12,
    },
    recipesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: getBgColor(),
    },
    recipesTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        letterSpacing: 0,
        color: getTextColor(),
    },
    addToShoppingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addToShoppingText: {
        fontSize: 12,
        color: Colors.mainColor,
        marginLeft: 4,
        fontWeight: '500',
    },
    recipeImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    emptyMealsState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyMealsText: {
        fontSize: 16,
        color: isDark ? Colors.dark.emptyStateSubtext : Colors.light.emptyStateSubtext,
        marginBottom: 20,
        textAlign: 'center',
    },
    addMealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.mainColor,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    addMealText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    // Calendar styles - matching Weekly Days style
    calendarContainer: {
        backgroundColor: getBgColor(),
        borderRadius: 12,
        marginBottom: 20,
    },
    calendarDaysGrid: {
        gap: 6,
        paddingHorizontal: 2,
    },
    calendarDayItem: {
        alignItems: 'center',
        backgroundColor: getCardBackground(),
        borderRadius: 14,
        paddingHorizontal: 3,
        paddingVertical: 3,
        width: 46,
        marginRight: 7.4,
    },
    calendarDayItemSelected: {
        backgroundColor: Colors.mainColor,
    },
    calendarDayItemInactive: {
        backgroundColor: isDark ? Colors.dark.calendarInactive : Colors.light.calendarInactive,
    },
    calendarDayText: {
        fontSize: 12,
        color: '#B5B5B5',
        fontFamily: 'Poppins-Medium',
        paddingVertical: 7,
    },
    calendarDayTextSelected: {
        color: Colors.white,
    },
    calendarDateText: {
        fontSize: 16,
        lineHeight: 22,
        color: isDark ? Colors.dark.secondaryText : '#B5B5B5',
        fontFamily: 'Poppins-SemiBold',
        padding: 10,
        minWidth: 38,
        textAlign: 'center',
    },
    calendarDateTextSelected: {
        backgroundColor: isDark ? Colors.dark.cardBackground : Colors.white,
        color: Colors.mainColor,
        padding: 10,
        borderRadius: 12,
    },
    calendarDateTextInactive: {
        color: '#B5B5B5',
    },
    recipeCard: {
        backgroundColor: getCardBackground(),
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: getShadowColor(),
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: getBorderColor(),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        position: 'relative',
    },
    recipeEmoji: {
        fontSize: 24,
    },
    playButton: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recipeInfo: {
        flex: 1,
    },
    recipeType: {
        fontSize: 12,
        color: '#B8864F',
        fontWeight: '500',
        marginBottom: 4,
    },
    recipeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? Colors.dark.emptyStateText : Colors.light.emptyStateText,
        marginBottom: 4,
    },
    recipeDetails: {
        fontSize: 12,
        color: isDark ? Colors.dark.emptyStateSubtext : Colors.light.emptyStateSubtext,
    },
    recipeOptions: {
        padding: 8,
    },
    recipeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recipeActionButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#F5F5F5',
    },
    footerActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: getBgColor(),
        justifyContent: 'space-around',
    },
    footerButton: {
        backgroundColor: '#B8864F',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 100,
        justifyContent: 'center',
    },
    footerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? Colors.dark.emptyStateText : Colors.light.emptyStateText,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: isDark ? Colors.dark.emptyStateSubtext : Colors.light.emptyStateSubtext,
        textAlign: 'center',
        lineHeight: 20,
    },
    addIngredientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.mainColor,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginTop: 20,
    },
    addIngredientText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    section: {
        marginTop: 20,
        marginBottom: 6,
    },
    interestBtn: {
        marginBottom: 6,
        marginRight: 9,
        paddingHorizontal: 17,
        backgroundColor: Colors.mainColor,
    },
})

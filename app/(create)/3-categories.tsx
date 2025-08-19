import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button, ChoiceItem, Lines, ScrollView, Text, TextInput, View } from "@/components/base/BaseComponents"
import ImageLibrary from '@/components/ImageLibrary'
import { useAuth } from '@/contexts/authContext'
import { useRecipe } from '@/contexts/recipeContext'
import { isLight, paddings, theme } from '@/constants/Theme'
import { get, post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import IPrefItem from '@/interfaces/PrefItem'

export default function CategoriesStep() {
    const { user } = useAuth()
    const { recipe, setRecipe } = useRecipe()
    const router = useRouter()
    const { t } = useTranslation()

    const [categories, setCategories] = useState<IPrefItem[]>([])
    const [tags, setTags] = useState<IPrefItem[]>([])
    const [filteredCats, setFilteredCats] = useState<IPrefItem[]>([])
    const [filteredTags, setFilteredTags] = useState<IPrefItem[]>([])
    const [selectedCategories, setSelectedCategories] = useState<number[]>(recipe?.categories ?? [])
    const [selectedTags, setSelectedTags] = useState<number[]>(recipe?.tags ?? [])
    const [canGoNext, setCanGoNext] = useState(true)

    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [showAdding, setShowAdding] = useState<boolean>(false)
    const [filterCats, setFilterCats] = useState<string>('')
    const [filterTags, setFilterTags] = useState<string>('')
    const [addCat, setAddCat] = useState<string>('')
    const [addTag, setAddTag] = useState<string>('')
    const [error, setError] = useState<string>('')
    
    useEffect(() => {
        get({url: '/meta/categories', token: user?.token})
            .then(cats => {
                setCategories(cats)
                setFilteredCats(cats)
            })
            .catch(logError)

        get({url: '/meta/tags', token: user?.token})
            .then(tgs => {
                setTags(tgs)
                setFilteredTags(tgs)
            })
            .catch(logError)
    }, [])

    useEffect(() => {
        if (!recipe) {
            router.replace(`/(tabs)/`)
        }
    }, [])

    const nextStep = useCallback(() => {
        if (!recipe) {
            return
        }
        setCanGoNext(false)

        // don't send request if nothing changed
        if (recipe.categories && recipe.categories.length === selectedCategories.length && recipe.tags && recipe.tags.length === selectedTags.length) {
            const isCategoriesChanged = recipe.categories.some((c: number, i: number) => c !== selectedCategories[i])
            const isTagsChanged = recipe.tags.some((t: number, i: number) => t !== selectedTags[i])
            if (!isCategoriesChanged && !isTagsChanged) {
                setCanGoNext(true)
                return router.push(`/(create)/4-servings`)
            }
        }

        post({
            url: `/recipe/${recipe.id}/edit`,
            data: { categories: selectedCategories, tags: selectedTags },
            token: user?.token
        })
            .then((r) => {
                setCanGoNext(true)
                setRecipe({...recipe, categories: selectedCategories, tags: selectedTags})
                router.push(`/(create)/4-servings`)
            })
            .catch(e => {
                logError(e)
                setCanGoNext(true)
            })
    }, [recipe, selectedCategories, selectedTags])

    const toggleFilters = useCallback(() => {
        if (showFilters) {
            setFilterCats('')
            setFilterTags('')
            setFilteredCats(categories)
            setFilteredTags(tags)
        }
        setShowFilters(!showFilters)
    }, [showFilters, showAdding])

    const changeFilterCats = useCallback((text: string) => {
        setFilterCats(text)
        if (text.length > 2) {
            setFilteredCats(categories.filter((cat: IPrefItem) => cat.title.toLowerCase().includes(text.toLowerCase())))
        } else {
            setFilteredCats(categories)
        }
    }, [categories])

    const changeFilterTags = useCallback((text: string) => {
        setFilterTags(text)
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
        }
        setShowAdding(!showAdding)
    }, [showAdding, showFilters])

    const onAdd = useCallback(() => {
        const types = {
            category: {
                url: '/meta/category/create',
                data: { title: addCat },
                setList: setCategories,
                setSelected: setSelectedCategories,
                setFilteredList: setFilteredCats,
                list: categories,
                selectedList: selectedCategories,
                filteredList: filteredCats,
            },
            tag: {
                url: '/meta/tag/create',
                data: { title: addTag },
                setList: setTags,
                setSelected: setSelectedTags,
                setFilteredList: setFilteredTags,
                list: tags,
                selectedList: selectedTags,
                filteredList: filteredTags,
            },
        }
        const type = addCat !== '' ? 'category' : 'tag'

        post({
            url: types[type].url,
            data: types[type].data,
            token: user?.token,
        })
            .then(resp => {
                // place a new item on the top of list
                types[type].setList([resp, ...types[type].list])
                types[type].setFilteredList([resp, ...types[type].filteredList])
                types[type].setSelected([...types[type].selectedList, resp.id])

                setAddCat('')
                setAddTag('')
                setShowAdding(false)
            })
            .catch(e => {
                logError(e)
                setError(e.response?.data?.message)
            })
    }, [showAdding, addCat, addTag, categories, tags, selectedCategories, selectedTags, filteredCats, filteredTags])

    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')
    const window = Dimensions.get('window')

    return (
        <View style={theme.container}>
            <View style={theme.statusBarHeight} />
            <View style={theme.mainContainer}>
                <View style={[theme.titleContainer, s.topbarWrap]}>
                    <Pressable
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(create)/2-title')}
                        style={s.topbarInner}
                    >
                        <Image
                            source={isLight() ? backIconLight : backIconDark}
                            style={{ width: 16, height: 16 }}
                        />
                        <Text type="caption">{t('Step {{num}}', {num: 3})}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.navigate('/(tabs)/profile')}>
                        <Text type="link">{t('Cancel')}</Text>
                    </Pressable>
                </View>

                <ScrollView style={s.main}>
                    <View style={[s.wrapper, {width: window.width - paddings * 2}]}>
                        <View style={s.filtersWrapper}>
                            {!showFilters && !showAdding && (
                                <Pressable onPress={toggleFilters}>
                                    <Image source={isLight() ? require('@/assets/icons/filter-dark.png') : require('@/assets/icons/filter-light.png')} style={s.filterIcon}/>
                                </Pressable>
                            )}
                            {showFilters && (<View style={[s.filtersWrapper, {marginBottom: 0}]}>
                                <Pressable onPress={toggleFilters}>
                                    <Image source={isLight() ? require('@/assets/icons/x.png') : require('@/assets/icons/x-white.png')} style={s.filterIcon}/>
                                </Pressable>
                                <View style={s.filters}>
                                    <TextInput
                                        value={filterCats}
                                        onChangeText={changeFilterCats}
                                        placeholder={t('Categories')}
                                    />
                                    <TextInput
                                        value={filterTags}
                                        onChangeText={changeFilterTags}
                                        placeholder={t('Tags')}
                                    />
                                </View>
                            </View>)}
                            {!showFilters && !showAdding && (
                                <Pressable onPress={toggleAdding}>
                                    <Image source={require('@/assets/icons/plus-main.png')} style={s.filterIcon}/>
                                </Pressable>
                            )}
                            {showAdding && (<View>
                                <View style={[s.filtersWrapper, {marginBottom: 0}]}>
                                    <Pressable onPress={toggleAdding}>
                                        <Image source={isLight() ? require('@/assets/icons/x.png') : require('@/assets/icons/x-white.png')} style={s.filterIcon}/>
                                    </Pressable>
                                    <View style={s.filters}>
                                        { addTag === '' && <TextInput
                                            value={addCat}
                                            onChangeText={val => {
                                                setAddCat(val)
                                                error && setError('')
                                            }}
                                            placeholder={t('Add category')}
                                            editable={addTag === ''}
                                        /> }
                                        { addCat === '' && <TextInput
                                            value={addTag}
                                            onChangeText={val => {
                                                setAddTag(val)
                                                error && setError('')
                                            }}
                                            placeholder={t('Add tag')}
                                            editable={addCat === ''}
                                        /> }
                                    </View>
                                </View>
                                {error !== '' && <Text type="error" style={{textAlign: 'center'}}>{error}</Text>}
                                {(addCat !== '' || addTag !== '') &&
                                    <Button
                                        text={t(addCat !== '' ? 'Add category' : 'Add tag')}
                                        onPress={onAdd}
                                        shape="round"
                                        style={s.addButton}
                                    />
                                }
                            </View> )}
                        </View>
                        <Text type="subtitle" style={s.subtitle}>{t('Select category')}</Text>
                        {filteredCats.map((cat: IPrefItem) => (
                            <ChoiceItem
                                key={cat.id}
                                id={cat.id}
                                img={cat.icon ? ImageLibrary[cat.icon as keyof typeof ImageLibrary] : ImageLibrary.avocado}
                                text={cat.title}
                                checked={selectedCategories.includes(cat.id)}
                                onPress={() => {
                                    if (selectedCategories.includes(cat.id)) {
                                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id))
                                    } else {
                                        setSelectedCategories([...selectedCategories, cat.id])
                                    }
                                }}
                            />
                        ))}

                        <Text type="subtitle" style={s.subtitle}>{t('Select tags')}</Text>
                        {filteredTags.map((tag: IPrefItem) => (
                            <ChoiceItem
                                key={tag.id}
                                id={tag.id}
                                img={tag.icon ? ImageLibrary[tag.icon as keyof typeof ImageLibrary] : ImageLibrary.avocado}
                                text={tag.title}
                                checked={selectedTags.includes(tag.id)}
                                onPress={() => {
                                    if (selectedTags.includes(tag.id)) {
                                        setSelectedTags(selectedTags.filter(id => id !== tag.id))
                                    } else {
                                        setSelectedTags([...selectedTags, tag.id])
                                    }
                                }}
                            />
                        ))}
                    </View>
                </ScrollView>

                <View style={s.btnWrapper}>
                    <View style={{ maxWidth: 136, alignSelf: 'center' }}>
                        <Lines count={7} current={2} />
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
        marginTop: 12,
        marginBottom: 36,
        gap: 14,
    },
    filtersWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        gap: 12,
    },
    filterIcon: {
        width: 24,
        height: 24,
        marginTop: 12,
    },
    filters: {
        gap: 12,
        flex: 1,
    },
    addButton: {
        width: '100%',
        marginTop: 20,
    },
    subtitle: {
        marginHorizontal: 40,
        marginBottom: 20,
        textAlign: 'center',
    },
    btnWrapper: {
        height: 142,
        justifyContent: 'space-between',
        marginBottom: 82,
    },
})
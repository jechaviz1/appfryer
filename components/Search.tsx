import { useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { TextInput, View } from '@/components/base/BaseComponents'
import Filters from './modals/Filters'
import { Colors } from '@/constants/Colors'
import IRecipe from '@/interfaces/Recipe'
import { post } from '@/services/apiRequests'
import { logError } from '@/services/utils'
import { useAuth } from '@/contexts/authContext'
import { useSearchFilters } from "@/contexts/searchFiltersContext"

interface SearchProps {
    page: string
    onSearch: (recipes: IRecipe[]) => void
    personId?: number
    sendOnBlankFiltersEmptyArray?: boolean
}

export default function Search({page, onSearch, personId, sendOnBlankFiltersEmptyArray = false}: SearchProps) {
    const [searchVal, setSearchVal] = useState<string>('')
    const [showFilters, setShowFilters] = useState<boolean>(false)

    const { searchFilters } = useSearchFilters()
    const { user } = useAuth()
    const { t } = useTranslation()

    const getFeed = () => {
        let data = {...searchFilters?.[page]}
        if (searchVal !== '') {
            data.filterTitle = searchVal
        }
        if (page === 'me') {
            data.type = 'own'
        }
        if (page === 'otherProfile' && personId !== user?.id) {
            data.filterUserId = personId
        }
        if (Object.keys(data).length === 0) {
            data = undefined
        }
        if (sendOnBlankFiltersEmptyArray && data === undefined) {
            onSearch([])
            return
        }
        post({
            url: `/feed`,
            token: user?.token,
            data,
        })
            .then(recipes => onSearch(recipes))
            .catch(logError)
    }

    return (
        <View style={s.container}>
            { showFilters && <Filters
                isVisible={showFilters}
                onHide={() => setShowFilters(false)}
                page={page}
                personId={personId}
                onSubmit={onSearch}
            /> }
            <View style={s.searchContainer}>
                <Image source={require('@/assets/icons/search.png')} style={s.searchIcon} />
                <TextInput
                    styleContainer={s.searchInput}
                    styleTextInput={s.searchTextInput}
                    inputMode='text'
                    autoCapitalize='none'
                    value={searchVal}
                    onBlur={getFeed}
                    onSubmitEditing={getFeed}
                    returnKeyType='search'
                    textContentType='none'
                    onChangeText={val => setSearchVal(val)}
                    placeholder={t('Search recipes')}
                    placeholderTextColor={Colors.grey}
                    useCustomPlaceholder
                    placeholderStyle={{ fontSize: 15, lineHeight: 17 }}
                />
            </View>
            <Pressable
                style={s.filterButton}
                onPress={() => setShowFilters(true)}
            >
                <Image
                    style={s.filterIcon}
                    source={require('@/assets/icons/filter-dark.png')}
                />
            </Pressable>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        borderRadius: 16,
        position: 'relative',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: '#A3A3A3',
    },
    searchInput: {
        flex: 1,
        color: Colors.black,
        borderWidth: 0,
        paddingHorizontal: 10,
        height: 42,
    },
    searchTextInput: {
        fontSize: 15,
        lineHeight: 21,
        fontFamily: 'Poppins',
        color: Colors.greyTextColor,
    },
    filterButton: {
        width: 32,
        height: 32,
        backgroundColor: '#F6ECE2',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    filterIcon: {
        width: 20,
        height: 20,
    },
})
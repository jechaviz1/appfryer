import { useState } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { TextInput, View } from '@/components/base/BaseComponents'
import Filters from './modals/Filters'
import { Colors } from '@/constants/Colors'
import { isLight } from '@/constants/Theme'
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

    const searchIcon = require('@/assets/icons/search.png')
    const filterLight = require('@/assets/icons/filter-light.png')
    const filterDark = require('@/assets/icons/filter-dark.png')

    return (
        <View style={s.container}>
            { showFilters && <Filters
                isVisible={showFilters}
                onHide={() => setShowFilters(false)}
                page={page}
                personId={personId}
                onSubmit={onSearch}
            /> }
            <View style={{ flex: 1 }} >
                <TextInput
                    styleContainer={s.inputContainer}
                    inputMode='text'
                    autoCapitalize='none'
                    value={searchVal}
                    onBlur={getFeed}
                    onSubmitEditing={getFeed}
                    returnKeyType='search'
                    textContentType='none'
                    onChangeText={val => setSearchVal(val)}
                    placeholder={t('Search...')}
                    startIcon={searchIcon}
                />
            </View>
            <Pressable
                style={s.filterBtn}
                onPress={() => setShowFilters(true)}
            >
                <Image
                    style={s.filterImg}
                    source={isLight() ? filterLight : filterDark}
                />
            </Pressable>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
    },
    inputContainer: {
        backgroundColor: '#00000008',
        borderWidth: 0,
    },
    filterBtn: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: Colors.mainColor,
    },
    filterImg: {
        width: 20,
        height: 20,
    },
})
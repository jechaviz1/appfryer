import axios from 'axios'
import { router } from 'expo-router'

const baseUrl = process.env.EXPO_PUBLIC_API_URL

let logoutHandler: (() => void) | null = null
let isRedirectingToLogin = false

export function setLogoutHandler(handler: () => void) {
    logoutHandler = handler
}

export function handleUnauthorized() {
    if (logoutHandler) {
        logoutHandler()
    }

    // Prevent multiple redirects to login page
    if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        router.replace('/(auth)/login')

        setTimeout(() => {
            isRedirectingToLogin = false
        }, 1000)
    }
}

const request = ({
    method,
    url,
    data,
    files,
    token,
}: {
    method: string,
    url: string,
    data?: any,
    files?: [
        string,
        {
            uri: string;
            type: string | undefined;
            name: string | undefined;
        }
    ][],
    token?: string,
}) => {
    const currentDateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`${currentDateTime} ${method.toUpperCase()} url: ${baseUrl + url}`)
    const headers: any = {}
    if (method === 'post') {
        headers['Accept'] = 'application/json'
        headers['Content-Type'] = 'multipart/form-data'
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    const options: any = {
        method,
        url: baseUrl + url,
        headers,
    }

    const body = new FormData()
    let bodyEmpty = true

    if (data) {
        console.log('--> data', data)
        Object.keys(data).forEach(key => {
            body.append(key, Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key])
        })
        bodyEmpty = false
    }

    if (files && files.length > 0) {
        console.log('--> files', files)
        files.map(file => {
            const [key, value]: [string, any] = file;
            body.append(key, value);
        })
        bodyEmpty = false
    }
    if (!bodyEmpty) {
        options.data = body
    }

    return axios(options)
        .catch(error => {
            console.log('-- ERROR from URL: ' + url)
            if (error.response && url !== '/login_check' && error.response.status === 401) {
                handleUnauthorized()
            }
            throw error
        })
}

export function get({url, token}: {url: string, token?: string}) {
    return request({method: 'get', url, token})
        .then(res => res.data)
}

export function post({url, data, files, token}: {
    url: string,
    data?: any,
    files?: [
        string,
        {
            uri: string;
            type: string | undefined;
            name: string | undefined;
        }
    ][],
    token?: string
}) {
    return request({method: 'post', url, data, files, token})
        .then(res => res.data)
}

export function prepareGlobQueryToUrl(globQuery: any) {
    const data: any = {}

    if (globQuery.type) {
        data.type = typeof globQuery.type === 'string' ? globQuery.type : globQuery.type[0]
    }
    if (globQuery.filterFolder) {
        data.filterFolder = Array.isArray(globQuery.filterFolder) ? globQuery.filterFolder[0] : globQuery.filterFolder
    }
    if (globQuery.filterDiets) {
        const diets = typeof globQuery.filterDiets === 'string' ? globQuery.filterDiets : globQuery.filterDiets[0]
        data.filterDiets = `[${diets}]`
    }
    if (globQuery.filterCategories) {
        const cats = typeof globQuery.filterCategories === 'string' ? globQuery.filterCategories : globQuery.filterCategories[0]
        data.filterCategories = `[${cats}]`
    }
    if (globQuery.filterIngredientCategories) {
        const ingrs = typeof globQuery.filterIngredientCategories === 'string' ? globQuery.filterIngredientCategories : globQuery.filterIngredientCategories[0]
        data.filterIngredientCategories = `[${ingrs}]`
    }
    if (globQuery.filterRating) {
        data.filterRating = typeof globQuery.filterRating === 'string' ? globQuery.filterRating : globQuery.filterRating[0]
    }
    if (globQuery.filterPreparationTime) {
        const time = typeof globQuery.filterPreparationTime === 'string' ? globQuery.filterPreparationTime : globQuery.filterPreparationTime[0]
        data.filterPreparationTime = `[${time}]`
    }

    return data
}

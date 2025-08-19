export const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000 // years
    if (interval > 1) {
        const val = Math.floor(interval)
        return val + " y"
    }
    interval = seconds / 2592000 // months
    if (interval > 1) {
        const val = Math.floor(interval)
        return val + " m"
    }
    interval = seconds / 86400 // days
    if (interval > 1) {
        const val = Math.floor(interval)
        return val + " d"
    }
    interval = seconds / 3600 // hours
    if (interval > 1) {
        const val = Math.floor(interval)
        return val + " h"
    }
    interval = seconds / 60 // minutes
    if (interval > 1) {
        const val = Math.floor(interval)
        return val + " mn"
    }
    const val = Math.floor(interval)
    return val + " s"
}

export const timeFromMinutes = (minutes: number) => {
    const minutesToView = minutes % 60
    if (minutes < 60) {
        return `${minutesToView}mn`
    }
    if (minutes < 60 * 24) {
        return `${Math.floor(minutes / 60)}h ${minutesToView}mn`
    }
    return `${Math.floor(minutes / 60 * 24 * 10)} d`
}

export const getTimerTextFromSeconds = (seconds: number) => {
    const secondsToView = seconds % 60
    const secondsToViewStr = secondsToView === 0
        ? '00'
        : (secondsToView < 10 ? `0${secondsToView}` : `${secondsToView}`)
    if (seconds < 60) {
        return `0:${secondsToViewStr}`
    }
    if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}:${secondsToViewStr}`
    }
    if (seconds < 86400) {
        const minutesToView = seconds % 3600
        const minutesToViewStr = minutesToView === 0
            ? '00'
            : (minutesToView < 10 ? `0${minutesToView}` : `${minutesToView}`)
        return `${Math.floor(seconds / 3600)}:${minutesToViewStr}:${secondsToViewStr}`
    }
}

export const dateToDisplay = (d: Date, locale: string = 'default') : string => {
    const now = new Date()
    if (now.toISOString().split('T')[0] === d.toISOString().split('T')[0]) {
        return 'Today'
    }
    return `${d.getDate()} ${d.toLocaleString(locale, {month: 'long'})}${now.getFullYear() !== d.getFullYear() ? ('/' + d.getFullYear()) : ''}, ${d.toLocaleString(locale, {weekday: 'long'})}`
}
export const validateName = (name: string) => {
    return String(name).match(/^[a-zA-Z\s-]+$/)
}

export const validateEmail = (email: string) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
}

// TODO: add more rules to password validation
export const validatePassword = (password: string) => {
    return String(password).length >= 6
}
import React, { useEffect } from 'react'
import { RadialSlider } from 'react-native-radial-slider'

interface RadialSliderWrapperProps {
    variant?: string
    startAngle?: number
    max?: number
    min?: number
    value?: number
    onChange?: (value: number) => void
    step?: number
    radius?: number
    sliderWidth?: number
    sliderTrackColor?: string
    thumbRadius?: number
    thumbBorderWidth?: number
    lineSpace?: number
    isHideCenterContent?: boolean
    linearGradient?: Array<{offset: string, color: string}>
    [key: string]: any // Allow any additional props
}

export default function RadialSliderWrapper(props: RadialSliderWrapperProps) {
    useEffect(() => {
        // Suppress the defaultProps warning for this component
        const originalConsoleWarn = console.warn
        console.warn = (message: string, ...args: any[]) => {
            if (typeof message === 'string' && message.includes('defaultProps will be removed from function components')) {
                return // Suppress this specific warning
            }
            originalConsoleWarn(message, ...args)
        }

        return () => {
            console.warn = originalConsoleWarn
        }
    }, [])

    return <RadialSlider {...props} />
}

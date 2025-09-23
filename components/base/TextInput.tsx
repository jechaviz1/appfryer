import { forwardRef, useEffect, useState } from "react"
import { Image, StyleProp, TextInput as TextInputNative, TextStyle, Pressable, StyleSheet, ViewStyle, View as RNView, Text as RNText } from "react-native"
import { View } from "@/components/base/View"
import { Colors } from "@/constants/Colors"
import { isLight } from "@/constants/Theme"

type TextInputProps = React.ComponentProps<typeof TextInputNative> & {
    startIcon?: any,
    background?: string,
    styleContainer?: StyleProp<ViewStyle>,
    styleTextInput?: StyleProp<TextStyle>,
    onChangeText?: (text: string) => void,
    placeholderStyle?: StyleProp<TextStyle>,
    useCustomPlaceholder?: boolean,
}

export const TextInput = forwardRef<TextInputNative, TextInputProps>((props: TextInputProps, ref: React.Ref<TextInputNative>) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState<string>(typeof props.value === 'string' ? props.value : '')

    useEffect(() => {
        if (props.textContentType === 'password') {
            setShowPassword(false)
        }
    }, [props.textContentType])

    useEffect(() => {
        if (typeof props.value === 'string') {
            setInternalValue(props.value)
        }
    }, [props.value])

    const eyeOpen = require('@/assets/icons/eye-open.png')
    const eyeSlashed = require('@/assets/icons/eye-slashed.png')

    const showCustomPlaceholder = props.useCustomPlaceholder && !isFocused && (!internalValue || internalValue.length === 0)

    return (
        <View style={[s.inputContainer, props.styleContainer]}>
            { props.startIcon && <Image source={props.startIcon} style={s.startIcon} /> }

            <RNView style={s.inputWrapper}>
                { showCustomPlaceholder && (
                    <RNView pointerEvents="none" style={s.placeholderContainer}>
                        <RNText
                            style={[
                                s.placeholderText,
                                { color: isLight() ? Colors.grey : Colors.lightGrey },
                                props.placeholderStyle
                            ]}
                            numberOfLines={1}
                        >
                            {props.placeholder}
                        </RNText>
                    </RNView>
                )}

                <TextInputNative
                    ref={ref}
                    style={[s.input, {color: isLight() ? Colors.black : Colors.lightGrey}, props.styleTextInput]}
                    placeholderTextColor={isLight() ? Colors.grey : Colors.lightGrey}
                    {...props}
                    placeholder={props.useCustomPlaceholder ? undefined : props.placeholder}
                    secureTextEntry={props.textContentType === 'password' && !showPassword}
                    onFocus={(e) => {
                        setIsFocused(true)
                        props.onFocus && props.onFocus(e)
                    }}
                    onBlur={(e) => {
                        setIsFocused(false)
                        props.onBlur && props.onBlur(e)
                    }}
                    onChangeText={(text) => {
                        setInternalValue(text)
                        props.onChangeText && props.onChangeText(text)
                    }}
                />
            </RNView>

            { props.textContentType === 'password' &&
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Image
                        source={showPassword ? eyeOpen : eyeSlashed}
                        style={s.endIcon}
                    />
                </Pressable>
            }
        </View>
    )
})

const s = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 0,
        borderRadius: 10,
        borderColor: Colors.lightGrey,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        height: 52,
        width: '100%',
        position: 'relative',
    },
    startIcon: {
        width: 17,
        height: 17,
        marginRight: 14,
        flex: 0,
    },
    endIcon: {
        width: 17,
        height: 17,
        marginLeft: 14,
        flex: 0,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        height: 50,
        width: '100%',
        position: 'relative',
    },
    placeholderContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    placeholderText: {
        left: 0,
        right: 0,
    },
})
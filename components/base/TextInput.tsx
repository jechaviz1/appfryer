import { forwardRef, useEffect, useState } from "react"
import { Image, StyleProp, TextInput as TextInputNative, TextStyle, Pressable, StyleSheet, ViewStyle } from "react-native"
import { View } from "@/components/base/View"
import { Colors } from "@/constants/Colors"
import { isLight } from "@/constants/Theme"

type TextInputProps = React.ComponentProps<typeof TextInputNative> & {
    startIcon?: any,
    background?: string,
    styleContainer?: StyleProp<ViewStyle>,
    styleTextInput?: StyleProp<TextStyle>,
    onChangeText?: (text: string) => void
}

export const TextInput = forwardRef<TextInputNative, TextInputProps>((props: TextInputProps, ref: React.Ref<TextInputNative>) => {
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (props.textContentType === 'password') {
            setShowPassword(false)
        }
    }, [props.textContentType])

    const eyeOpen = require('@/assets/icons/eye-open.png')
    const eyeSlashed = require('@/assets/icons/eye-slashed.png')

    return (
        <View style={[s.inputContainer, props.styleContainer]}>
            { props.startIcon && <Image source={props.startIcon} style={s.startIcon} /> }
            
            <TextInputNative
                ref={ref}
                style={[s.input, {color: isLight() ? Colors.black : Colors.lightGrey}, props.styleTextInput]}
                placeholderTextColor={isLight() ? Colors.grey : Colors.lightGrey}
                {...props}
                secureTextEntry={props.textContentType === 'password' && !showPassword}
            />

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
    input: {
        flex: 1,
        height: 50,
        width: '100%',
        position: 'relative',
    }
})
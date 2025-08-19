import { StyleSheet } from "react-native"
import { Colors } from "@/constants/Colors"
import { View } from "@/components/base/View"

interface LinesProps {
    count: number,
    current: number,
}
export function Lines({count, current}: LinesProps) {
    return (
        <View style={s.linesContainer}>
            {[...Array(count)].map((_, index) => (
                <View
                    key={index}
                    style={[
                        s.line,
                        index === current ? s.lineActive : s.lineInactive
                    ]}
                />
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    linesContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    line: {
        height: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    lineInactive: {
        width: 12,
        borderColor: Colors.lightGrey,
        backgroundColor: Colors.lightGrey,
    },
    lineActive: {
        width: 18,
        borderColor: Colors.mainColor,
        backgroundColor: Colors.mainColor,
    },
})

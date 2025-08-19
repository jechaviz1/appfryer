import { Appearance, Platform, StyleSheet } from 'react-native'
import Constants from 'expo-constants'
import { Colors } from './Colors'

export const paddings = 15

export const isLight = () => Appearance.getColorScheme() === 'light'
export function getBgColor() {
    return isLight() ? Colors.white : Colors.dark.background
}

// const bottomMargin = 46
const bottomMargin = 0

export const theme = StyleSheet.create({
    statusBarHeight: {
        marginTop: Constants.statusBarHeight,
    },
    container: {
        marginBottom: bottomMargin,
        minHeight: '100%',
    },
    mainContainer: {
        paddingHorizontal: paddings,
        paddingTop: 0,
        paddingBottom: bottomMargin + Constants.statusBarHeight,
        minHeight: '100%',
    },
    authContainer: {
        height: '100%',
        flex: 1,
        flexDirection: 'column',
        alignContent: 'space-between',
        justifyContent: 'space-between',
        marginBottom: Platform.OS === 'ios' ? 26 : 92,
    },
    titleContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, 
    },
    appNameText: {
        color: Colors.mainColor,
        fontFamily: 'DMSans-Bold',
        fontSize: 46,
        lineHeight: 72,
        paddingTop: 6,
        paddingBottom: 42,
    },
    authTitle: {
        fontFamily: 'DMSans-Bold',
        fontSize: 30,
        lineHeight: 42,
    },
    seeMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.mainColorLight,
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 8,
    },

    // New / Trend / Seasonal
    catTabs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    catTabWrapper: {
        marginHorizontal: 'auto',
        flex: 1,
    },
    catTab: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 'auto',
    },
    catTabBottomLine: {
        height: 2,
        width: '100%',
        marginTop: 6,
    },
    catTabActive: {
        borderColor: Colors.mainColor,
        borderBottomWidth: 2,
        borderRadius: 999,
    },
    catTabImg: {
        width: 20,
        height: 20,
    },
    catTabTextActive: {
        color: Colors.mainColor,
        fontWeight: 'bold',
        fontFamily: 'DMSans-Bold',
    },

    // Tabs
    tabs: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 20,
        justifyContent: 'center',
    },
    tabCaptionWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.mainColor,
    },
    tabCaption: {
        fontFamily: 'DMSans-Medium',
        lineHeight: 32,
    },
    tabsFlatList: {
        flexDirection: 'row',
        marginTop: 20,
    },
    tabInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Badges
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    recipeBadge: {
        backgroundColor: Colors.danger,
        borderRadius: 20,
        paddingHorizontal: 8,
    },
    recipeBadgeText: {
        color: Colors.white,
    },

    // Modals
    modal: {
        borderRadius: 20,
        width: '100%',
        marginHorizontal: 0,
        marginVertical: 0,
        paddingTop: Constants.statusBarHeight,
        padding: paddings,
        paddingBottom: 32,
    },
    modalTopbarWrap: {
        gap: 16,
        alignItems: 'center',
        width: '99%',
        marginTop: 20,
        marginBottom: 16,
    },
    modalTopbarInner: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 16,
        width: '100%',
    },

    // pages
    titleImageWrapper: {
        position: 'relative',
        marginBottom: 8,
    },
    titleImage: {
        width: '100%',
        height: 328,
        marginBottom: 12,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    section: {
        padding: 15,
        borderRadius: 12,
        shadowColor: "#aaa",
        shadowOffset: {
            width: 10,
            height: 10,
        },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 30,
    },

    // rate
    rateRecipeStars: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 23,
        shadowColor: "#ccc",
        shadowOffset: {
            width: 10,
            height: 10,
        },
        shadowOpacity: 0.22,
        shadowRadius: 30,
        elevation: 10,
        borderRadius: 14,
    },
    rateRecipeStar: {
        width: 40,
        height: 40,
    },

    // elements
    backButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,
        backgroundColor: '#49666B96',
    },
    bold: {
        fontWeight: 'bold',
        fontFamily: 'DMSans-Bold',
    },
    centerAlign: {
        width: '100%',
        textAlign: 'center',
        marginHorizontal: 'auto',
        alignContent: 'center',
        justifyContent: 'center',
    },
})
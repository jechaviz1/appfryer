import { useCallback, useEffect, useState } from "react"
import { ScrollView, StyleSheet } from "react-native"
import Modal from "react-native-modal"
import { useTranslation } from "react-i18next"

import { ModalTitle, Text, View } from "@/components/base/BaseComponents"
import Notification, { INotification } from "@/components/Notification"

import { post } from "@/services/apiRequests"
import { useAuth } from "@/contexts/authContext"
import { theme, getBgColor } from "@/constants/Theme"

export default function Notifications({ isVisible, onHide }: {isVisible: boolean, onHide: () => void}) {
    const { user } = useAuth()
    const { t } = useTranslation()

    const [notificationsBySections, setNotificationsBySections] = useState<{[key: string]: INotification[]}>({'today': [], 'last week': [], 'last month': [], 'all time': []})

    useEffect(() => {
        // get notifications from server
        user?.token && post({url: '/profile/notifications', token: user.token})
            .then(data => {
                const notificationsBySectionTmp: {[key: string]: INotification[]} = {'today': [], 'last week': [], 'last month': [], 'all time': []}
                // sorting by date
                data.forEach((notification: INotification) => {
                    const date = new Date(notification.createdAt)
                    const section = 'all time'
                    if (date.getTime() > new Date().getTime() - 1000 * 60 * 60 * 24) {
                        notificationsBySectionTmp['today'].push(notification)
                    } else if (date.getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * 7) {
                        notificationsBySectionTmp['last week'].push(notification)
                    } else if (date.getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * 30) {
                        notificationsBySectionTmp['last month'].push(notification)
                    } else {
                        notificationsBySectionTmp['all time'].push(notification)
                    }
                })
                
                setNotificationsBySections(notificationsBySectionTmp)
                
            })
    }, [])

    const getSectionName = useCallback((section: string) => {
        const sectionNames = {
            'today': 'Today',
            'last week': 'Last week',
            'last month': 'Last month',
            'all time': 'All time',
        }

        return sectionNames[section as keyof typeof sectionNames]
    }, [])

    return (
        <Modal
            isVisible={isVisible}
            onModalHide={onHide}
            style={[theme.modal, { backgroundColor: getBgColor(), justifyContent: 'flex-start' }]}
        >
            <ModalTitle title={t('Notifications')} onHide={onHide} />
            <ScrollView style={s.modalContent}>
                {Object.keys(notificationsBySections).map((section) => {
                    if (notificationsBySections[section].length === 0) {
                        return null
                    }

                    return (
                    <View key={section} style={s.section}>
                        <Text style={s.sectionTitle}>{t(getSectionName(section))}</Text>
                        { notificationsBySections[section].map((notification, index) =>
                            <Notification key={index} {...notification} />
                        )}
                    </View>)
                })}
            </ScrollView>
        </Modal>
    )
}

const s = StyleSheet.create({
    modalContent: {
        marginTop: 10,
        width: '100%',
    },
    section: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        gap: 20,
        marginTop: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        alignSelf: 'flex-start',
        fontSize: 17,
        fontFamily: 'DMSans-Bold',
    },
})
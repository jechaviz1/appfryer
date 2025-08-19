import { useEffect, useRef, useState } from 'react'
import { Dimensions, Image, Pressable, ScrollView, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Video, {VideoRef} from 'react-native-video'
import Modal from 'react-native-modal'
import { useTranslation } from 'react-i18next'

import { Text, View } from '@/components/base/BaseComponents'
import { Colors } from '@/constants/Colors'
import Story, { StoryProps } from './Story'
import { theme, getBgColor, isLight } from '@/constants/Theme'
import { useAppState } from '@/contexts/appStateContext'

export default function Stories ({storiesArray}: {storiesArray: StoryProps[]}) {
    const { t } = useTranslation()

    const { appState, setAppState } = useAppState()
    const [viewingStory, setViewingStory] = useState<StoryProps>()
    const videoRef = useRef<VideoRef | null>(null)
    
    const window = Dimensions.get('window')

    const [stories, setStories] = useState<StoryProps[]>([])
    useEffect(() => {
        // get stories from server
        setStories(storiesArray)
    }, [])

    const onHideStory = () => {
        setViewingStory(undefined)
        setStories(
            stories.map((story: StoryProps) => {
                return story.id === viewingStory?.id ? { ...story, viewed: true } : story
            })
            .sort((a: StoryProps, b: StoryProps) => Number(a.viewed ?? 0) - Number(b.viewed ?? 0)) 
        )
    }

    const plusIcon = isLight() ? require('@/assets/icons/plus-white.png') : require('@/assets/icons/plus-black.png')
    const backIconLight = require('@/assets/icons/arrow-left.png')
    const backIconDark = require('@/assets/icons/arrow-left-light.png')

    const onStartPlaying = () => {
        if (!videoRef?.current) {
            return
        }

        if (appState.playingVideoRef !== null) {
            try {
                appState.playingVideoRef.pause()
            } catch (e) {
                console.log(e)
            }
        }
        setAppState({ ...appState, playingVideoRef: videoRef.current });
        
        videoRef.current.seek(0);
        videoRef.current.resume();
    }

    return (
        <ScrollView style={s.container} horizontal>
            <Modal
                isVisible={!!viewingStory?.link}
                onModalHide={onHideStory}
                style={[theme.modal, { backgroundColor: getBgColor(), justifyContent: 'flex-start' }]}
            >
                <Pressable onPress={onHideStory} style={[s.storyTopbar, { width: window.width }]}>
                    <Image
                        source={isLight() ? backIconLight : backIconDark}
                        style={{ width: 16, height: 16 }}
                    />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', fontFamily: 'DMSans-Bold' }}>{viewingStory?.name}</Text>
                </Pressable>
                { viewingStory?.link && <Video
                    ref={videoRef}
                    source={{ uri: viewingStory.link }}
                    style={[s.videoContainer, {
                        width: window.width,
                        height: window.height,
                    }]}
                    resizeMode='cover'
                    onEnd={onHideStory}
                    onLoad={onStartPlaying}
                    onTouchStart={() => videoRef.current && videoRef.current.pause()}
                    onTouchEnd={() => videoRef.current && videoRef.current.resume()}
                /> }
            </Modal>

            <View style={[s.storyWrapper, { alignItems: 'center' }]}>
                <LinearGradient colors={Colors.storyGradient} style={[s.yourStoryCircle]}>
                    <Image source={plusIcon} style={s.plusIcon}/>
                </LinearGradient>
                <Text>{t('Your story')}</Text>
            </View>
            { stories.map(story => (
                <Pressable style={s.storyWrapper} key={story.id} onPress={() => {
                    setViewingStory(story)
                }}>
                    <Story {...story} />
                </Pressable>
            ))}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 13,
        overflow: 'scroll',
    },
    storyWrapper: {
        maxHeight: 86,
    },
    story: {
        alignItems: 'center',
    },
    storyTopbar: {
        position: 'absolute',
        top: 60,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
        gap: 10,
        padding: 20,
        backgroundColor: '#ffffff80',
    },
    videoContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
    },
    yourStoryCircle: {
        width: 56,
        height: 56,
        borderRadius: 999,
        backgroundColor: 'lightgrey',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusIcon: {
        width: 21,
        height: 21,
    },
})
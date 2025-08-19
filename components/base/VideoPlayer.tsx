import { useCallback, useEffect, useRef, useState } from 'react'
import Video, {VideoRef} from 'react-native-video'
import { Dimensions, Image, Pressable, StyleSheet, TouchableWithoutFeedback, ViewStyle } from 'react-native'

import { View } from '@/components/base/View'
import VisibilitySensor from '@/components/base/VisibilitySensor'
import { useAppState } from '@/contexts/appStateContext'

interface VideoPlayerProps {
    uri: string
    style?: ViewStyle | ViewStyle[]
    videoStyle?: ViewStyle | ViewStyle[]
    isRendered: boolean
    playIconSize?: number
    paused?: boolean
}

interface IStatus {
    isPlaying: boolean
    isSeeking: boolean
    target?: number | null
}

export const VideoPlayer = ({ uri, style, videoStyle, isRendered, playIconSize, paused }: VideoPlayerProps) => {
    const { appState, setAppState } = useAppState()
    const triangleRef = useRef(null)
    const videoRef = useRef<VideoRef | null>(null)
    const [status, setStatus] = useState<IStatus>({isPlaying: false, isSeeking: false, target: null})
    const [iconSize] = useState<number>(playIconSize || 50)

    // on unmount
    useEffect(() => {
        return () => {
            // if current video is playing, set it to null
            if (appState.targetVideo === status.target) {
                setAppState({ ...appState, playingVideoRef: null, targetVideo: null })
            }
        }
    }, [])

    useEffect(() => {
        if (!isRendered) {
            videoRef.current = null
        }
    }, [isRendered])

    const onStartPlaying = useCallback((action?: 'play' | 'pause') => {
        // try to pause previous video
        if (appState.playingVideoRef !== null && appState.targetVideo !== status.target) {
            try {
                appState.playingVideoRef.pause()
            } catch (e) {
                console.error(e, 'try to pause')
            }
        }
        // set current video as playing
        setAppState(prevAppState => ({
            ...prevAppState,
            playingVideoRef: videoRef.current,
        }))
        // handler on click
        if (videoRef.current !== null && !action) {
            status.isPlaying
                ? videoRef.current.pause()
                : videoRef.current.resume()
            return
        }
        // handler on visibility
        if (videoRef.current !== null) {
            action === 'pause'
                ? videoRef.current.pause()
                : videoRef.current.resume()
        }
    }, [appState.playingVideoRef, videoRef, status.isPlaying])

    const windowHeight = Dimensions.get('window').height

    if (!isRendered) {
        return <View />
    }

    return (
        <TouchableWithoutFeedback
            style={style}
            onPress={() => onStartPlaying()}
        >
            <VisibilitySensor style={style}
                onChange={isVisible => {
                    onStartPlaying(isVisible ? 'play' : 'pause')
                }}
                threshold={{top: windowHeight / 2.2, bottom: windowHeight / 2.2}}
            >
                { !status.isPlaying && <Pressable
                    style={[s.playIcon, {
                        width: iconSize,
                        height: iconSize,
                        transform: [{ translateX: -iconSize / 2 }, { translateY: -iconSize / 2 }], }
                    ]}
                    onPress={() => onStartPlaying()}
                >
                    <Image
                        ref={triangleRef}
                        source={require('@/assets/icons/video-triangle.png')}
                        style={{ width: iconSize, height: iconSize }}
                    />
                </Pressable> }

                <Video
                    ref={videoRef}
                    source={{ uri }}
                    style={[{ width: '100%', height: '100%' }, videoStyle]}
                    resizeMode='cover'
                    repeat={true}
                    onPlaybackStateChanged={status => {
                        setStatus(() => status)
                    }}
                    paused={paused || appState.playingVideoRef !== videoRef.current}
                />
            </VisibilitySensor>
        </TouchableWithoutFeedback>
    )
}

const s = StyleSheet.create({
    playIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        zIndex: 100,
    },
})
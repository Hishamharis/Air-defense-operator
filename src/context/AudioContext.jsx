import React, { createContext, useContext, useEffect, useState } from 'react';
import { audioEngineInstance } from '../audio/AudioEngine';

const AudioContext = createContext();

export function AudioProvider({ children }) {
    const [isMuted, setIsMuted] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const initAudio = async () => {
        if (!isInitialized) {
            await audioEngineInstance.init();
            setIsInitialized(true);
        }
    };

    const toggleMute = () => {
        const newMuteState = audioEngineInstance.toggleMute();
        setIsMuted(newMuteState);
    };

    // Autoplay compliance: initialize on first interaction
    useEffect(() => {
        const handleInteraction = () => {
            initAudio();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    return (
        <AudioContext.Provider value={{ audio: audioEngineInstance, isMuted, toggleMute, initAudio, isInitialized }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    return useContext(AudioContext);
}

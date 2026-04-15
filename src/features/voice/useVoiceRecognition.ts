import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceRecognitionLanguage = 'fr-FR' | 'en-US';

export type VoiceRecognitionErrorCode =
    | 'not-supported'
    | 'not-allowed'
    | 'audio-capture'
    | 'network'
    | 'aborted'
    | 'no-speech'
    | 'unknown';

export type VoiceRecognitionError = {
    code: VoiceRecognitionErrorCode;
    message: string;
};

type SpeechRecognitionLike = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error?: string; message?: string }) => void) | null;
    onresult: ((event: any) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function resolveSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const speechWindow = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
    };

    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function mapRecognitionError(errorCode?: string): VoiceRecognitionError {
    switch (errorCode) {
        case 'not-allowed':
        case 'service-not-allowed':
            return {
                code: 'not-allowed',
                message: 'Microphone access was denied.',
            };
        case 'audio-capture':
            return {
                code: 'audio-capture',
                message: 'No microphone was detected.',
            };
        case 'network':
            return {
                code: 'network',
                message: 'A network issue interrupted speech recognition.',
            };
        case 'aborted':
            return {
                code: 'aborted',
                message: 'Voice capture was aborted.',
            };
        case 'no-speech':
            return {
                code: 'no-speech',
                message: 'No speech was detected.',
            };
        default:
            return {
                code: 'unknown',
                message: 'Speech recognition failed unexpectedly.',
            };
    }
}

export function useVoiceRecognition() {
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const finalTranscriptRef = useRef('');
    const stopResolverRef = useRef<((transcript: string) => void) | null>(null);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [activeLanguage, setActiveLanguage] = useState<VoiceRecognitionLanguage>('fr-FR');
    const [error, setError] = useState<VoiceRecognitionError | null>(null);

    const isSupported = resolveSpeechRecognitionCtor() !== null;

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const resetTranscript = useCallback(() => {
        finalTranscriptRef.current = '';
        setTranscript('');
        setLiveTranscript('');
    }, []);

    const ensureRecognition = useCallback(() => {
        if (recognitionRef.current) {
            return recognitionRef.current;
        }

        const Ctor = resolveSpeechRecognitionCtor();
        if (!Ctor) {
            return null;
        }

        const recognition = new Ctor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            const finalChunks: string[] = [];
            const interimChunks: string[] = [];

            const startIndex = typeof event?.resultIndex === 'number' ? event.resultIndex : 0;
            const results = event?.results ?? [];

            for (let index = startIndex; index < results.length; index += 1) {
                const result = results[index];
                const candidate = String(result?.[0]?.transcript ?? '').trim();
                if (!candidate) {
                    continue;
                }

                if (result?.isFinal) {
                    finalChunks.push(candidate);
                } else {
                    interimChunks.push(candidate);
                }
            }

            if (finalChunks.length > 0) {
                finalTranscriptRef.current = [finalTranscriptRef.current, finalChunks.join(' ')]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
                setTranscript(finalTranscriptRef.current);
            }

            const previewTranscript = [finalTranscriptRef.current, interimChunks.join(' ')]
                .filter(Boolean)
                .join(' ')
                .trim();

            setLiveTranscript(previewTranscript);
        };

        recognition.onerror = (event) => {
            setError(mapRecognitionError(event?.error));
        };

        recognition.onend = () => {
            setIsListening(false);

            const stableTranscript = finalTranscriptRef.current.trim();
            setTranscript(stableTranscript);
            setLiveTranscript(stableTranscript);

            if (stopResolverRef.current) {
                stopResolverRef.current(stableTranscript);
                stopResolverRef.current = null;
            }
        };

        recognitionRef.current = recognition;
        return recognition;
    }, []);

    const startListening = useCallback((language: VoiceRecognitionLanguage) => {
        const recognition = ensureRecognition();

        if (!recognition) {
            setError({
                code: 'not-supported',
                message: 'Speech recognition is not supported in this browser.',
            });
            return;
        }

        if (isListening) {
            return;
        }

        setActiveLanguage(language);
        setError(null);
        recognition.lang = language;

        try {
            recognition.start();
        } catch {
            setError({
                code: 'unknown',
                message: 'Unable to start voice recognition.',
            });
        }
    }, [ensureRecognition, isListening]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;

        if (!recognition || !isListening) {
            const stableTranscript = finalTranscriptRef.current.trim();
            setTranscript(stableTranscript);
            setLiveTranscript(stableTranscript);
            return Promise.resolve(stableTranscript);
        }

        return new Promise<string>((resolve) => {
            stopResolverRef.current = resolve;

            try {
                recognition.stop();
            } catch {
                const stableTranscript = finalTranscriptRef.current.trim();
                setTranscript(stableTranscript);
                setLiveTranscript(stableTranscript);
                stopResolverRef.current = null;
                resolve(stableTranscript);
            }
        });
    }, [isListening]);

    useEffect(() => {
        return () => {
            if (!recognitionRef.current) {
                return;
            }

            recognitionRef.current.onstart = null;
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;

            try {
                recognitionRef.current.abort();
            } catch {
                // Ignore cleanup errors from already-closed recognition sessions.
            }
        };
    }, []);

    return {
        isSupported,
        isListening,
        transcript,
        liveTranscript,
        activeLanguage,
        error,
        clearError,
        resetTranscript,
        startListening,
        stopListening,
    };
}

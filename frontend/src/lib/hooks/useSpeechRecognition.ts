import { useState, useEffect, useCallback, useRef } from 'react';

// Extend window object to include speech recognition types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useSpeechRecognition() {
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [interimTranscript, setInterimTranscript] = useState<string>('');
    const [finalTranscript, setFinalTranscript] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                setIsSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let interimResult = '';
                    let finalResult = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalResult += event.results[i][0].transcript;
                        } else {
                            interimResult += event.results[i][0].transcript;
                        }
                    }

                    if (finalResult) {
                        setFinalTranscript((prev) => prev + finalResult);
                    }
                    setInterimTranscript(interimResult);
                };

                recognition.onerror = (event: any) => {
                    if (event.error === 'not-allowed') {
                        setError('Microphone permission denied.');
                    } else if (event.error !== 'aborted') {
                        setError(`Speech recognition error: ${event.error}`);
                    }
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const start = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setError(null);
            setInterimTranscript('');
            setFinalTranscript('');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Error starting recognition:', err);
                setError('Could not start recognition.');
                setIsListening(false);
            }
        }
    }, [isListening]);

    const stop = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const reset = useCallback(() => {
        setInterimTranscript('');
        setFinalTranscript('');
        setError(null);
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isSupported,
        isListening,
        interimTranscript,
        finalTranscript,
        start,
        stop,
        reset,
        error
    };
}

import { useRef, useState, useCallback } from "react";

export interface AudioClip {
    url: string;
    blob: Blob;
    timestamp: number;
    duration: number;
}

export function useAudioRecorder() {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [clips, setClips] = useState<AudioClip[]>([]);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const startRecording = useCallback(async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            streamRef.current = stream;
            chunksRef.current = [];
            startTimeRef.current = Date.now();

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/mp4";

            const recorder = new MediaRecorder(stream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

                setClips((prev) => [
                    ...prev,
                    {
                        url,
                        blob,
                        timestamp: startTimeRef.current,
                        duration,
                    },
                ]);

                chunksRef.current = [];
            };

            mediaRecorderRef.current = recorder;
            recorder.start(1000); // collect data every second
            setIsRecording(true);
            setPermissionDenied(false);
        } catch (err) {
            console.error("Microphone access denied:", err);
            setPermissionDenied(true);
        }
    }, [isRecording]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const downloadClip = useCallback((clip: AudioClip) => {
        const a = document.createElement("a");
        a.href = clip.url;
        const ext = clip.blob.type.includes("webm") ? "webm" : "m4a";
        a.download = `sos-recording-${new Date(clip.timestamp).toISOString().slice(0, 19)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, []);

    const clearClips = useCallback(() => {
        clips.forEach((clip) => URL.revokeObjectURL(clip.url));
        setClips([]);
    }, [clips]);

    return {
        isRecording,
        clips,
        permissionDenied,
        startRecording,
        stopRecording,
        downloadClip,
        clearClips,
    };
}

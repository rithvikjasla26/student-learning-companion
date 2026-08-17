import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob, duration: number) => void;
  onTranscription?: (transcript: string) => void;
  isUploading?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  onTranscription,
  isUploading = false,
}) => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const durationInterval = useRef<number | null>(null);

  // Request microphone permission on component mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        // Stop the test stream
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setHasPermission(false);
      }
    };

    checkPermission();

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunks.current = [];
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: 'audio/webm;codecs=opus',
        });
        onAudioRecorded(audioBlob, duration);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setDuration(0);

      // Track recording duration
      durationInterval.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
  };

  const resetRecording = () => {
    audioChunks.current = [];
    setDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-semibold">Microphone Access Required</p>
        <p className="text-red-700 text-sm mt-1">
          Please allow microphone access to use voice input. You can still use text input instead.
        </p>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600 text-sm">Checking microphone availability...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">🎤 Voice Input</h3>
        <span className="text-sm font-mono text-gray-600">{formatDuration(duration)}</span>
      </div>

      <div className="flex gap-3 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isUploading}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {duration > 0 ? 'Record Again' : 'Start Recording'}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Stop Recording
          </button>
        )}

        {duration > 0 && !isRecording && (
          <button
            onClick={resetRecording}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {duration > 0 && !isRecording && (
        <div className="p-3 bg-blue-100 border border-blue-300 rounded text-sm text-blue-800">
          ✓ Recording complete ({formatDuration(duration)})
          <p className="mt-2 text-blue-700">
            Click "Submit" to transcribe and evaluate your explanation.
          </p>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Recording in progress... Speak clearly and naturally.
        </div>
      )}

      {duration === 0 && (
        <div className="p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
          Click "Start Recording" to begin recording your explanation. You'll have the option
          to submit the audio or use text input instead.
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;

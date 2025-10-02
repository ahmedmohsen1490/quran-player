import React, { useState } from "react";
import { VoiceRecorder } from "capacitor-voice-recorder";

// Mic Icon
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 013 3v7a3 3 0 11-6 0V4a3 3 0 013-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v4m-4 0h8" />
  </svg>
);

// Stop Icon
const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
  </svg>
);

const PronunciationCoach: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      await VoiceRecorder.requestAudioRecordingPermission();
      await VoiceRecorder.startRecording();
      setRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();
      if (result.value && result.value.recordDataBase64) {
        const base64Sound = result.value.recordDataBase64;
        const audioUrl = `data:audio/wav;base64,${base64Sound}`;
        setAudioFile(audioUrl);
      }
      setRecording(false);
    } catch (err) {
      console.error("Error stopping recording:", err);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-bold mb-2">Pronunciation Coach</h2>

      {!recording ? (
        <button
          onClick={startRecording}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <MicIcon className="w-6 h-6 mr-2" /> Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <StopIcon className="w-6 h-6 mr-2" /> Stop Recording
        </button>
      )}

      {audioFile && (
        <div className="mt-4">
          <h3 className="font-semibold">Your Recording:</h3>
          <audio controls src={audioFile} className="mt-2 w-full" />
        </div>
      )}
    </div>
  );
};

export default PronunciationCoach;

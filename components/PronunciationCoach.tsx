import React, { useState, useRef, useEffect } from 'react';
import { Surah, Ayah } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { AudioRecorder } from '@capacitor-community/audio-recorder';

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 6v4" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6v4H9z" />
  </svg>
);

interface PronunciationCoachProps {
  isOpen: boolean;
  onClose: () => void;
  surah: Surah;
  ayah: Ayah;
  onRecitationSuccess: (surah: Surah, ayah: Ayah) => void;
}

type Status = 'idle' | 'recording' | 'analyzing' | 'feedback';

interface WordAnalysis {
  word: string;
  status: 'correct' | 'incorrect';
}
interface AnalysisFeedback {
  overallFeedback: string;
  wordAnalysis: WordAnalysis[];
  isRecitationCorrect: boolean;
}

const PronunciationCoach: React.FC<PronunciationCoachProps> = ({ isOpen, onClose, surah, ayah, onRecitationSuccess }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusRef = useRef(status);
  statusRef.current = status;

  const resetState = () => {
    setStatus('idle');
    setAudioFile(null);
    setAnalysis(null);
    setError(null);
  };

  const startRecording = async () => {
    try {
      resetState();
      setStatus('recording');
      await AudioRecorder.startRecording();
    } catch (err) {
      setError('تعذر بدء التسجيل. تأكد من تفعيل الأذونات.');
      setStatus('idle');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await AudioRecorder.stopRecording();
      setAudioFile(result.value);
      setStatus('analyzing');
      if (result.value) analyzeAudio(result.value);
    } catch (err) {
      setError('حدث خطأ أثناء إيقاف التسجيل.');
      setStatus('idle');
    }
  };

  const analyzeAudio = async (filePath: string) => {
    if (!process.env.API_KEY) {
      setError("لم يتم تكوين مفتاح API.");
      setStatus('idle');
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `أنت خبير في التجويد والنطق القرآني. مهمتك هي تحليل تلاوة المستخدم`;
      const prompt = `الآية الأصلية: "${ayah.text}"\nتلاوة المستخدم (ملف صوتي): "${filePath}"`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          overallFeedback: { type: Type.STRING },
          wordAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                status: { type: Type.STRING }
              },
              required: ['word', 'status']
            }
          },
          isRecitationCorrect: { type: Type.BOOLEAN }
        },
        required: ['overallFeedback', 'wordAnalysis', 'isRecitationCorrect']
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema }
      });

      const result: AnalysisFeedback = JSON.parse(response.text || '{}');
      setAnalysis(result);

      if (result.isRecitationCorrect) onRecitationSuccess(surah, ayah);
      setStatus('feedback');
    } catch (err) {
      setError("حدث خطأ أثناء تحليل التلاوة.");
      setStatus('idle');
    }
  };

  const handleButtonClick = () => {
    if (status === 'recording') stopRecording();
    else startRecording();
  };

  const renderButton = () => {
    const isRecording = status === 'recording';
    const isAnalyzing = status === 'analyzing';
    let buttonText = 'ابدأ التسجيل';
    if (status === 'feedback') buttonText = 'حاول مرة أخرى';
    if (isRecording) buttonText = 'إيقاف التسجيل';
    if (isAnalyzing) buttonText = 'جاري التحليل...';

    return (
      <button
        onClick={handleButtonClick}
        disabled={isAnalyzing}
        className={`font-bold py-3 px-8 rounded-full hover:opacity-90 focus:outline-none ${
          isRecording ? 'bg-red-500 text-white' : 'bg-primary text-white'
        }`}
      >
        {isRecording ? <StopIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        {buttonText}
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">مدرب النطق</h2>
          <button onClick={onClose} className="text-text-secondary text-3xl leading-none">&times;</button>
        </div>

        <div className="bg-background p-4 rounded-lg mb-4 text-center text-xl font-amiri-quran">{ayah.text}</div>

        <div className="min-h-[12rem] flex flex-col justify-center items-center p-2">
          {status === 'idle' && <p className="text-text-secondary text-center">اضغط على الزر لبدء تسجيل تلاوة</p>}
          {status === 'recording' && <p className="text-red-500 font-semibold">...جاري التسجيل</p>}
          {status === 'analyzing' && <p className="text-primary font-semibold">...جاري تحليل التلاوة</p>}
          {status === 'feedback' && analysis && (
            <div className="w-full text-right">
              <h3 className="font-semibold text-text-primary mb-2">تحليل التلاوة:</h3>
              <div className="bg-background p-3 rounded text-xl font-amiri-quran flex flex-wrap gap-2">
                {analysis.wordAnalysis.map((word, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <span>{word.word}</span>
                    {word.status === 'correct' ? <span className="text-green-500">✅</span> : <span className="text-yellow-500">⚠️</span>}
                  </span>
                ))}
              </div>
              {analysis.isRecitationCorrect && (
                <p className="text-center text-sm font-semibold text-green-600 mt-2">أحسنت! تمت إضافة هذه الآية لتقدمك في تحدي الختمة.</p>
              )}
            </div>
          )}
          {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col items-center">{renderButton()}</div>
      </div>
    </div>
  );
};

export default PronunciationCoach;

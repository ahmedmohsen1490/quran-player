import React, { useState, useRef, useEffect } from 'react';
import { Surah, Ayah } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

// Icons
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 6v4m0 0H9m4 0h2m-4-8a4 4 0 014-4h0a4 4 0 014 4v2m-8 0v2a4 4 0 004 4h0a4 4 0 004-4v-2" />
    </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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


declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const PronunciationCoach: React.FC<PronunciationCoachProps> = ({ isOpen, onClose, surah, ayah, onRecitationSuccess }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const resetState = () => {
    setStatus('idle');
    setUserTranscript('');
    setAnalysis(null);
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    resetState();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('متصفحك لا يدعم التعرف على الكلام. حاول استخدام Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setUserTranscript(transcript);
        setStatus('analyzing');
        getFeedbackFromAI(ayah.text, transcript);
      } else {
        setError('لم نتمكن من التعرف على أي كلام. يرجى المحاولة بصوت أوضح.');
        setStatus('idle');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      let errorMessage = 'حدث خطأ أثناء التعرف على الصوت.';
      if (event.error === 'no-speech') {
        errorMessage = 'لم يتم اكتشاف أي كلام. يرجى المحاولة مرة أخرى.';
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'تم رفض الوصول إلى الميكروفون. يرجى تفعيل الإذن في إعدادات المتصفح.';
      }
      setError(errorMessage);
      setStatus('idle');
    };

    recognition.onend = () => {
      // statusRef helps get the latest status inside this callback
      if (statusRef.current === 'recording') {
        setStatus('idle'); // Stop was not user-initiated, e.g., timeout
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isOpen, surah, ayah, onRecitationSuccess]);

  const getFeedbackFromAI = async (originalText: string, userText: string) => {
    if (!process.env.API_KEY) {
      setError("لم يتم تكوين مفتاح API. هذه الميزة غير متاحة.");
      setStatus('idle');
      return;
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `أنت خبير في التجويد والنطق القرآني. مهمتك هي تحليل تلاوة المستخدم (المقدمة كنص) مقابل النص العربي الأصلي لآية قرآنية. قدم تحليلاً كلمة بكلمة. يجب أن تكون الاستجابة فقط كائن JSON صالح يتوافق مع المخطط المقدم. لا تقم بتضمين أي علامات markdown أو أي نص خارج كائن JSON. يجب أن يحتوي حقل 'wordAnalysis' على كل كلمة من الآية الأصلية. يجب أن تكون قيمة 'isRecitationCorrect' صحيحة (true) فقط إذا كانت التلاوة مثالية أو بها أخطاء طفيفة جدًا لا تذكر. وإلا، يجب أن تكون خاطئة (false). يجب أن تكون جميع الملاحظات والتعليقات باللغة العربية الفصحى.`;
    const prompt = `الآية الأصلية: "${originalText}"\nتلاوة المستخدم (نصية): "${userText}"`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
          overallFeedback: {
            type: Type.STRING,
            description: "ملخص عام موجز باللغة العربية لجودة التلاوة والنقاط الرئيسية للتحسين."
          },
          wordAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "الكلمة الأصلية من الآية." },
                status: { type: Type.STRING, description: "يمكن أن تكون 'correct' أو 'incorrect'." }
              },
              required: ['word', 'status']
            }
          },
          isRecitationCorrect: {
            type: Type.BOOLEAN,
            description: "قيمة منطقية تشير إلى ما إذا كانت التلاوة الإجمالية تعتبر صحيحة بما يكفي لوضع علامة 'مكتملة'."
          }
        },
        required: ['overallFeedback', 'wordAnalysis', 'isRecitationCorrect']
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema },
      });

      const result: AnalysisFeedback = JSON.parse(response.text);
      setAnalysis(result);

      if (result.isRecitationCorrect) {
        onRecitationSuccess(surah, ayah);
      }
      setStatus('feedback');
    } catch (err) {
      console.error("Error with Gemini API:", err);
      setError("حدث خطأ أثناء تحليل التلاوة. حاول مرة أخرى.");
      setStatus('idle');
    }
  };

  const handleButtonClick = () => {
    if (status === 'recording') {
      recognitionRef.current?.stop();
      // onresult will handle status change
    } else {
      if (recognitionRef.current) {
        resetState();
        setStatus('recording');
        recognitionRef.current.start();
      } else {
        setError('ميزة التعرف على الكلام غير متاحة في هذا المتصفح.');
      }
    }
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
        className={`font-bold py-3 px-8 rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center gap-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecording ? 'bg-red-500 text-white focus:ring-red-500' : 'bg-primary text-white focus:ring-primary'
        }`}
      >
        {isRecording ? <StopIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        {buttonText}
      </button>
    );
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">مدرب النطق</h2>
          <button onClick={onClose} className="text-text-secondary text-3xl leading-none hover:text-text-primary">&times;</button>
        </div>

        <div className="bg-background p-4 rounded-lg mb-4">
          <p className="text-xl font-amiri-quran text-text-primary leading-loose text-center">{ayah.text}</p>
        </div>

        <div className="min-h-[12rem] flex flex-col justify-center items-center p-2">
          {status === 'idle' && (
            <p className="text-text-secondary text-center">اضغط على الزر لبدء تسجيل تلاوتك.</p>
          )}
          {status === 'recording' && (
            <div className="flex flex-col items-center gap-3 text-red-500">
              <div className="flex items-center gap-3 animate-pulse">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <p className="font-semibold">...جاري التسجيل</p>
              </div>
              <p className="text-sm text-text-secondary mt-2">انقر على "إيقاف التسجيل" عند الانتهاء.</p>
            </div>
          )}
          {status === 'analyzing' && (
            <div className="flex flex-col items-center gap-3 text-primary">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
               <p className="font-semibold">...جاري تحليل التلاوة</p>
            </div>
          )}
          {status === 'feedback' && analysis && (
            <div className="w-full text-right animate-fade-in">
                <h3 className="font-semibold text-text-primary mb-2">تحليل التلاوة:</h3>
                <div className="bg-background p-3 rounded text-xl font-amiri-quran flex flex-wrap-reverse justify-center items-center gap-x-2 gap-y-4" dir="rtl">
                    {analysis.wordAnalysis.map((word, index) => (
                    <span key={index} className="flex items-center gap-1">
                        <span>{word.word}</span>
                        {word.status === 'correct' ? (
                        <span className="text-green-500" title="صحيح">✅</span>
                        ) : (
                        <span className="text-yellow-500" title="بحاجة إلى تحسين">⚠️</span>
                        )}
                    </span>
                    ))}
                </div>

                <h3 className="font-semibold text-text-primary mt-4 mb-2">ملاحظات المدرب:</h3>
                <p className="bg-background p-3 rounded whitespace-pre-wrap leading-relaxed">{analysis.overallFeedback}</p>
                {analysis.isRecitationCorrect && (
                    <p className="text-center text-sm font-semibold text-green-600 dark:text-green-400 bg-green-500/10 p-2 rounded-md mt-3">
                        أحسنت! تمت إضافة هذه الآية لتقدمك في تحدي الختمة.
                    </p>
                )}
            </div>
          )}
           {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col items-center">
            {renderButton()}
        </div>
      </div>
    </div>
  );
};

export default PronunciationCoach;
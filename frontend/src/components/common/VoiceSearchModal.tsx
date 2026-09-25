import React, { useState, useEffect } from 'react';
import { Mic, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceResult?: (text: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({ isOpen, onClose, onVoiceResult }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setError(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice search is not supported by your current browser. You can type your search directly.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else {
          setError(`Voice input error: ${event.error}. Please try again or type your query.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();

      return () => {
        recognition.abort();
      };
    } catch (e: any) {
      setError('Could not initialize microphone. Please check browser permissions.');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessQuery = (textToUse?: string) => {
    const query = (textToUse || transcript).trim();
    if (!query) return;

    if (onVoiceResult) {
      onVoiceResult(query);
      onClose();
      return;
    }

    // Auto-parse voice commands:
    // e.g. "Search train 22956" -> /search?q=22956
    // "Boisar to Dahanu" -> /trains-between?from=BOR&to=DRD
    const trainMatch = query.match(/(\d{4,5})/);
    if (trainMatch) {
      navigate(`/train/${trainMatch[1]}`);
      onClose();
      return;
    }

    const toMatch = query.match(/(?:from\s+)?([a-z\s]+)\s+to\s+([a-z\s]+)/i);
    if (toMatch) {
      const from = toMatch[1].trim();
      const to = toMatch[2].trim();
      navigate(`/trains-between?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      onClose();
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-2">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            )}
            <Mic className={`w-9 h-9 ${isListening ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isListening ? 'Listening...' : 'Voice Search'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Say train number, name, or route like "Boisar to Dahanu"
          </p>
        </div>

        {transcript && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 min-h-[48px] flex items-center justify-center">
            "{transcript}"
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs text-left border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Voice Prompts */}
        <div className="space-y-1.5 text-left">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Try saying:</span>
          <div className="flex flex-wrap gap-2">
            {[
              'Search train 22956',
              'Boisar to Dahanu Road',
              '19417 Borivali Vatva',
              'Surat to Mumbai Central',
            ].map((sample) => (
              <button
                key={sample}
                onClick={() => handleProcessQuery(sample)}
                className="text-xs py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

        {transcript && (
          <button
            onClick={() => handleProcessQuery()}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
          >
            Search for "{transcript}"
          </button>
        )}
      </div>
    </div>
  );
};

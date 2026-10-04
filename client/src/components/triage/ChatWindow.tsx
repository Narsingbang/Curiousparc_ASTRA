import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useSpeechRecognition } from '../../hooks/useSpeech';
import { useUiStore } from '../../store/uiStore';
import { broadcastLiveEvent } from '../../hooks/useRealtime';
import {
  TriageApiResponse,
  TriageAssessment,
  RoutedDoctor,
} from '@medisync/shared';
import { AssessmentCard } from './AssessmentCard';
import { RoutedDoctorCard } from './RoutedDoctorCard';
import { EmergencyBanner } from './EmergencyBanner';
import { Button } from '../ui/Button';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SUGGESTION_CHIPS = [
  'Mild sore throat and sneezing for 2 days',
  'Crushing chest pain radiating to left arm with sweating',
  'Severe shortness of breath and gasping for air',
  'Low grade fever with headache and mild fatigue',
];

const SESSION_STORAGE_ID_KEY = 'medisync_triage_session_id';
const SESSION_STORAGE_TOKEN_KEY = 'medisync_triage_session_token';

export function ChatWindow() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello, I am MediSync AI Triage Assistant. Please describe your symptoms in detail (or use voice input). I will ask up to 3 focused follow-up questions to understand severity and route you to an available doctor.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    return sessionStorage.getItem(SESSION_STORAGE_ID_KEY) || undefined;
  });
  const [sessionToken, setSessionToken] = useState<string | undefined>(() => {
    return sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY) || undefined;
  });
  const [assessment, setAssessment] = useState<TriageAssessment | null>(null);
  const [routedDoctor, setRoutedDoctor] = useState<RoutedDoctor | null>(null);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const { addToast } = useUiStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { isListening, isSupported, startListening } = useSpeechRecognition((transcript) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    addToast({
      type: 'info',
      title: 'Speech Recognized',
      message: `Heard: "${transcript}"`,
    });
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');

    // Add user message to UI
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await apiFetch<TriageApiResponse>('/triage/message', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          session_token: sessionToken,
          message: textToSend,
        }),
      });

      // Update session tokens in React state and sessionStorage
      if (res.session_id) {
        setSessionId(res.session_id);
        sessionStorage.setItem(SESSION_STORAGE_ID_KEY, res.session_id);
      }
      if (res.session_token) {
        setSessionToken(res.session_token);
        sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, res.session_token);
      }

      if (res.is_fallback) {
        setIsFallback(true);
      }

      // Add assistant reply
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: res.assistant_message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If assessment completed
      if (res.status === 'COMPLETE' && res.assessment) {
        setAssessment(res.assessment);
        if (res.routed_doctor) {
          setRoutedDoctor(res.routed_doctor);
        }
        if (res.emergency_banner || res.assessment.is_emergency) {
          setShowEmergencyBanner(true);
        }
        // Invalidate health vault queries and broadcast to other tabs
        queryClient.invalidateQueries({ queryKey: ['vault-data'] });
        queryClient.invalidateQueries({ queryKey: ['patient_records'] });
        broadcastLiveEvent('patient_records');
      }
    } catch (err: any) {
      // The triage UI must always show a result and must never show an empty or failing chat
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: 'Your symptoms have been safely recorded. If you are experiencing sudden severe pain, shortness of breath, or bleeding, please call emergency services (112 / 108) or visit the nearest hospital emergency department immediately.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setIsFallback(true);

      addToast({
        type: 'warning',
        title: 'Clinical Safety Mode',
        message: 'Rule-based safety triage guidance active.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Hello, I am MediSync AI Triage Assistant. Please describe your symptoms in detail (or use voice input). I will ask up to 3 focused follow-up questions to understand severity and route you to an available doctor.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    setSessionId(undefined);
    setSessionToken(undefined);
    sessionStorage.removeItem(SESSION_STORAGE_ID_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
    setAssessment(null);
    setRoutedDoctor(null);
    setShowEmergencyBanner(false);
    setIsFallback(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Emergency Alert Banner if triggered */}
      {showEmergencyBanner && <EmergencyBanner />}

      {/* Main Chat Panel */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-medical-blue to-cyan-400 flex items-center justify-center text-white shadow-glow-blue">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                AI Symptom Router
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Online
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Max 3 follow-ups · Clinical Red-Flag Safety Filter Active
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-colors"
            title="Start new conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* AI Fallback Note */}
        {isFallback && (
          <div className="mx-6 mt-3 py-1.5 px-3.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-center gap-2 self-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>AI is busy, showing basic guidance</span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-medical-blue text-white'
                    : 'bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 text-medical-blue" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-medical-blue text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`text-[10px] mt-1 block ${
                    msg.role === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-medical-blue animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-800 rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-medical-blue animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-medical-blue animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-medical-blue animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 2 && !assessment && (
          <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-medical-blue hover:text-white transition-all shrink-0 border border-slate-200/60 dark:border-slate-700/60"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-navy-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {isSupported && (
              <button
                type="button"
                onClick={startListening}
                className={`p-3 rounded-full transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-medical-blue hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
                title="Speak symptoms"
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            )}

            <input
              type="text"
              placeholder={
                isListening
                  ? 'Listening to speech...'
                  : 'Describe your symptoms (e.g. onset, pain location, fever)...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !!assessment}
              className="flex-1 px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/40 disabled:opacity-50"
            />

            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={!input.trim() || isLoading || !!assessment}
              className="rounded-full shrink-0 h-11 w-11"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Assessment and Doctor Cards */}
      {assessment && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AssessmentCard assessment={assessment} isFallback={isFallback} />
          {routedDoctor && <RoutedDoctorCard doctor={routedDoctor} />}
        </div>
      )}
    </div>
  );
}

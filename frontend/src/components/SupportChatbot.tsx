import React, { useEffect, useState } from 'react';
import { X, Send, HeartHandshake, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supportCoachAPI } from '@/lib/api';

type Message = {
  id: string;
  author: 'bot' | 'parent';
  content: string;
  timestamp: Date;
  focusTag?: string;
};

interface SupportChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  parentName?: string;
}

type SupportCoachSession = {
  greeting: string;
  status: string;
  focus?: string;
  quick_replies?: string[];
  reminders?: string[];
};

type SupportCoachReply = {
  message: string;
  supportive_phrase?: string;
  grounding_tip?: string;
  repair_prompt?: string;
  quick_replies?: string[];
  focus?: string;
  suggested_next_step?: string;
};

const formatCoachResponse = (payload: SupportCoachReply): string => {
  const segments = [
    payload.message,
    payload.supportive_phrase,
    payload.repair_prompt,
    payload.grounding_tip ? `Grounding idea: ${payload.grounding_tip}` : undefined,
    payload.suggested_next_step ? `Next tiny step: ${payload.suggested_next_step}` : undefined,
  ].filter(Boolean) as string[];

  return segments.join('\n\n');
};

const SupportChatbot: React.FC<SupportChatbotProps> = ({ isOpen, onClose, parentName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [coachStatus, setCoachStatus] = useState('Checking availability…');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [reminders, setReminders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setDraft('');
      setQuickReplies([]);
      setSessionReady(false);
      setReminders([]);
      setError(null);
      setCoachStatus('Checking availability…');
      return;
    }

    let isCancelled = false;

    const bootstrap = async () => {
      setIsThinking(true);
      setError(null);
      try {
        const session: SupportCoachSession = await supportCoachAPI.startSession(parentName);
        if (isCancelled) {
          return;
        }

        setMessages([
          {
            id: crypto.randomUUID(),
            author: 'bot',
            content: session.greeting,
            timestamp: new Date(),
            focusTag: session.focus,
          },
        ]);
        setCoachStatus(session.status);
        setQuickReplies(session.quick_replies ?? []);
        setReminders(session.reminders ?? []);
        setSessionReady(true);
      } catch (err) {
        if (!isCancelled) {
          setError('Bridge-it is offline right now. Please try again soon.');
        }
      } finally {
        if (!isCancelled) {
          setIsThinking(false);
        }
      }
    };

    bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, parentName]);

  const handleSend = async (overrideContent?: string) => {
    const content = (overrideContent ?? draft).trim();
    if (!content || isThinking || !sessionReady) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      author: 'parent',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft('');
    setIsThinking(true);
    setError(null);

    try {
      const response: SupportCoachReply = await supportCoachAPI.sendMessage({
        message: content,
        parentName,
      });

      const botResponse: Message = {
        id: crypto.randomUUID(),
        author: 'bot',
        content: formatCoachResponse(response),
        timestamp: new Date(),
        focusTag: response.focus,
      };

      setMessages((prev) => [...prev, botResponse]);
      setQuickReplies(response.quick_replies ?? []);
    } catch (err) {
      setError('Unable to get a response. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/10">
      <div className="mb-6 mr-6 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 text-white">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Bridgette Support Coach</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{coachStatus}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {reminders.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {reminders.map((reminder) => (
                <p key={reminder}>{reminder}</p>
              ))}
            </div>
          )}
        </div>

        {quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="rounded-full border border-slate-200 px-3 py-1 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.author === 'parent' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.author === 'parent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                )}
              >
                {message.focusTag && message.author === 'bot' && (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    {message.focusTag}
                  </p>
                )}
                {message.content.split('\n').map((line, index) => (
                  <p key={`${message.id}-${index}`} className="mb-1 last:mb-0">
                    {line}
                  </p>
                ))}
                <p className="mt-2 text-[11px] opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Crafting a thoughtful response...
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          {error && <p className="mb-2 text-xs text-rose-500">{error}</p>}
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share how you're feeling or what happened…"
            className="mb-3 resize-none"
            rows={3}
            disabled={!sessionReady || isThinking}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              <span>Conversations stay private on your device.</span>
            </div>
            <Button size="sm" onClick={() => handleSend()} disabled={!draft.trim() || !sessionReady || isThinking}>
              Send
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          This AI coach offers emotional guidance, not legal or medical advice. If you feel unsafe or overwhelmed, reach
          out to a trusted professional or emergency services.
        </div>
      </div>
    </div>
  );
};

export default SupportChatbot;


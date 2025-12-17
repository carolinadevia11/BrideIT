import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IncomingCallAlertProps {
  callerName: string;
  callType?: 'video' | 'audio';
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallAlert: React.FC<IncomingCallAlertProps> = ({
  callerName,
  callType = 'video',
  onAccept,
  onDecline,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play sound on mount
  useEffect(() => {
    const playRingtone = () => {
        try {
            // Create context synchronously to ensure ref is populated
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            
            const createRing = (time: number) => {
                // Check if context is still active (not closed)
                if (ctx.state === 'closed') return;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, time);
                osc.frequency.setValueAtTime(600, time + 0.1);
                
                gain.gain.setValueAtTime(0.1, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
                
                osc.start(time);
                osc.stop(time + 0.4);
            };

            // Play a pattern: Ring... Ring...
            const now = ctx.currentTime;
            for (let i = 0; i < 15; i++) { // Ring for about 30 seconds
                const offset = i * 2.0;
                createRing(now + offset);
                createRing(now + offset + 0.5);
            }
            
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    playRingtone();

    // Auto-decline after 30 seconds
    const timeoutId = setTimeout(() => {
        onDecline();
    }, 30000);

    return () => {
       // Robust cleanup
       if (audioContextRef.current) {
           audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
           audioContextRef.current = null;
       }
       clearTimeout(timeoutId);
    };
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pointer-events-none">
      <div className="pointer-events-auto animate-in slide-in-from-top-5 fade-in duration-300">
        <Card className="w-80 shadow-2xl border-t-4 border-t-bridge-blue bg-white/95 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col items-center space-y-4">
            <div className="relative">
              <span className="absolute inset-0 rounded-full animate-ping bg-bridge-blue opacity-30"></span>
              <div className="relative bg-bridge-blue/10 p-4 rounded-full">
                {callType === 'video' ? (
                  <Video className="w-8 h-8 text-bridge-blue" />
                ) : (
                  <Phone className="w-8 h-8 text-bridge-blue" />
                )}
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-lg text-gray-900">
                Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
              </h3>
              <p className="text-sm text-gray-500 font-medium">{callerName}</p>
            </div>

            <div className="flex gap-4 w-full pt-2">
              <Button
                variant="destructive"
                className="flex-1 rounded-full h-12 bg-bridge-red hover:bg-red-700 shadow-md transition-transform active:scale-95"
                onClick={onDecline}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
              <Button
                variant="default"
                className="flex-1 rounded-full h-12 bg-bridge-green hover:bg-emerald-700 shadow-md animate-pulse transition-transform active:scale-95"
                onClick={onAccept}
              >
                <Phone className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomingCallAlert;
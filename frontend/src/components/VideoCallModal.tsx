import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  ConnectionState,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Loader2, Video, Mic, MicOff, Camera, CameraOff, PhoneOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { messagingAPI } from '@/lib/api';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  username: string;
  isVideo?: boolean;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  roomName,
  username,
  isVideo = true,
}) => {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && roomName && username) {
      const fetchToken = async () => {
        try {
          console.log('[VideoCallModal] Fetching token. Type:', isVideo ? 'video' : 'audio');
          const data = await messagingAPI.getLiveKitToken(roomName, username, isVideo ? 'video' : 'audio');
          setToken(data.token);
        } catch (e: any) {
          console.error('Error fetching token:', e);
          setError(e.message || 'Failed to connect to video service');
        }
      };
      fetchToken();
    } else {
       setToken('');
       setError('');
    }
  }, [isOpen, roomName, username, isVideo]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-white shadow-2xl rounded-2xl">
        {!token ? (
           <div className="flex flex-col items-center justify-center h-full space-y-6">
             {error ? (
                <div className="text-center space-y-4">
                  <div className="bg-red-500/10 p-4 rounded-full inline-block">
                    <Video className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-400 font-medium">{error}</p>
                  <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
             ) : (
                <div className="text-center space-y-4">
                   <div className="relative">
                     <div className="absolute inset-0 bg-bridge-blue blur-xl opacity-20 animate-pulse rounded-full"></div>
                     <Loader2 className="w-10 h-10 animate-spin text-bridge-blue relative z-10" />
                   </div>
                  <p className="text-zinc-400 animate-pulse">Connecting securely...</p>
                </div>
             )}
           </div>
        ) : (
          <LiveKitRoom
            video={isVideo}
            audio={true}
            token={token}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://bridge-it-q38k4k20.livekit.cloud'}
            data-lk-theme="default"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            onDisconnected={onClose}
          >
            {/* Header */}
            <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-bridge-green animate-pulse"></div>
                <span className="font-medium text-sm text-zinc-300">
                  Secure {isVideo ? 'Video' : 'Voice'} Call
                </span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                {isVideo ? <Video className="w-3.5 h-3.5" /> : <PhoneOff className="w-3.5 h-3.5" />}
                <span>Bridge-It {isVideo ? 'Video' : 'Voice'}</span>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 relative bg-zinc-950 flex items-center justify-center">
               {isVideo ? (
                 <MyVideoConference />
               ) : (
                 <div className="flex flex-col items-center space-y-4 animate-pulse">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                      <Users className="w-10 h-10 text-zinc-500" />
                    </div>
                    <p className="text-zinc-400">Voice Call in Progress...</p>
                 </div>
               )}
            </div>
            
            {/* Audio Renderer for Sound */}
            <RoomAudioRenderer />
            
            {/* Status Overlay */}
            <CallStatusOverlay />

            {/* Controls */}
            <div className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 flex justify-center">
               <ControlBar variation="minimal" controls={{ screenShare: false, camera: isVideo }} />
            </div>
          </LiveKitRoom>
        )}
      </DialogContent>
    </Dialog>
  );
};

function CallStatusOverlay() {
  const participants = useParticipants();
  
  // Show waiting message if only 1 participant (the current user) is in the room
  if (participants.length > 1) return null;

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
       <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full flex items-center space-x-3 shadow-xl">
         <div className="flex space-x-1">
           <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
           <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
           <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
         </div>
         <span className="text-white text-sm font-medium">Waiting for answer...</span>
       </div>
    </div>
  );
}

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout
      tracks={tracks}
      style={{ height: '100%' }}
    >
      {/* We can customize the participant tile to force audio-only for specific scenarios if needed,
          but LiveKit handles video/audio tracks automatically based on what is published.
          If video is disabled in the LiveKitRoom config (via video={isVideo} prop),
          the camera track won't be published, so this grid will just show audio placeholders.
      */}
      <ParticipantTile />
    </GridLayout>
  );
}

export default VideoCallModal;
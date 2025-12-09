import React from 'react';
import { Scale, Heart, Sparkles } from 'lucide-react';

interface BridgetteAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  expression?: 'balanced' | 'thinking' | 'encouraging';
  showSpeechBubble?: boolean;
  message?: string;
}

const BridgetteAvatar: React.FC<BridgetteAvatarProps> = ({ 
  size = 'md', 
  expression = 'balanced',
  showSpeechBubble = false,
  message = "I'm here to help keep things fair and balanced!"
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const animationClasses = {
    balanced: 'hover:scale-105',
    thinking: 'hover:scale-105',
    encouraging: 'hover:scale-105'
  };

  return (
    <div className="relative flex flex-col items-center">
      {showSpeechBubble && (
        <div className="mb-2 bg-white rounded-2xl px-4 py-2 shadow-lg border-2 border-bridge-blue relative">
          <p className="text-sm text-bridge-black font-medium">{message}</p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-bridge-blue"></div>
          </div>
        </div>
      )}
      
      <div className={`${sizeClasses[size]} relative`}>
        {/* Main Avatar Image */}
        <img 
          src="/bridgette-avatar.png" 
          alt="Bridge-it" 
          className={`${sizeClasses[size]} rounded-full shadow-lg border-4 border-white ${animationClasses[expression]} transition-transform duration-300`}
          onError={(e) => {
            // Fallback to emoji design if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        
        {/* Fallback Emoji Design (hidden by default) */}
        <div 
          className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-200 to-bridge-yellow rounded-full shadow-lg relative overflow-hidden border-4 border-bridge-blue ${animationClasses[expression]} transition-transform duration-300`}
          style={{ display: 'none' }}
        >
          {/* Sparkle effects */}
          <Sparkles className="absolute top-1 right-1 w-3 h-3 text-bridge-blue opacity-80 animate-pulse" />
          
          {/* Blindfold - Justice theme */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-bridge-blue rounded-full shadow-md border border-blue-800"></div>
          
          {/* Eyes behind blindfold (barely visible) */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-20">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          </div>
          
          {/* Big Happy Smile */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1 animate-pulse">
            <div className="w-8 h-4 border-4 border-bridge-black border-t-transparent rounded-b-full bg-transparent"></div>
          </div>
          
          {/* Rosy Cheeks */}
          <div className="absolute top-2/5 left-2 w-3 h-3 bg-pink-300 rounded-full opacity-60"></div>
          <div className="absolute top-2/5 right-2 w-3 h-3 bg-pink-300 rounded-full opacity-60"></div>
          
          {/* Mini Justice Scales as Hair Accessory */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
            <Scale className="w-3 h-3 text-bridge-blue" />
          </div>
          
          {/* Heart indicator for compassion */}
          <Heart className="w-2 h-2 text-bridge-red absolute bottom-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
        </div>
        
        {/* Balance indicator lights around the avatar */}
        <div className="absolute -top-1 left-2">
          <div className="w-1 h-1 bg-bridge-green rounded-full animate-pulse"></div>
        </div>
        <div className="absolute -top-1 right-2">
          <div className="w-1 h-1 bg-bridge-red rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        <div className="absolute top-1/2 -left-1">
          <div className="w-1 h-1 bg-bridge-blue rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="absolute top-1/2 -right-1">
          <div className="w-1 h-1 bg-bridge-yellow rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default BridgetteAvatar;
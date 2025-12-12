import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Scale, Star } from 'lucide-react';

interface AnimatedBridgetteProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  expression?: 'balanced' | 'thinking' | 'encouraging' | 'celebrating' | 'mediating' | 'happy' | 'waving';
  animation?: 'bounce' | 'float' | 'balance' | 'celebrate' | 'thinking' | 'idle';
  showSpeechBubble?: boolean;
  message?: string;
  position?: 'center' | 'left' | 'right';
  bubblePosition?: 'top' | 'bottom';
}

const AnimatedBridgette: React.FC<AnimatedBridgetteProps> = ({
  size = 'lg',
  expression = 'balanced',
  animation = 'float',
  showSpeechBubble = false,
  message = "I'm here to help keep things fair and balanced!",
  position = 'center',
  bubblePosition = 'top'
}) => {
  const [currentAnimation, setCurrentAnimation] = useState(animation);
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number}>>([]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const positionClasses = {
    center: 'mx-auto',
    left: 'mr-auto',
    right: 'ml-auto'
  };

  const animationClasses = {
    bounce: 'animate-bounce',
    float: 'animate-float',
    balance: 'animate-gentle-bounce',
    celebrate: 'animate-bounce',
    thinking: 'animate-breathe',
    idle: 'animate-breathe'
  };

  // Generate sparkles for celebration
  useEffect(() => {
    if (expression === 'celebrating') {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setSparkles(newSparkles);
    }
  }, [expression]);

  // Change animation based on expression
  useEffect(() => {
    setCurrentAnimation(animation);
  }, [animation]);

  return (
    <div className={`relative flex flex-col items-center ${positionClasses[position]}`}>
      {/* Main Avatar Container */}
      <div className={`${sizeClasses[size]} relative ${animationClasses[currentAnimation]}`}>
        {/* Speech Bubble */}
        {showSpeechBubble && (
          <div className={`absolute ${bubblePosition === 'top' ? 'bottom-[90%]' : 'top-[90%]'} left-1/2 transform -translate-x-1/2 w-48 z-50 animate-in fade-in zoom-in duration-300`}>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-xl border-2 border-bridge-blue relative">
              <p className="text-xs font-medium text-bridge-black text-center leading-snug">{message}</p>
              {/* Tail */}
              <div className={`absolute ${bubblePosition === 'top' ? '-bottom-2' : '-top-2'} left-1/2 transform -translate-x-1/2`}>
                <div className={`w-4 h-4 bg-white ${bubblePosition === 'top' ? 'border-r-2 border-b-2' : 'border-l-2 border-t-2'} border-bridge-blue transform rotate-45`}></div>
              </div>
            </div>
          </div>
        )}

        {/* Sparkles for celebration */}
        {expression === 'celebrating' && sparkles.map((sparkle) => (
          <Sparkles 
            key={sparkle.id}
            className="absolute w-4 h-4 text-bridge-yellow animate-ping"
            style={{ 
              left: `${sparkle.x}%`, 
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.id * 0.2}s`
            }}
          />
        ))}

        {/* Main Avatar Image */}
        <img 
          src="/bridgette-avatar.png" 
          alt="Bridge-it" 
          className={`${sizeClasses[size]} rounded-full shadow-2xl border-4 border-white hover:scale-105 transition-transform duration-300`}
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
          className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-200 via-bridge-yellow to-yellow-400 rounded-full shadow-2xl relative overflow-hidden transform transition-all duration-300 hover:scale-105 border-4 border-bridge-blue`}
          style={{ display: 'none' }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
          
          {/* Decorative sparkles */}
          <div className="absolute top-3 right-3">
            <div className="w-2 h-2 bg-bridge-blue rounded-full animate-pulse"></div>
          </div>
          <div className="absolute top-6 left-3">
            <div className="w-1 h-1 bg-bridge-red rounded-full animate-ping"></div>
          </div>

          {/* Justice Blindfold - Bright Blue */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-bridge-blue rounded-full shadow-lg border-2 border-blue-800">
            <div className="absolute inset-1 bg-blue-400 rounded-full opacity-60"></div>
          </div>
          
          {/* Eyes behind blindfold (barely visible for justice theme) */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 flex space-x-4 opacity-15">
            <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
          </div>
          
          {/* Big Happy Smile */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-2 animate-pulse">
            <div className="w-12 h-6 border-4 border-bridge-black border-t-transparent rounded-b-full bg-transparent shadow-sm"></div>
          </div>
          
          {/* Rosy Cheeks */}
          <div className="absolute top-2/5 left-3 w-4 h-4 bg-pink-300 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute top-2/5 right-3 w-4 h-4 bg-pink-300 rounded-full opacity-70 animate-pulse" style={{animationDelay: '0.3s'}}></div>
          
          {/* Justice Scales as Crown/Hair Accessory */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <Scale className="w-6 h-6 text-bridge-blue animate-pulse shadow-lg drop-shadow-md" />
            {expression === 'thinking' && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Star className="w-4 h-4 text-bridge-yellow animate-spin" />
              </div>
            )}
          </div>

          {/* Heart indicator for compassion */}
          <Heart className="w-4 h-4 text-bridge-red absolute bottom-3 left-1/2 transform -translate-x-1/2 animate-pulse" />
        </div>

        {/* Balance indicator lights around the avatar */}
        <div className="absolute -top-4 -left-4 w-3 h-3 bg-bridge-green rounded-full animate-bounce opacity-80" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute -top-2 -right-6 w-2 h-2 bg-bridge-blue rounded-full animate-bounce opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-4 -right-4 w-4 h-4 bg-bridge-red rounded-full animate-bounce opacity-80" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 -left-6 w-2 h-2 bg-bridge-yellow rounded-full animate-bounce opacity-80" style={{animationDelay: '2s'}}></div>
      </div>

    </div>
  );
};

export default AnimatedBridgette;
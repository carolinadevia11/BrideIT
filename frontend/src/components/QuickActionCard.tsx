import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'red' | 'yellow' | 'blue' | 'green' | 'black';
  onClick: () => void;
  badge?: string;
  urgent?: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  badge,
  urgent = false
}) => {
  const styles = {
    red: {
      container: 'bg-white border-2 border-bridge-red hover:bg-bridge-red/10 hover:border-bridge-red/80',
      title: 'text-bridge-red',
      icon: 'text-bridge-red',
      description: 'text-gray-600'
    },
    yellow: {
      container: 'bg-white border-2 border-bridge-yellow hover:bg-bridge-yellow/20 hover:border-bridge-yellow/80',
      title: 'text-bridge-yellow-dark',
      icon: 'text-bridge-yellow-dark',
      description: 'text-gray-600'
    },
    blue: {
      container: 'bg-white border-2 border-bridge-blue hover:bg-bridge-blue/10 hover:border-bridge-blue/80',
      title: 'text-bridge-blue',
      icon: 'text-bridge-blue',
      description: 'text-gray-600'
    },
    green: {
      container: 'bg-white border-2 border-bridge-green hover:bg-bridge-green/10 hover:border-bridge-green/80',
      title: 'text-bridge-green',
      icon: 'text-bridge-green',
      description: 'text-gray-600'
    },
    black: {
      container: 'bg-white border-2 border-bridge-black hover:bg-gray-100 hover:border-bridge-black/80',
      title: 'text-bridge-black',
      icon: 'text-bridge-black',
      description: 'text-gray-600'
    }
  };

  const currentStyle = styles[color];

  return (
    <button
      onClick={onClick}
      className={`relative w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl ${currentStyle.container} shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left group`}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-bridge-red text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          {badge}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold text-base sm:text-lg mb-1 ${currentStyle.title}`}>{title}</h3>
          <p className={`${currentStyle.description} text-xs sm:text-sm`}>{description}</p>
        </div>
        <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${currentStyle.icon} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      
      {urgent && (
        <div className="absolute bottom-2 right-2">
          <div className="w-2 h-2 bg-bridge-yellow rounded-full animate-ping"></div>
        </div>
      )}
    </button>
  );
};

export default QuickActionCard;
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
  const colorClasses = {
    red: 'bg-bridge-red hover:shadow-red-200',
    yellow: 'bg-bridge-yellow hover:shadow-yellow-200 text-black',
    blue: 'bg-bridge-blue hover:shadow-blue-200',
    green: 'bg-bridge-green hover:shadow-green-200',
    black: 'bg-bridge-black hover:shadow-gray-400'
  };

  const textColor = color === 'yellow' ? 'text-black' : 'text-white';

  return (
    <button
      onClick={onClick}
      className={`relative w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl ${colorClasses[color]} ${textColor} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-left group`}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-bridge-red text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          {badge}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-base sm:text-lg mb-1">{title}</h3>
          <p className={`${color === 'yellow' ? 'text-gray-800' : 'text-white/90'} text-xs sm:text-sm`}>{description}</p>
        </div>
        <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${color === 'yellow' ? 'text-gray-800' : 'text-white/90'} group-hover:scale-110 transition-transform duration-200`} />
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
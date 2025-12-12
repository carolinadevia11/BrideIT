import React from 'react';
import { Trophy, Star } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0-100
  title: string;
  subtitle?: string;
  showTrophy?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  title, 
  subtitle,
  showTrophy = false 
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {showTrophy && progress === 100 && (
          <Trophy className="w-6 h-6 text-yellow-500" />
        )}
        {progress > 0 && progress < 100 && (
          <Star className="w-5 h-5 text-blue-500" />
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-bridge-green rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {progress > 20 && (
            <div className="h-full w-full bg-white bg-opacity-20 animate-pulse"></div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-600">{progress}% Complete</span>
        {progress === 100 && (
          <span className="text-sm font-medium text-green-600">✨ Completed!</span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
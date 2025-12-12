import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { HelpCircle, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductTourProps {
  run: boolean;
  onComplete: () => void;
}

const ProductTour: React.FC<ProductTourProps> = ({ run, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const [steps] = useState<Step[]>([
    {
      target: '[data-tour="dashboard-welcome"]',
      title: '👋 Welcome to Bridge-it!',
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            This is your dashboard - your central hub for managing co-parenting. Here you'll see your personalized welcome message, upcoming events, and quick access to everything you need.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded-r-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Pro Tip:</strong> Bridge-it keeps everything organized and transparent between co-parents to reduce conflict.
            </p>
          </div>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
      disableOverlayClose: true,
      spotlightClicks: false,
      disableScrolling: false,
    },
    {
      target: '[data-tour="navigation-tabs"]',
      title: '🗺️ Main Navigation',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Use these tabs to navigate between Dashboard, Calendar, Messages, Expenses, Documents, and Resources. Each section is designed to help you manage different aspects of co-parenting.
          </p>
          <p className="text-sm text-gray-600">
            Click any tab to explore that section. The active tab is highlighted in color.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="calendar-tab"]',
      title: '📅 Calendar Tab',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            The Calendar helps you manage shared custody schedules, school events, medical appointments, and important dates. Both parents can view and update the calendar in real-time.
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
            <li>View and manage custody schedules</li>
            <li>Add school and medical events</li>
            <li>See upcoming important dates</li>
            <li>Export calendar for court records</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="messages-tab"]',
      title: '💬 Messages Tab',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Communicate with your co-parent in an organized way. All messages are timestamped and documented, which can be helpful for legal purposes if needed.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg">
            <p className="text-sm text-yellow-800">
              <strong>📝 Documented:</strong> All conversations are stored as part of your audit trail.
            </p>
          </div>
        </div>
      ),
      placement: 'bottom',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="expenses-tab"]',
      title: '💰 Expenses Tab',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Track and split expenses fairly with your co-parent. Add receipts, categorize expenses, and see who owes what with automatic calculations based on your custody arrangement.
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
            <li>Add expenses with receipt photos</li>
            <li>Automatic split calculations</li>
            <li>Approval workflow between parents</li>
            <li>Track who owes what</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="documents-tab"]',
      title: '📄 Documents Tab',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Store and organize important documents like custody agreements, medical records, school documents, and more. Bridge-it can parse your custody agreement to extract key information automatically.
          </p>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded-r-lg">
            <p className="text-sm text-purple-800">
              <strong>🤖 Smart:</strong> Upload your custody agreement and Bridge-it extracts schedules and important dates automatically.
            </p>
          </div>
        </div>
      ),
      placement: 'bottom',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="resources-tab"]',
      title: '📚 Resources Tab',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Access educational resources, co-parenting tips, and helpful articles from experts to support your co-parenting journey.
          </p>
          <p className="text-sm text-gray-600">
            Learn evidence-based strategies for effective co-parenting and child development.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="recent-activity"]',
      title: '📊 Recent Activity',
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Stay updated with all recent activity across your family profile. See new messages, expense approvals, calendar updates, and other important notifications at a glance.
          </p>
          <p className="text-xs text-gray-600">
            Color-coded indicators help you quickly see what needs your attention.
          </p>
        </div>
      ),
      placement: 'top',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="quick-actions"]',
      title: '⚡ Quick Actions',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Quickly access the most common tasks: Schedule events, send messages, review expenses, or view documents - all with one click from here.
          </p>
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
            <p className="text-sm text-green-800">
              <strong>⚡ Fast Access:</strong> These shortcuts save you time on daily co-parenting tasks.
            </p>
          </div>
        </div>
      ),
      placement: 'top',
      disableOverlayClose: true,
      disableScrolling: false,
    },
    {
      target: '[data-tour="support-chatbot"]',
      title: '🤖 Bridge-it Assistant',
      content: (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">
            Need help? Click on Bridge-it's avatar in the bottom right corner to chat with our support assistant. Get instant help with any feature or co-parenting question.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>💬 Always Available:</strong> Bridge-it is here to help you navigate the platform and answer questions.
            </p>
          </div>
        </div>
      ),
      placement: 'top',
      disableOverlayClose: true,
      disableScrolling: false,
    },
  ]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setStepIndex(0);
      // Clean up any styles when tour ends
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      onComplete();
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step index for smooth transitions
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextStepIndex);
    }
    // Removed TOUR_START handler - let react-joyride handle scrolling naturally
  };

  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run]);

  return (
    <>
      <style>{`
        /* Modern Tour Styles */
        .react-joyride__tooltip {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 1) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          padding: 14px;
          max-width: 340px;
          font-size: 13px;
          z-index: 10001 !important;
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .react-joyride__tooltip__header {
          margin-bottom: 12px;
        }

        .react-joyride__tooltip__title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .react-joyride__tooltip__content {
          font-size: 13px;
          line-height: 1.4;
          color: #4b5563;
          margin-bottom: 10px;
        }

        .react-joyride__tooltip__footer {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .react-joyride__button {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .react-joyride__button--primary {
          background: hsl(214, 100%, 21%);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 47, 108, 0.4);
        }

        .react-joyride__button--primary:hover {
          background: hsl(214, 100%, 15%);
          box-shadow: 0 6px 16px rgba(0, 47, 108, 0.5);
          transform: translateY(-1px);
        }

        .react-joyride__button--primary:active {
          transform: translateY(0);
        }

        .react-joyride__button--secondary {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .react-joyride__button--secondary:hover {
          background: #f9fafb;
          color: #374151;
          border-color: #d1d5db;
        }

        .react-joyride__button--skip {
          color: #9ca3af;
          background: transparent;
          padding: 8px 16px;
        }

        .react-joyride__button--skip:hover {
          color: #6b7280;
          background: rgba(0, 0, 0, 0.02);
        }

        .react-joyride__beacon {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .react-joyride__overlay {
          background: rgba(0, 0, 0, 0.25) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
          animation: fadeIn 0.3s ease;
          z-index: 9999 !important;
          mix-blend-mode: normal !important;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .react-joyride__spotlight {
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25),
                      0 0 0 4px rgba(59, 130, 246, 1),
                      0 0 40px rgba(59, 130, 246, 0.6);
          animation: spotlightPulse 2s ease-in-out infinite;
          z-index: 10000 !important;
          position: relative;
          opacity: 1 !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          mix-blend-mode: normal !important;
          isolation: isolate !important;
          background: transparent !important;
        }

        /* CRITICAL: All content inside spotlight must be 100% normal - override EVERYTHING */
        .react-joyride__spotlight,
        .react-joyride__spotlight *,
        .react-joyride__spotlight * *,
        .react-joyride__spotlight * * *,
        .react-joyride__spotlight * * * *,
        body.react-joyride__open .react-joyride__spotlight,
        body.react-joyride__open .react-joyride__spotlight *,
        body.react-joyride__open .react-joyride__spotlight * *,
        body.react-joyride__open .react-joyride__spotlight * * *,
        body.react-joyride__open .react-joyride__spotlight * * * * {
          opacity: 1 !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          -webkit-filter: none !important;
          mix-blend-mode: normal !important;
          color: inherit !important;
          background: inherit !important;
          transform: none !important;
          will-change: auto !important;
        }

        @keyframes spotlightPulse {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25),
                        0 0 0 4px rgba(59, 130, 246, 1),
                        0 0 40px rgba(59, 130, 246, 0.6);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25),
                        0 0 0 6px rgba(59, 130, 246, 1),
                        0 0 50px rgba(59, 130, 246, 0.8);
          }
        }

        /* Remove blur from spotlight and its children - this is critical */
        body.react-joyride__open .react-joyride__spotlight,
        body.react-joyride__open .react-joyride__spotlight *,
        body.react-joyride__open .react-joyride__spotlight * *,
        body.react-joyride__open .react-joyride__spotlight * * * {
          opacity: 1 !important;
          filter: none !important;
          backdrop-filter: none !important;
        }

        .react-joyride__progress {
          background: #e5e7eb;
          height: 4px;
          border-radius: 2px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .react-joyride__progress__bar {
          background: hsl(214, 100%, 21%);
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* REMOVED - No additional styling needed, spotlight should be completely natural */

        /* Keep tooltip and overlay fully visible */
        body.react-joyride__open .react-joyride__tooltip,
        body.react-joyride__open .react-joyride__tooltip *,
        body.react-joyride__open .react-joyride__overlay {
          opacity: 1 !important;
          filter: none !important;
        }

        /* Ensure tour button stays on top and visible */
        body.react-joyride__open [data-tour-button],
        body.react-joyride__open [data-tour-button] * {
          opacity: 1 !important;
          filter: none !important;
          z-index: 10002 !important;
        }

        /* Allow react-joyride to handle scrolling naturally */
        body.react-joyride__open {
          overflow: auto !important;
        }
      `}</style>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep={true}
        spotlightClicks={false}
        hideCloseButton={false}
        floaterProps={{
          disableAnimation: false,
          disableFlip: true,
          placement: 'auto',
        }}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            zIndex: 10000,
            arrowColor: 'rgba(255, 255, 255, 0.98)',
          },
          overlay: {
            mixBlendMode: 'normal' as const,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          },
          spotlight: {
            borderRadius: 12,
            mixBlendMode: 'normal' as const,
          },
        }}
        locale={{
          back: '← Back',
          close: '✕',
          last: 'Finish Tour',
          next: 'Next →',
          skip: 'Skip Tour',
        }}
      />
    </>
  );
};

export default ProductTour;

import React from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Plus, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { monthNames, getParentDisplayName, eventColors, formatTimeOnly } from '@/utils/calendarUtils';
import { CalendarEvent } from '@/types/calendar';
import { FamilyProfile } from '@/types/family';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DayOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: Date | null;
  isMaterializing: boolean;
  events: CalendarEvent[];
  familyProfile: FamilyProfile | null;
  currentUser?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  getEffectiveCustodyParent: (day: number) => 'mom' | 'dad' | 'both' | null;
  onRequestSwap: () => void;
  onAddEvent: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedTimeZone?: string;
}

const DayOptionsDialog: React.FC<DayOptionsDialogProps> = ({
  open,
  onOpenChange,
  selectedDay,
  isMaterializing,
  events,
  familyProfile,
  currentUser,
  getEffectiveCustodyParent,
  onRequestSwap,
  onAddEvent,
  onEventClick,
  selectedTimeZone = 'America/New_York',
}) => {
  // Filter events for the selected day
  const dayEvents = selectedDay
    ? events.filter(e =>
        e.date === selectedDay.getDate() &&
        e.fullDate.getMonth() === selectedDay.getMonth() &&
        e.fullDate.getFullYear() === selectedDay.getFullYear() &&
        // Filter out the "Custody Day" markers which are just for display
        !(e.type === 'custody' && e.title === 'Custody Day')
      )
    : [];

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-sm max-h-[85vh] flex flex-col">
        <ResponsiveModalHeader className="pb-2">
          <ResponsiveModalTitle>
            {selectedDay
              ? `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}`
              : 'Date Options'}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
             Details and actions for this date.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
          {/* Custody Info */}
          {selectedDay && (() => {
            const day = selectedDay.getDate();
            const parent = getEffectiveCustodyParent(day);
            return (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 shrink-0">
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="font-semibold">Custody:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    parent === 'mom' ? 'bg-blue-100 text-blue-700' :
                    parent === 'dad' ? 'bg-amber-100 text-amber-700' :
                    parent === 'both' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {parent ? getParentDisplayName(parent, familyProfile, currentUser) : 'Not assigned'}
                  </span>
                </p>
              </div>
            );
          })()}

          {/* Events List */}
          <div className="flex-1 min-h-0 flex flex-col">
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Events ({dayEvents.length})
            </h4>
            
            {dayEvents.length > 0 ? (
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-2 pb-2">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick && onEventClick(event)}
                      className={`p-2 rounded-lg border text-sm cursor-pointer hover:opacity-80 transition-opacity flex items-start justify-between gap-2 ${eventColors[event.type]}`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        {event.hasTime && (
                          <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTimeOnly(event.fullDate, selectedTimeZone)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm py-4 border-2 border-dashed rounded-lg bg-gray-50/50">
                <p>No events scheduled</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid gap-2 shrink-0 pt-2 border-t">
            <Button
              onClick={onRequestSwap}
              disabled={isMaterializing}
              className="w-full bg-blue-600 hover:bg-blue-700 h-9"
              size="sm"
            >
              {isMaterializing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 mr-2" />
              )}
              Request Custody Swap
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedDay) {
                  onAddEvent(selectedDay);
                  onOpenChange(false);
                }
              }}
              className="w-full h-9"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Specific Event
            </Button>
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default DayOptionsDialog;
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Plus, Loader2 } from 'lucide-react';
import { monthNames, getParentDisplayName } from '@/utils/calendarUtils';
import { CalendarEvent } from '@/types/calendar';
import { FamilyProfile } from '@/types/family';

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
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {selectedDay
              ? `${monthNames[selectedDay.getMonth()]} ${selectedDay.getDate()}`
              : 'Date Options'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedDay && (() => {
            const day = selectedDay.getDate();
            const parent = getEffectiveCustodyParent(day);
            return (
              <div className="text-sm text-gray-600 mb-2">
                <p>
                  <strong>Custody:</strong>{' '}
                  {parent ? getParentDisplayName(parent, familyProfile, currentUser) : 'Not assigned'}
                </p>
              </div>
            );
          })()}
          <Button
            onClick={onRequestSwap}
            disabled={isMaterializing}
            className="w-full bg-blue-600 hover:bg-blue-700"
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
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Specific Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayOptionsDialog;
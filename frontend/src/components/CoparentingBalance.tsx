import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scale } from 'lucide-react';

const CoparentingBalance = () => {
  return (
    <Card className="border-2 border-bridge-blue h-full">
      <CardHeader className="p-4 sm:p-6 pb-2">
         <CardTitle className="flex items-center text-bridge-black text-base sm:text-lg">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-bridge-blue" />
            Coparenting Balance
         </CardTitle>
         <CardDescription>
            Tracking shared responsibilities this month
         </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2">
         <div className="space-y-6">
             <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-bridge-blue">You (85%)</span>
                    <span className="text-bridge-green">Partner (15%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex shadow-inner">
                    <div className="bg-bridge-blue h-full" style={{ width: '85%' }}></div>
                    <div className="bg-bridge-green h-full" style={{ width: '15%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center italic">
                    You've handled the majority of tasks this month.
                </p>
             </div>
             
             <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-lg sm:text-xl font-bold text-bridge-blue">12</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wide font-semibold">Events</div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="text-lg sm:text-xl font-bold text-bridge-green">$450</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wide font-semibold">Expenses</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="text-lg sm:text-xl font-bold text-yellow-600">5</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wide font-semibold">Messages</div>
                </div>
             </div>
         </div>
      </CardContent>
    </Card>
  );
};

export default CoparentingBalance;
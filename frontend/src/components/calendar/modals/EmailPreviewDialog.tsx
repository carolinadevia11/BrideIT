import React from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Mail, FileText } from 'lucide-react';
import { EmailNotification } from '@/types/calendar';
import { formatDateTime } from '@/utils/calendarUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedEmail: EmailNotification | null;
  selectedTimeZone: string;
}

const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  open,
  onOpenChange,
  generatedEmail,
  selectedTimeZone,
}) => {
  const handleDownloadPdf = () => {
    const emailContentElement = document.getElementById('email-content-for-pdf');
    if (emailContentElement) {
      // Temporarily modify styles for full capture
      const originalHeight = emailContentElement.style.height;
      const originalMaxHeight = emailContentElement.style.maxHeight;
      const originalOverflow = emailContentElement.style.overflow;
      emailContentElement.style.height = 'auto';
      emailContentElement.style.maxHeight = 'none';
      emailContentElement.style.overflow = 'visible';

      html2canvas(emailContentElement, {
        scrollY: -window.scrollY,
        useCORS: true,
      }).then((canvas) => {
        // Restore original styles
        emailContentElement.style.height = originalHeight;
        emailContentElement.style.maxHeight = originalMaxHeight;
        emailContentElement.style.overflow = originalOverflow;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4',
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const scaledHeight = canvasHeight / ratio;

        if (scaledHeight > pdfHeight) {
          let y = 0;
          let remainingHeight = canvasHeight;
          while (remainingHeight > 0) {
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvasWidth;
            pageCanvas.height = pdfHeight * ratio;
            const pageCtx = pageCanvas.getContext('2d');
            if (pageCtx) {
              pageCtx.drawImage(
                canvas,
                0,
                y,
                canvasWidth,
                pdfHeight * ratio,
                0,
                0,
                canvasWidth,
                pdfHeight * ratio
              );
              const pageImgData = pageCanvas.toDataURL('image/png');
              pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              remainingHeight -= pdfHeight * ratio;
              y += pdfHeight * ratio;
              if (remainingHeight > 0) {
                pdf.addPage();
              }
            }
          }
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
        }

        pdf.save('schedule-change-documentation.pdf');
      });
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center text-lg sm:text-xl">
            <Mail className="w-5 h-5 mr-2 text-green-600" />
            Automated Documentation Email
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Preview the automated email that will be sent to both parents.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {generatedEmail && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">
                📧 Email Details
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  <strong>To:</strong> {generatedEmail.to.join(', ')}
                </p>
                <p>
                  <strong>Subject:</strong> {generatedEmail.subject}
                </p>
                <p>
                  <strong>Sent:</strong>{' '}
                  {formatDateTime(generatedEmail.timestamp, selectedTimeZone)}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-medium text-gray-800 mb-3">
                Email Content Preview:
              </h3>
              <div
                id="email-content-for-pdf"
                className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generatedEmail.content }}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleDownloadPdf}>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default EmailPreviewDialog;
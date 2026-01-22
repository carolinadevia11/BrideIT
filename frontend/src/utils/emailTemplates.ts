import { ChangeRequest, EmailNotification } from '@/types/calendar';
import { FamilyProfile } from '@/types/family';
import { getParentDisplayName, getParentEmailAddress, formatDateTime, US_TIME_ZONES } from './calendarUtils';

export const generateApprovalEmail = (
  request: ChangeRequest,
  currentMonth: Date,
  familyProfile: FamilyProfile | null,
  currentUser: { email: string; firstName?: string; lastName?: string } | undefined,
  selectedTimeZone: string
): EmailNotification => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentMonthName = monthNames[currentMonth.getMonth()];
    const currentYear = currentMonth.getFullYear();
    const parent1Name = getParentDisplayName('mom', familyProfile, currentUser);
    const parent2Name = getParentDisplayName('dad', familyProfile, currentUser);
    const parent1Signature = parent1Name.toUpperCase();
    const parent2Signature = parent2Name.toUpperCase();
    
    // Build recipient list
    const recipients = [
      getParentEmailAddress('mom', familyProfile),
      getParentEmailAddress('dad', familyProfile),
    ].filter((email): email is string => Boolean(email));

    if (!recipients.length && currentUser?.email) {
      recipients.push(currentUser.email);
    }
    
    const recipientList = recipients;
    const fallbackRecipients = ['notifications@bridge.local'];
    
    const requestedByName = getParentDisplayName(request.requestedBy, familyProfile, currentUser);
    const approvedByName = request.approvedBy
      ? getParentDisplayName(request.approvedBy, familyProfile, currentUser)
      : getParentDisplayName(request.requestedBy === 'mom' ? 'dad' : 'mom', familyProfile, currentUser);
    
    const formatDate = (date: number) => `${currentMonthName} ${date}, ${currentYear}`;
    
    let changeDescription = '';
    let contractImpact = '';
    
    if (request.type === 'swap' && request.swapWithDate) {
      const originalEvent = request.originalEvent;
      const swapEvent = request.affectedEvents.find(e => e.date === request.swapWithDate);
      
      changeDescription = `
        <strong>SCHEDULE SWAP APPROVED</strong><br/>
        • ${originalEvent.title} moved from ${formatDate(request.originalDate)} to ${formatDate(request.swapWithDate)}<br/>
        • ${swapEvent?.title} moved from ${formatDate(request.swapWithDate)} to ${formatDate(request.originalDate)}
      `;
      
      contractImpact = `
        This change maintains the overall custody balance as outlined in your divorce agreement. 
        The total number of custody days for each parent remains unchanged, only the specific dates have been exchanged.
        This modification does not alter the fundamental terms of your custody arrangement.
      `;
    } else if (request.type === 'modify' && request.newDate) {
      changeDescription = `
        <strong>SCHEDULE MODIFICATION APPROVED</strong><br/>
        • ${request.originalEvent.title} moved from ${formatDate(request.originalDate)} to ${formatDate(request.newDate)}
      `;
      
      contractImpact = `
        This change may affect the custody balance outlined in your divorce agreement. 
        Please review your monthly custody distribution to ensure compliance with your legal arrangement.
        Consider scheduling a makeup day if required by your custody agreement.
      `;
    } else if (request.type === 'cancel') {
      changeDescription = `
        <strong>EVENT CANCELLATION APPROVED</strong><br/>
        • ${request.originalEvent.title} on ${formatDate(request.originalDate)} has been cancelled
      `;
      
      contractImpact = `
        This cancellation may affect the custody balance outlined in your divorce agreement.
        You may need to schedule a makeup day to maintain the required custody distribution.
        Please consult your legal agreement for guidance on cancelled custody time.
      `;
    }

    const selectedTimeZoneLabel =
      US_TIME_ZONES.find((tz) => tz.value === selectedTimeZone)?.label || 'Eastern (ET)';

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #002f6c, #10b981); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f8fafc; }
        .warning { border-left-color: #f59e0b; background: #fffbeb; }
        .success { border-left-color: #10b981; background: #f0fdf4; }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
        .signature-box { border: 2px solid #e2e8f0; padding: 15px; margin: 10px 0; background: white; }
        .timestamp { font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ Bridge-it Co-Parenting Platform</h1>
        <h2>Official Schedule Change Documentation</h2>
    </div>
    
    <div class="content">
        <div class="section success">
            <h3>📅 APPROVED SCHEDULE CHANGE</h3>
            ${changeDescription}
            <br/><br/>
            <strong>Reason:</strong> ${request.reason}
        </div>

        <div class="section">
            <h3>👥 APPROVAL DETAILS</h3>
            <strong>Requested by:</strong> ${requestedByName}<br/>
            <strong>Request Date:</strong> ${formatDateTime(request.timestamp, selectedTimeZone)}<br/>
            <strong>Approved by:</strong> ${approvedByName}<br/>
            <strong>Approval Date:</strong> ${formatDateTime(request.approvedAt, selectedTimeZone)}<br/>
            <strong>Change Type:</strong> ${request.type.toUpperCase()}
        </div>

        <div class="section warning">
            <h3>⚖️ DIVORCE CONTRACT IMPACT ANALYSIS</h3>
            <p>${contractImpact}</p>
            
            <strong>Consequences Acknowledged:</strong>
            <ul>
                ${request.consequences.map(consequence => `<li>${consequence}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h3>📋 BEFORE & AFTER COMPARISON</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f1f5f9;">
                    <th style="padding: 10px; border: 1px solid #e2e8f0;">BEFORE CHANGE</th>
                    <th style="padding: 10px; border: 1px solid #e2e8f0;">AFTER CHANGE</th>
                </tr>
                ${request.type === 'swap' && request.swapWithDate ? `
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.originalEvent.title}<br/>
                        ${formatDate(request.swapWithDate)}: ${request.affectedEvents.find(e => e.date === request.swapWithDate)?.title}
                    </td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.affectedEvents.find(e => e.date === request.swapWithDate)?.title}<br/>
                        ${formatDate(request.swapWithDate)}: ${request.originalEvent.title}
                    </td>
                </tr>
                ` : request.type === 'modify' && request.newDate ? `
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.originalEvent.title}
                    </td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.newDate)}: ${request.originalEvent.title}
                    </td>
                </tr>
                ` : `
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: ${request.originalEvent.title}
                    </td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">
                        ${formatDate(request.originalDate)}: <em>CANCELLED</em>
                    </td>
                </tr>
                `}
            </table>
        </div>

        <div class="section">
            <h3>✅ MUTUAL AGREEMENT CONFIRMATION</h3>
            
            <div class="signature-box">
                <strong>PARENT 1 - ${parent1Signature}</strong><br/>
                Status: ${request.requestedBy === 'mom' ? 'REQUESTED' : 'APPROVED'}<br/>
                Date: ${request.requestedBy === 'mom' ? formatDateTime(request.timestamp, selectedTimeZone) : formatDateTime(request.approvedAt, selectedTimeZone)}<br/>
                Digital Signature: ✓ Confirmed via Bridge-it Platform
            </div>

            <div class="signature-box">
                <strong>PARENT 2 - ${parent2Signature}</strong><br/>
                Status: ${request.requestedBy === 'dad' ? 'REQUESTED' : 'APPROVED'}<br/>
                Date: ${request.requestedBy === 'dad' ? formatDateTime(request.timestamp, selectedTimeZone) : formatDateTime(request.approvedAt, selectedTimeZone)}<br/>
                Digital Signature: ✓ Confirmed via Bridge-it Platform
            </div>
        </div>

        <div class="section warning">
            <h3>⚠️ LEGAL DISCLAIMER</h3>
            <p><strong>This email serves as official documentation of a mutually agreed schedule modification.</strong></p>
            <p>Both parents have reviewed and approved this change through the Bridge-it Co-Parenting Platform. 
            This modification is binding and should be treated as an amendment to your existing custody schedule.</p>
            <p>If this change conflicts with your legal custody agreement, please consult with your family law attorney. 
            Bridge-it Co-Parenting Platform provides tools for communication and organization but does not provide legal advice.</p>
        </div>

        <div class="section">
            <h3>📞 QUESTIONS OR CONCERNS?</h3>
            <p>If you have questions about this change or need to make additional modifications:</p>
            <ul>
                <li>Log into your Bridge-it account at <a href="https://bridge-coparenting.com">bridge-coparenting.com</a></li>
                <li>Contact Bridge-it Support: support@bridge-coparenting.com</li>
                <li>For legal questions, consult your family law attorney</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p><strong>Bridge-it Co-Parenting Platform</strong> | Fair & Balanced Co-Parenting</p>
        <p>This is an automated message generated by the Bridge-it system.</p>
            <p class="timestamp">Document ID: BCH-${request.id} | Generated: ${formatDateTime(new Date(), selectedTimeZone)}</p>
            <p class="timestamp">All timestamps shown in ${selectedTimeZoneLabel}.</p>
        <p>⚖️ Bridge-it AI Assistant helped facilitate this agreement</p>
    </div>
</body>
</html>
    `;

    return {
      id: Date.now().toString(),
      to: recipientList.length ? recipientList : fallbackRecipients,
      subject: `🗓️ APPROVED: Schedule Change Documentation - ${currentMonthName} ${currentYear}`,
      content: emailContent,
      timestamp: new Date(),
      changeRequest: request
    };
};
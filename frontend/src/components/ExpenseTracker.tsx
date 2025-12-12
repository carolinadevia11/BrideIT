import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, DollarSign, Clock, CheckCircle, AlertTriangle, X, Upload, FileText, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BridgetteAvatar from './BridgetteAvatar';
import { expensesAPI, authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FamilyProfile } from '@/types/family';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'medical' | 'education' | 'activities' | 'clothing' | 'other';
  date: string;
  paidBy: string;
  status: 'pending' | 'approved' | 'disputed' | 'paid';
  splitRatio: { parent1: number; parent2: number };
  receiptUrl?: string;
  receiptFileName?: string;
  childrenIds?: string[];
  disputeReason?: string;
  disputeCreatedAt?: string;
  disputeCreatedBy?: string;
}

interface ExpenseSummary {
  totalAmount: number;
  userOwes: number;
  userOwed: number;
  pendingCount: number;
  disputedCount: number;
  approvedCount: number;
  paidCount: number;
}

interface CurrentUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface ExpenseTrackerProps {
  familyProfile?: FamilyProfile | null;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ familyProfile }) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Form state
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'other' as Expense['category'],
    date: new Date().toISOString().split('T')[0],
    receiptFile: null as File | null,
  });

  const categoryColors = {
    medical: 'bg-red-100 text-red-800',
    education: 'bg-blue-100 text-blue-800',
    activities: 'bg-green-100 text-green-800',
    clothing: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    disputed: 'bg-bridge-red text-white border-bridge-red',
    paid: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    disputed: AlertTriangle,
    paid: DollarSign
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesData, summaryData] = await Promise.all([
        expensesAPI.getExpenses(),
        expensesAPI.getExpenseSummary()
      ]);
      // Handle empty responses gracefully - these are not errors
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setSummary(summaryData || null);
    } catch (error: any) {
      // Only show error if it's a real error, not just empty data
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No expenses')) {
        // Empty state - not an error
        setExpenses([]);
        setSummary(null);
      } else {
        // Real error - log but don't show toast to avoid frustration
        console.error('Error fetching expenses:', error);
        // Set empty state instead of showing error
        setExpenses([]);
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchExpenses();
  }, [fetchCurrentUser, fetchExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewExpense({ ...newExpense, receiptFile: e.target.files[0] });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      let receiptContent: string | undefined;
      let receiptFileName: string | undefined;

      if (newExpense.receiptFile) {
        receiptContent = await convertFileToBase64(newExpense.receiptFile);
        receiptFileName = newExpense.receiptFile.name;
      }

      await expensesAPI.createExpense({
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
        receipt_file_name: receiptFileName,
        receipt_content: receiptContent,
        children_ids: [], // TODO: Add child selection
      });

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      setShowAddExpense(false);
      setNewExpense({
        description: '',
        amount: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        receiptFile: null,
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    try {
      await expensesAPI.updateExpense(expenseId, { status: 'approved' });
      toast({
        title: "Success",
        description: "Expense approved",
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    }
  };

  const handleDisputeExpense = async () => {
    if (!selectedExpense || !disputeReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for disputing",
        variant: "destructive",
      });
      return;
    }

    try {
      await expensesAPI.updateExpense(selectedExpense.id, {
        status: 'disputed',
        dispute_reason: disputeReason,
      });
      toast({
        title: "Expense Disputed",
        description: "The other parent has been notified",
      });
      setShowDisputeDialog(false);
      setDisputeReason('');
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error disputing expense:', error);
      toast({
        title: "Error",
        description: "Failed to dispute expense",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    try {
      await expensesAPI.updateExpense(expenseId, { status: 'paid' });
      toast({
        title: "Success",
        description: "Expense marked as paid",
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expensesAPI.deleteExpense(expenseId);
      toast({
        title: "Success",
        description: "Expense deleted",
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const getParentLabel = (email: string) => {
    if (!currentUser || !familyProfile) return email;
    if (email === currentUser.email) return 'You';
    if (familyProfile.parent1 && email === familyProfile.parent1.email) return familyProfile.parent1.firstName;
    if (familyProfile.parent2 && email === familyProfile.parent2.email) return familyProfile.parent2.firstName;
    return email;
  };

  const getUserSplitRatio = (expense: Expense) => {
    if (!currentUser || !familyProfile || !familyProfile.parent1) return 50;
    const isParent1 = currentUser.email === familyProfile.parent1.email;
    return isParent1 ? expense.splitRatio.parent1 : expense.splitRatio.parent2;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const disputedCount = summary?.disputedCount || 0;
  const pendingCount = summary?.pendingCount || 0;

  return (
    <div className="space-y-6">
      {/* Bridgette Helper */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <BridgetteAvatar size="md" expression="encouraging" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                Hey {currentUser?.firstName || 'there'}, I'm here to help with expense tracking!
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Track shared expenses, upload receipts, and automatically calculate splits based on your custody agreement. All expenses are logged for legal documentation. 💰
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert for disputed expenses */}
      {disputedCount > 0 && (
        <Card className="border-2 border-bridge-red bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-bridge-red" />
              <div>
                <h3 className="font-semibold text-bridge-red">
                  {disputedCount} Disputed Expense{disputedCount > 1 ? 's' : ''} Need Resolution
                </h3>
                <p className="text-sm text-bridge-red">
                  Please review and resolve disputed expenses to maintain accurate records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total This Month</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(summary?.totalAmount || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">You Owe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary?.userOwes || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pending reimbursements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Owed to You</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.userOwed || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className={disputedCount > 0 ? "border-2 border-bridge-red" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Action Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${disputedCount > 0 ? 'text-bridge-red' : 'text-gray-900'}`}>
              {pendingCount + disputedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pendingCount} pending, {disputedCount} disputed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <div>
                    <Label htmlFor="description" className="text-sm sm:text-base">Description *</Label>
                    <div className="relative mt-1">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        placeholder="e.g., Soccer cleats and uniform"
                        className="pl-10 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="amount">Amount ($) *</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newExpense.category}
                        onValueChange={(value) => setNewExpense({ ...newExpense, category: value as Expense['category'] })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="activities">Activities</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <div className="relative mt-1">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      <Input
                        id="date"
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="receipt">Receipt (Optional)</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {newExpense.receiptFile && (
                        <span className="text-sm text-gray-600">{newExpense.receiptFile.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleCreateExpense} className="flex-1">
                      Add Expense
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No expenses yet. Add your first expense to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => {
                const StatusIcon = statusIcons[expense.status];
                const userRatio = getUserSplitRatio(expense);
                const partnerRatio = 100 - userRatio;
                const yourShare = (expense.amount * userRatio) / 100;
                const partnerShare = (expense.amount * partnerRatio) / 100;
                const isUrgent = expense.status === 'disputed' || expense.status === 'pending';
                const isPaidByUser = expense.paidBy === currentUser?.email;
                const canApprove = !isPaidByUser && expense.status === 'pending';
                const canDispute = !isPaidByUser && expense.status === 'pending';
                const canMarkPaid = !isPaidByUser && expense.status === 'approved';

                return (
                  <div
                    key={expense.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      expense.status === 'disputed' ? 'border-bridge-red bg-red-50' :
                      expense.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{expense.description}</h3>
                          <Badge className={categoryColors[expense.category]}>
                            {expense.category}
                          </Badge>
                          <Badge className={`${statusColors[expense.status]} ${expense.status === 'disputed' ? 'animate-pulse' : ''}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {expense.status.toUpperCase()}
                          </Badge>
                          {isUrgent && (
                            <Badge className="bg-bridge-red text-white animate-pulse">
                              ACTION NEEDED
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Paid by: <span className="font-medium">{getParentLabel(expense.paidBy)}</span></p>
                          <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
                          <div className="flex items-center space-x-4">
                            <span>Your share: <span className="font-medium">{formatCurrency(yourShare)}</span></span>
                            <span>Partner share: <span className="font-medium">{formatCurrency(partnerShare)}</span></span>
                          </div>
                          {expense.disputeReason && (
                            <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-xs">
                              <strong>Dispute reason:</strong> {expense.disputeReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </div>
                        {expense.receiptUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={async () => {
                              try {
                                if (!expense.receiptUrl) {
                                  throw new Error('No receipt URL available');
                                }
                                
                                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                // Ensure URL is properly formatted
                                let receiptPath = expense.receiptUrl;
                                if (!receiptPath.startsWith('http')) {
                                  // Ensure it starts with /
                                  if (!receiptPath.startsWith('/')) {
                                    receiptPath = '/' + receiptPath;
                                  }
                                  receiptPath = `${apiBaseUrl}${receiptPath}`;
                                }
                                
                                // Fetch with authentication
                                const token = localStorage.getItem('authToken');
                                if (!token) {
                                  throw new Error('Not authenticated');
                                }
                                
                                const response = await fetch(receiptPath, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                if (!response.ok) {
                                  throw new Error(`Failed to fetch receipt: ${response.status} ${response.statusText}`);
                                }
                                
                                const blob = await response.blob();
                                const blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, '_blank');
                                
                                // Clean up blob URL after a delay
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                              } catch (error) {
                                console.error('Error opening receipt:', error);
                                toast({
                                  title: "Error",
                                  description: error instanceof Error ? error.message : "Failed to open receipt",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                        {isPaidByUser && expense.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {canApprove && (
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="default" onClick={() => handleApproveExpense(expense.id)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-bridge-red text-bridge-red hover:bg-red-50"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowDisputeDialog(true);
                          }}
                        >
                          Dispute
                        </Button>
                      </div>
                    )}

                    {expense.status === 'disputed' && (
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" className="bg-bridge-red hover:bg-red-600 text-white">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Resolve Dispute
                        </Button>
                      </div>
                    )}

                    {canMarkPaid && (
                      <div className="mt-3">
                        <Button size="sm" onClick={() => handleMarkAsPaid(expense.id)}>
                          <DollarSign className="w-4 h-4 mr-1" />
                          Mark as Paid
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="disputeReason">Reason for Dispute *</Label>
              <Textarea
                id="disputeReason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Please explain why you are disputing this expense..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleDisputeExpense} className="flex-1 bg-bridge-red hover:bg-red-600">
                Submit Dispute
              </Button>
              <Button variant="outline" onClick={() => {
                setShowDisputeDialog(false);
                setDisputeReason('');
                setSelectedExpense(null);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseTracker;

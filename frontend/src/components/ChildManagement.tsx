import React, { useState } from 'react';
import { Plus, Edit, Trash2, Baby, Calendar, Heart, AlertTriangle, User, Building, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Child } from '@/types/family';
import { childrenAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChildManagementProps {
  children: Child[];
  onAddChild: (child: Child) => void;
  onUpdateChild: (childId: string, updates: Partial<Child>) => void;
  onRemoveChild: (childId: string) => void;
}

const ChildManagement: React.FC<ChildManagementProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onRemoveChild
}) => {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Child>>({
    firstName: '',
    lastName: '',
    dateOfBirth: undefined,
    gender: undefined,
    specialNeeds: [],
    medicalConditions: [],
    allergies: []
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: undefined,
      gender: undefined,
      specialNeeds: [],
      medicalConditions: [],
      allergies: []
    });
    setEditingChild(null);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.dateOfBirth) return;

    setIsSubmitting(true);
    const birthDate = new Date(formData.dateOfBirth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    try {
      if (editingChild) {
        // Update existing child
        await childrenAPI.updateChild(editingChild.id, {
          name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
          dateOfBirth: birthDate.toISOString().split('T')[0],
          school: formData.school || '',
          grade: formData.grade || '',
          allergies: Array.isArray(formData.allergies) ? formData.allergies.join(', ') : (formData.allergies || ''),
          medications: Array.isArray(formData.medicalConditions) ? formData.medicalConditions.join(', ') : (formData.medicalConditions || ''),
          notes: formData.notes || '',
        });

        onUpdateChild(editingChild.id, {
          ...formData,
          age,
          dateOfBirth: birthDate
        });

        toast({
          title: "Success!",
          description: "Child information updated successfully.",
        });
      } else {
        // Add new child
        const response = await childrenAPI.addChild({
          name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
          dateOfBirth: birthDate.toISOString().split('T')[0],
          school: formData.school || '',
          grade: formData.grade || '',
          allergies: Array.isArray(formData.allergies) ? formData.allergies.join(', ') : (formData.allergies || ''),
          medications: Array.isArray(formData.medicalConditions) ? formData.medicalConditions.join(', ') : (formData.medicalConditions || ''),
          notes: formData.notes || '',
        });

        const newChild: Child = {
          id: response.id || Date.now().toString(),
          firstName: formData.firstName,
          lastName: formData.lastName || '',
          dateOfBirth: birthDate,
          age,
          gender: formData.gender,
          specialNeeds: formData.specialNeeds || [],
          medicalConditions: formData.medicalConditions || [],
          allergies: formData.allergies || [],
          school: formData.school,
          grade: formData.grade,
          notes: formData.notes
        };
        onAddChild(newChild);

        toast({
          title: "Success!",
          description: "Child added successfully.",
        });
      }

      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving child:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save child information.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData(child);
    setShowAddDialog(true);
  };

  const handleDelete = async (childId: string) => {
    try {
      await childrenAPI.deleteChild(childId);
      onRemoveChild(childId);
      toast({
        title: "Success!",
        description: "Child removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove child.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Children</h2>
          <p className="text-gray-600">Add or edit information about your children</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <Card key={child.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {child.firstName && child.firstName[0] ? child.firstName[0] : '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{child.firstName} {child.lastName}</h3>
                    <p className="text-sm text-gray-600">Age {child.age}</p>
                    {child.gender && (
                      <p className="text-xs text-gray-500 capitalize">{child.gender}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              {child.dateOfBirth && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(child.dateOfBirth).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}

              {/* School & Grade */}
              {(child.school || child.grade) && (
                <div className="mb-3">
                  {child.school && (
                    <div className="mb-1">
                      <p className="text-xs text-gray-500">School</p>
                      <p className="text-sm font-medium text-gray-700">{child.school}</p>
                    </div>
                  )}
                  {child.grade && (
                    <div>
                      <p className="text-xs text-gray-500">Grade</p>
                      <p className="text-sm font-medium text-gray-700">{child.grade}</p>
                    </div>
                  )}
                </div>
              )}

              {child.specialNeeds && child.specialNeeds.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Special Needs:</p>
                  <div className="flex flex-wrap gap-1">
                    {child.specialNeeds.map((need, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {need}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {child.medicalConditions && child.medicalConditions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Medical:</p>
                  <div className="flex flex-wrap gap-1">
                    {child.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-red-50">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {child.allergies && child.allergies.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Allergies:</p>
                  <div className="flex flex-wrap gap-1">
                    {child.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-yellow-50">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {child.notes && (
                <div className="mb-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Additional Notes:</p>
                  <p className="text-sm text-gray-600 italic">{child.notes}</p>
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(child)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(child.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Child Card */}
        <Card 
          className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors"
          onClick={() => setShowAddDialog(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-800 mb-2">Add Another Child</h3>
            <p className="text-sm text-gray-600 text-center">
              Click to add information about another child
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? 'Edit Child Information' : 'Add New Child'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-zA-Z\s\-']*$/.test(e.target.value)) return;
                      setFormData(prev => ({ ...prev, firstName: e.target.value }))
                    }}
                    placeholder="Emma"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-zA-Z\s\-']*$/.test(e.target.value)) return;
                      setFormData(prev => ({ ...prev, lastName: e.target.value }))
                    }}
                    placeholder="Johnson"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: new Date(e.target.value) }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value: any) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">School (Optional)</Label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                    placeholder="Lincoln Elementary"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="grade">Grade (Optional)</Label>
                <div className="relative mt-1">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="3rd"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="specialNeeds">Special Needs (Optional)</Label>
              <Textarea
                id="specialNeeds"
                placeholder="Any special needs or accommodations..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="medicalConditions">Medical Conditions (Optional)</Label>
              <Textarea
                id="medicalConditions"
                placeholder="Any medical conditions to be aware of..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="allergies">Allergies (Optional)</Label>
              <Textarea
                id="allergies"
                placeholder="Any allergies (food, medication, environmental)..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any other important information..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={!formData.firstName || !formData.dateOfBirth || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : (editingChild ? 'Update Child' : 'Add Child')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChildManagement;
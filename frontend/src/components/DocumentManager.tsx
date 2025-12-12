import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Plus, Search, Filter, Calendar, Shield, Lock, FolderOpen, Folder, ArrowLeft, Heart, Camera, Users, AlertTriangle, GraduationCap, Stethoscope, Scale, Image, Video, FileImage, Edit, X, Briefcase, Home, Star, Music, Gamepad2, Plane, Gift, Baby, Car, Book, Coffee, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import BridgetteAvatar from './BridgetteAvatar';
import { documentsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

interface Document {
  id: string;
  name: string;
  type: 'custody-agreement' | 'court-order' | 'medical' | 'school' | 'financial' | 'emergency' | 'memories' | 'custom' | 'other';
  customCategory?: string;
  uploadDate: string; // ISO string from backend
  size: string;
  status: 'processed' | 'processing' | 'needs-review';
  tags: string[];
  description?: string;
  isProtected?: boolean;
  protectionReason?: string;
  fileType?: 'pdf' | 'doc' | 'image' | 'video' | 'other';
  fileUrl?: string;
  fileName?: string;
  thumbnail?: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from backend
  color: string;
  bgColor: string;
  documentTypes: string[];
  count: number;
  isSpecial?: boolean;
  isCustom?: boolean;
  customCategory?: string;
}

interface CurrentUser {
  firstName: string;
  lastName: string;
  email: string;
}

const DocumentManager: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Custom folder creation state
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Folder');
  const [selectedColor, setSelectedColor] = useState<string>('blue');

  // Icon mapping from backend names to components
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Folder': Folder,
    'Briefcase': Briefcase,
    'Home': Home,
    'Star': Star,
    'Heart': Heart,
    'Music': Music,
    'Gamepad': Gamepad2,
    'Plane': Plane,
    'Gift': Gift,
    'Baby': Baby,
    'Car': Car,
    'Book': Book,
    'Coffee': Coffee,
    'Palette': Palette,
    'Camera': Camera,
    'Scale': Scale,
    'Stethoscope': Stethoscope,
    'GraduationCap': GraduationCap,
    'AlertTriangle': AlertTriangle,
  };

  // Helper function to get icon component
  const getIconComponent = (iconName: string): React.ComponentType<any> => {
    return iconMap[iconName] || Folder;
  };

  const availableIcons = [
    { name: 'Folder', icon: Folder },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Home', icon: Home },
    { name: 'Star', icon: Star },
    { name: 'Heart', icon: Heart },
    { name: 'Music', icon: Music },
    { name: 'Gamepad', icon: Gamepad2 },
    { name: 'Plane', icon: Plane },
    { name: 'Gift', icon: Gift },
    { name: 'Baby', icon: Baby },
    { name: 'Car', icon: Car },
    { name: 'Book', icon: Book },
    { name: 'Coffee', icon: Coffee },
    { name: 'Palette', icon: Palette },
    { name: 'Camera', icon: Camera }
  ];

  const availableColors = [
    { name: 'blue', class: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { name: 'purple', class: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { name: 'green', class: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    { name: 'yellow', class: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    { name: 'indigo', class: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    { name: 'teal', class: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
    { name: 'rose', class: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    { name: 'amber', class: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  ];

  const documentTypes = {
    'custody-agreement': { label: 'Custody Agreement', color: 'bg-red-100 text-red-800' },
    'court-order': { label: 'Court Order', color: 'bg-red-100 text-red-800' },
    'medical': { label: 'Medical', color: 'bg-green-100 text-green-800' },
    'school': { label: 'School', color: 'bg-blue-100 text-blue-800' },
    'financial': { label: 'Financial', color: 'bg-yellow-100 text-yellow-800' },
    'emergency': { label: 'Emergency', color: 'bg-orange-100 text-orange-800' },
    'memories': { label: 'Memory', color: 'bg-pink-100 text-pink-800' },
    'custom': { label: 'Custom', color: 'bg-purple-100 text-purple-800' },
    'other': { label: 'Other', color: 'bg-gray-100 text-gray-800' }
  };

  const statusColors = {
    'processed': 'bg-green-100 text-green-800',
    'processing': 'bg-yellow-100 text-yellow-800',
    'needs-review': 'bg-orange-100 text-orange-800'
  };

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, []);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const foldersData = await documentsAPI.getFolders();
      // Handle empty responses gracefully - these are not errors
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch (error: any) {
      // Only show error if it's a real error, not just empty data
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        // Empty state - not an error
        setFolders([]);
      } else {
        // Real error - log but don't show toast to avoid frustration
        console.error('Error fetching folders:', error);
        // Set empty state instead of showing error
        setFolders([]);
      }
    }
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async (folderId?: string) => {
    try {
      const documentsData = await documentsAPI.getDocuments(folderId);
      // Handle empty responses gracefully - these are not errors
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error: any) {
      // Only show error if it's a real error, not just empty data
      const errorMessage = error?.message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('No documents')) {
        // Empty state - not an error
        setDocuments([]);
      } else {
        // Real error - log but don't show toast to avoid frustration
        console.error('Error fetching documents:', error);
        // Set empty state instead of showing error
        setDocuments([]);
      }
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCurrentUser(),
        fetchFolders(),
        fetchDocuments()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchCurrentUser, fetchFolders, fetchDocuments]);

  // Fetch documents when folder changes
  useEffect(() => {
    if (currentFolder) {
      fetchDocuments(currentFolder);
    } else {
      fetchDocuments();
    }
  }, [currentFolder, fetchDocuments]);

  const getCurrentFolderDocuments = () => {
    if (!currentFolder) return documents;
    const folder = folders.find(f => f.id === currentFolder);
    if (!folder) return [];
    
    let folderDocuments;
    if (folder.isCustom) {
      folderDocuments = documents.filter(doc => doc.customCategory === folder.customCategory);
    } else {
      folderDocuments = documents.filter(doc => folder.documentTypes.includes(doc.type));
    }
    
    return folderDocuments.filter(doc => {
      if (!searchTerm) return true;
      return doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc?.isProtected) {
      toast({
        title: "Cannot Delete",
        description: doc.protectionReason || "This document is protected and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await documentsAPI.deleteDocument(docId);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      // Refresh documents
      if (currentFolder) {
        fetchDocuments(currentFolder);
      } else {
        fetchDocuments();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (doc: Document) => {
    switch (doc.fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-pink-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const createCustomFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    const selectedColorData = availableColors.find(c => c.name === selectedColor);
    
    if (!selectedColorData) return;

    try {
      const folderData = await documentsAPI.createFolder({
        name: newFolderName,
        description: newFolderDescription || `Custom folder for ${newFolderName.toLowerCase()}`,
        icon: selectedIcon,
        color: selectedColorData.class,
        bg_color: selectedColorData.bg,
      });

      toast({
        title: "Success",
        description: "Custom folder created successfully",
      });

      setShowCreateFolder(false);
      setNewFolderName('');
      setNewFolderDescription('');
      setSelectedIcon('Folder');
      setSelectedColor('blue');
      
      // Refresh folders
      fetchFolders();
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const deleteCustomFolder = async (folderId: string) => {
    try {
      await documentsAPI.deleteFolder(folderId);
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
      
      if (currentFolder === folderId) {
        setCurrentFolder(null);
      }
      
      // Refresh folders
      fetchFolders();
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Validation Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const folder = folders.find(f => f.id === uploadFolder);
    if (!folder) {
      toast({
        title: "Error",
        description: "Folder not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Convert file to base64
      const fileContent = await convertFileToBase64(uploadFile);
      
      // Determine document type
      let documentType = 'other';
      if (folder.id === 'memories') {
        documentType = 'memories';
      } else if (folder.documentTypes.includes('custody-agreement') || folder.documentTypes.includes('court-order')) {
        documentType = folder.documentTypes[0];
      } else if (folder.documentTypes.length > 0) {
        documentType = folder.documentTypes[0];
      }

      await documentsAPI.uploadDocument({
        folder_id: uploadFolder,
        name: uploadFile.name,
        type: documentType,
        description: uploadDescription || undefined,
        file_content: fileContent,
        file_name: uploadFile.name,
      });

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setShowUpload(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadFolder('');

      // Refresh documents
      if (currentFolder) {
        fetchDocuments(currentFolder);
      } else {
        fetchDocuments();
      }
      fetchFolders(); // Refresh to update counts
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (doc: Document) => {
    if (!doc.fileUrl) return;
    
    try {
      // Use direct URL with token for streaming/instant access
      const fileUrl = documentsAPI.getDocumentUrl(doc.fileUrl);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    if (!doc.fileUrl) return;
    
    try {
      // Use direct URL with token for streaming/instant access
      const fileUrl = documentsAPI.getDocumentUrl(doc.fileUrl, true);
      const link = document.createElement('a');
      link.href = fileUrl;
      // For direct links, the backend Content-Disposition header handles the filename
      // but setting download attribute is still good practice
      link.download = doc.fileName || doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const renderCreateFolderDialog = () => (
    <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            Create Custom Folder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <BridgetteAvatar size="md" expression="encouraging" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Great idea! Let's create a custom folder for your unique needs!
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Custom folders help you organize documents that don't fit into the standard categories! 📁✨
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="folderName" className="text-sm sm:text-base">Folder Name *</Label>
              <div className="relative mt-1">
                <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Sports & Activities, Travel Plans..."
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="folderDescription" className="text-sm sm:text-base">Description</Label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="folderDescription"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Brief description of what you'll store here"
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm sm:text-base">Choose an Icon</Label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 mt-2">
              {availableIcons.map((iconData) => {
                const IconComponent = iconData.icon;
                return (
                  <button
                    key={iconData.name}
                    onClick={() => setSelectedIcon(iconData.name)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedIcon === iconData.name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 mx-auto text-gray-600" />
                    <span className="text-xs mt-1 block">{iconData.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-sm sm:text-base">Choose a Color Theme</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mt-2">
              {availableColors.map((colorData) => (
                <button
                  key={colorData.name}
                  onClick={() => setSelectedColor(colorData.name)}
                  className={`p-4 rounded-lg border-2 transition-colors ${colorData.bg} ${
                    selectedColor === colorData.name 
                      ? 'border-gray-800' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${colorData.class.replace('text-', 'bg-')} mx-auto mb-2`}></div>
                  <span className="text-xs capitalize">{colorData.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {newFolderName && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</Label>
              <div className={`inline-flex items-center space-x-3 p-3 rounded-lg ${availableColors.find(c => c.name === selectedColor)?.bg}`}>
                {React.createElement(availableIcons.find(i => i.name === selectedIcon)?.icon || Folder, {
                  className: `w-6 h-6 ${availableColors.find(c => c.name === selectedColor)?.class}`
                })}
                <div>
                  <div className="font-medium text-gray-800">{newFolderName}</div>
                  <div className="text-sm text-gray-600">{newFolderDescription || `Custom folder for ${newFolderName.toLowerCase()}`}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button 
              onClick={createCustomFolder}
              disabled={!newFolderName.trim()}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderUploadDialog = () => {
    const folder = folders.find(f => f.id === uploadFolder);
    const isMemoriesFolder = uploadFolder === 'memories';
    const isCustomFolder = folder?.isCustom;

    return (
      <div className="space-y-6">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <BridgetteAvatar size="md" expression="encouraging" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {isMemoriesFolder ? "Let's add some beautiful memories!" : 
                   isCustomFolder ? "Perfect! Let's add documents to your custom folder!" :
                   "I can help organize your documents!"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {isMemoriesFolder 
                    ? "Upload photos and videos to create lasting memories of your family moments! 📸❤️"
                    : isCustomFolder
                      ? "Your custom folder is ready for any documents that fit your unique needs! 📁"
                      : "I can extract key information from legal documents and organize everything perfectly! 📄"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {folder && (() => {
                  const IconComponent = getIconComponent(folder.icon);
                  return <IconComponent className={`w-5 h-5 mr-2 ${folder.color}`} />;
                })()}
                Upload to {folder?.name}
              </CardTitle>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isMemoriesFolder 
                ? 'border-pink-300 hover:border-pink-400 bg-pink-50' 
                : isCustomFolder
                  ? `${folder?.bgColor} border-opacity-50 hover:border-opacity-75`
                  : 'border-gray-300 hover:border-blue-400'
            }`}>
              {isMemoriesFolder ? (
                <Camera className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              ) : isCustomFolder && folder ? (
                (() => {
                  const IconComponent = getIconComponent(folder.icon);
                  return <IconComponent className={`w-12 h-12 ${folder.color} mx-auto mb-4`} />;
                })()
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {isMemoriesFolder ? 'Add Photos & Videos' : 
                 isCustomFolder ? `Add ${folder?.name} Documents` :
                 'Drop files here or click to browse'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isMemoriesFolder 
                  ? 'Supports JPG, PNG, MP4, MOV up to 50MB'
                  : 'Supports PDF, DOC, DOCX, JPG, PNG up to 10MB'
                }
              </p>
              <div>
                <Input
                  type="file"
                  accept={isMemoriesFolder ? "image/*,video/*" : "application/pdf,.doc,.docx,image/*"}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  className={
                    isMemoriesFolder ? 'bg-pink-500 hover:bg-pink-600' :
                    isCustomFolder ? '' : ''
                  }
                  onClick={() => {
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  {isMemoriesFolder ? 'Choose Photos & Videos' : 'Choose Files'}
                </Button>
              </div>
              {uploadFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isMemoriesFolder ? 'Memory Title' : 'Description'} (optional)
              </label>
              <Input 
                placeholder={
                  isMemoriesFolder 
                    ? "e.g., Emma's birthday party, Family vacation..."
                    : isCustomFolder
                      ? `Brief description for your ${folder?.name.toLowerCase()} document`
                      : "Brief description of the document"
                }
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            {isMemoriesFolder && (
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-pink-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-pink-800">Creating Family Memories</p>
                    <p className="text-pink-700">
                      These photos and videos will be safely stored and can be shared with your co-parent. 
                      Create beautiful albums of your children's milestones and special moments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isCustomFolder && (
              <div className={`p-4 rounded-lg ${folder?.bgColor}`}>
                <div className="flex items-start space-x-3">
                  {folder && (() => {
                    const IconComponent = getIconComponent(folder.icon);
                    return <IconComponent className={`w-5 h-5 ${folder.color} mt-0.5`} />;
                  })()}
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">Custom Folder</p>
                    <p className="text-gray-700">
                      {folder?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isMemoriesFolder && !isCustomFolder && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Secure & Private</p>
                    <p className="text-blue-700">
                      All documents are encrypted and stored securely. Critical legal documents are automatically protected from deletion.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button 
                className="flex-1"
                onClick={handleFileUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Uploading...' : 
                 isMemoriesFolder ? 'Add to Memories' : 
                 isCustomFolder ? `Add to ${folder?.name}` :
                 'Upload Document'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowUpload(false);
                setUploadFile(null);
                setUploadDescription('');
              }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Main folder view
  if (!currentFolder && !showUpload) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          {/* Bridgette Helper */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <BridgetteAvatar size="md" expression="encouraging" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    Hey {currentUser?.firstName || 'there'}, I'm here to help. Ask anything!
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Your documents are organized into folders! Click any folder to view its contents, create custom folders for unique needs, or add new memories to share with your family! 📁❤️
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FolderOpen className="w-6 h-6 mr-2 text-blue-600" />
                    Document Folders
                  </CardTitle>
                  <p className="text-gray-600 mt-1">Organized storage for all your co-parenting documents and memories</p>
                </div>
                <Button onClick={() => setShowCreateFolder(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Folder
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Folders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {folders.map((folder) => (
              <Card 
                key={folder.id} 
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${folder.bgColor} ${
                  folder.isSpecial ? 'hover:scale-105' : 'hover:scale-102'
                } relative group`}
                onClick={() => setCurrentFolder(folder.id)}
              >
                <CardContent className="p-6">
                  {folder.isCustom && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder.id);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomFolder(folder.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-full ${folder.bgColor}`}>
                      {(() => {
                        const IconComponent = getIconComponent(folder.icon);
                        return <IconComponent className={`w-8 h-8 ${folder.color}`} />;
                      })()}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${folder.color}`}>{folder.count}</div>
                      <div className="text-sm text-gray-500">
                        {folder.count === 1 ? 'document' : 'documents'}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    {folder.name}
                    {folder.isCustom && (
                      <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{folder.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadFolder(folder.id);
                        setShowUpload(true);
                      }}
                      className={folder.isSpecial ? 'border-pink-300 text-pink-600 hover:bg-pink-50' : ''}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {folder.isSpecial ? 'Add Memory' : 'Add Document'}
                    </Button>
                    
                    {folder.isSpecial && (
                      <div className="flex space-x-1">
                        <Camera className="w-4 h-4 text-pink-400" />
                        <Video className="w-4 h-4 text-pink-400" />
                        <Heart className="w-4 h-4 text-pink-400" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create Custom Folder Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:scale-102 bg-gray-50 hover:bg-blue-50"
              onClick={() => setShowCreateFolder(true)}
            >
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-full bg-gray-100 w-fit mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Create Custom Folder</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Organize documents that don't fit standard categories
                </p>
                
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Folder
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Documents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'processed').length}
                </div>
                <div className="text-sm text-gray-600">Processed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.isProtected).length}
                </div>
                <div className="text-sm text-gray-600">Protected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {documents.filter(d => d.type === 'memories').length}
                </div>
                <div className="text-sm text-gray-600">Memories</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {folders.filter(f => f.isCustom).length}
                </div>
                <div className="text-sm text-gray-600">Custom Folders</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {renderCreateFolderDialog()}
      </TooltipProvider>
    );
  }

  // Upload dialog
  if (showUpload) {
    return renderUploadDialog();
  }

  // Individual folder view
  const folder = folders.find(f => f.id === currentFolder);
  const folderDocuments = getCurrentFolderDocuments();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Bridgette Helper */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <BridgetteAvatar size="md" expression="encouraging" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {currentFolder === 'memories' 
                    ? "Beautiful memories! These moments are precious! 📸❤️"
                    : folder?.isCustom
                      ? `Great organization with your custom ${folder.name} folder! 📁✨`
                      : "Here are your organized documents! Need help finding something specific?"
                  }
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {currentFolder === 'memories'
                    ? "Share these special moments with your co-parent to keep everyone connected to your children's milestones!"
                    : folder?.isCustom
                      ? "Custom folders help you organize documents exactly how you need them!"
                      : "All documents are secure and organized. Protected documents cannot be deleted to preserve your legal records."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Folder Header */}
        <Card className={`border-2 ${folder?.bgColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentFolder(null)}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Folders
                </Button>
                <div className="flex items-center space-x-3">
                  {folder && (() => {
                    const IconComponent = getIconComponent(folder.icon);
                    return <IconComponent className={`w-6 h-6 ${folder.color}`} />;
                  })()}
                  <div>
                    <CardTitle className="flex items-center">
                      {folder?.name}
                      {folder?.isCustom && (
                        <Badge variant="outline" className="ml-2">Custom</Badge>
                      )}
                    </CardTitle>
                    <p className="text-gray-600 text-sm">{folder?.description}</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setUploadFolder(currentFolder!);
                  setShowUpload(true);
                }}
                className={currentFolder === 'memories' ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                <Plus className="w-4 h-4 mr-2" />
                {currentFolder === 'memories' ? 'Add Memory' : 
                 folder?.isCustom ? `Add to ${folder.name}` :
                 'Add Document'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`Search ${folder?.name.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {folderDocuments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {folder && (() => {
                  const IconComponent = getIconComponent(folder.icon);
                  return <IconComponent className={`w-16 h-16 mx-auto mb-4 ${folder.color} opacity-50`} />;
                })()}
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchTerm ? 'No documents found' : `No ${folder?.name.toLowerCase()} yet`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.'
                    : currentFolder === 'memories'
                      ? 'Start creating beautiful memories by uploading your first photos and videos!'
                      : folder?.isCustom
                        ? `Upload your first documents to your custom ${folder.name} folder!`
                        : `Upload your first ${folder?.name.toLowerCase()} to get started.`
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => {
                      setUploadFolder(currentFolder!);
                      setShowUpload(true);
                    }}
                    className={currentFolder === 'memories' ? 'bg-pink-500 hover:bg-pink-600' : ''}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {currentFolder === 'memories' ? 'Add First Memory' : 
                     folder?.isCustom ? `Add First Document` :
                     'Add First Document'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            folderDocuments.map((doc) => (
              <Card key={doc.id} className={`hover:shadow-md transition-shadow ${
                doc.isProtected ? 'border-2 border-yellow-200 bg-yellow-50' : 
                currentFolder === 'memories' ? 'border-pink-100 bg-pink-50' :
                folder?.isCustom ? `${folder.bgColor} border-opacity-50` : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getFileIcon(doc)}
                        <h3 className="font-medium text-gray-800">{doc.name}</h3>
                        <Badge className={documentTypes[doc.type].color}>
                          {doc.type === 'custom' ? folder?.name : documentTypes[doc.type].label}
                        </Badge>
                        <Badge className={statusColors[doc.status]}>
                          {doc.status.replace('-', ' ')}
                        </Badge>
                        {doc.isProtected && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Lock className="w-3 h-3 mr-1" />
                                Protected
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{doc.protectionReason}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                        <span>{doc.size}</span>
                        {doc.fileType && (
                          <span className="uppercase text-xs font-medium">{doc.fileType}</span>
                        )}
                      </div>
                      
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {doc.isProtected ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                              <Lock className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">{doc.protectionReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DocumentManager;
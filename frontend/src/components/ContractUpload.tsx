import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, FileCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AnimatedBridgette from './AnimatedBridgette';
import { familyAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ContractUploadProps {
  onComplete: (parsedData: any) => void;
  onSkip?: () => void;
}

const ContractUpload: React.FC<ContractUploadProps> = ({ onComplete, onSkip }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file as base64
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 50;
          setUploadProgress(progress);
        }
      };

      reader.onload = async (event) => {
        const base64Content = event.target?.result as string;
        const base64Data = base64Content.split(',')[1]; // Remove data:...;base64, prefix

        setUploadProgress(50);
        setIsParsing(true);

        // Simulate parsing progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 5, 95));
        }, 200);

        try {
          const response = await familyAPI.uploadContract({
            fileName: file.name,
            fileContent: base64Data,
            fileType: file.name.split('.').pop() || 'pdf'
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          setParsedData(response);
          
          toast({
            title: "Success!",
            description: "Contract uploaded and parsed successfully",
          });

          setTimeout(() => {
            onComplete(response);
          }, 2000);
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Error uploading contract:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to upload contract",
            variant: "destructive",
          });
        } finally {
          setIsParsing(false);
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <AnimatedBridgette
          size="md"
          expression={parsedData ? "celebrating" : isParsing ? "thinking" : "encouraging"}
          animation={parsedData ? "celebrate" : isParsing ? "thinking" : "float"}
          showSpeechBubble={true}
          message={
            parsedData 
              ? "Excellent! I've analyzed your custody agreement and extracted the key terms. This will help me set up your schedules and expense splits automatically! 📋✨"
              : isParsing
              ? "I'm reading through your agreement and extracting all the important details... This might take a moment! 🤔📄"
              : "Upload your custody agreement and I'll use AI to extract all the important information - custody schedules, expense splits, decision-making rules, and more! This makes setup so much easier! 🤖"
          }
          position="center"
        />
      </div>

      {!parsedData ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Custody Agreement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Upload your custody agreement (PDF, DOC, DOCX, or TXT). Bridge-it will use AI to extract key information like custody schedules, expense splits, and decision-making arrangements.
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                id="file-upload"
              />
              
              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, or TXT (max 10MB)
                  </p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      className="ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-gray-600">
                        {isParsing ? 'Analyzing document with AI...' : 'Uploading...'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isParsing ? 'Parsing...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Parse
                  </>
                )}
              </Button>

              {onSkip && (
                <Button 
                  onClick={onSkip}
                  variant="outline"
                  disabled={isUploading}
                >
                  Skip for Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-green-400 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="w-6 h-6 mr-2" />
              Contract Parsed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                I've extracted the following key information from your custody agreement:
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 mb-2">Extracted Terms:</h4>
              
              {parsedData.aiAnalysis?.extractedTerms?.map((term: any, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                  <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{term.term}</p>
                    <p className="text-sm text-gray-600">{term.value}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {(term.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </div>
              ))}

              {parsedData.custodyAgreement?.expenseSplit && (
                <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                  <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Expense Split</p>
                    <p className="text-sm text-gray-600">
                      {parsedData.custodyAgreement.expenseSplit.ratio} 
                      {' '}(Parent 1: {parsedData.custodyAgreement.expenseSplit.parent1}%, 
                      Parent 2: {parsedData.custodyAgreement.expenseSplit.parent2}%)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-sm text-gray-600">
              Continuing in 2 seconds...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractUpload;



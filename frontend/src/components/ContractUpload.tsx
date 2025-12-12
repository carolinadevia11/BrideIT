import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, FileCheck, X, ArrowLeft, Shield, Sparkles, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AnimatedBridgette from './AnimatedBridgette';
import { familyAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ContractUploadProps {
  onComplete: (parsedData: any) => void;
  onSkip?: () => void;
  onBack?: () => void;
}

const ContractUpload: React.FC<ContractUploadProps> = ({ onComplete, onSkip, onBack }) => {
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

        try {
          // Initial upload
          const uploadResponse = await familyAPI.uploadContract({
            fileName: file.name,
            fileContent: base64Data,
            fileType: file.name.split('.').pop() || 'pdf'
          });

          // Start polling for status
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await familyAPI.getContractStatus();
              
              if (statusResponse.status === 'completed') {
                clearInterval(pollInterval);
                setUploadProgress(100);
                
                // Combine upload response with status response to match expected format
                const finalData = {
                  ...uploadResponse,
                  ...statusResponse,
                  aiAnalysis: statusResponse.aiAnalysis || statusResponse.custodyAgreement?.parsedData
                };

                setParsedData(finalData);
                setIsParsing(false);
                setIsUploading(false);
                
                toast({
                  title: "Success!",
                  description: "Contract uploaded and parsed successfully",
                });

                setTimeout(() => {
                  onComplete(finalData);
                }, 2000);
              } else if (statusResponse.status === 'failed') {
                clearInterval(pollInterval);
                throw new Error(statusResponse.custodyAgreement?.error || "Analysis failed");
              } else {
                // Still processing
                setUploadProgress(prev => Math.min(prev + 2, 95));
              }
            } catch (error) {
              // Ignore polling errors unless it's a hard failure
              console.warn("Polling error:", error);
            }
          }, 2000); // Check every 2 seconds

        } catch (error) {
          console.error('Error uploading contract:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to upload contract",
            variant: "destructive",
          });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left order-first lg:order-last">
            <AnimatedBridgette
              size="xl"
              expression={parsedData ? "celebrating" : isParsing ? "thinking" : "encouraging"}
              animation={parsedData ? "celebrate" : isParsing ? "thinking" : "float"}
              showSpeechBubble={true}
              message={
                parsedData 
                  ? "Analysis complete! I've extracted the key terms from your agreement. This will help me keep your co-parenting on track automatically! 📋✨"
                  : isParsing
                  ? "I'm analyzing your document now... Looking for schedules, holiday rules, and expense arrangements. Almost done! 🤔📄"
                  : "Upload your custody agreement and I'll use AI to organize everything for you. It's the easiest way to ensure we never miss a detail! 🤖"
              }
              position="center"
            />
          </div>

          {/* Upload Side */}
          <div className="w-full">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="mb-4 text-gray-600 hover:text-gray-900 pl-0"
                disabled={isUploading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {!parsedData ? (
              <Card className="w-full shadow-xl border-bridge-blue/20">
                <CardHeader className="bg-bridge-blue/5 rounded-t-xl pb-8">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Scale className="w-6 h-6 text-bridge-blue" />
                  </div>
                  <CardTitle className="text-2xl text-blue-900">Upload Custody Agreement</CardTitle>
                  <CardDescription className="text-blue-700">
                    Let AI organize your schedule and terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Private & Secure Analysis</p>
                      <p>Your document is analyzed securely to help setup your calendar and expenses. We protect your privacy at every step.</p>
                    </div>
                  </div>

                  <div className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                    ${file 
                      ? 'border-blue-400 bg-blue-50/50' 
                      : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                    }
                  `}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    
                    {!file ? (
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, DOC, DOCX, or TXT (max 10MB)
                        </p>
                      </label>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          {!isUploading && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFile}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {isUploading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-blue-700">
                              <span>{isParsing ? 'Analyzing content...' : 'Uploading file...'}</span>
                              <span>{Math.round(uploadProgress)}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2 bg-blue-100" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    {onSkip && (
                      <Button
                        onClick={onSkip}
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isUploading}
                      >
                        Skip for now
                      </Button>
                    )}
                    <Button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="flex-1 h-12 text-lg bg-bridge-blue hover:bg-bridge-blue/90 shadow-lg transition-all"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {isParsing ? 'Analyzing...' : 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Upload & Parse
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full shadow-xl border-bridge-green/30 ring-4 ring-bridge-green/10">
                <CardHeader className="bg-bridge-green/5 rounded-t-xl pb-6">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <CheckCircle className="w-6 h-6 text-bridge-green" />
                  </div>
                  <CardTitle className="text-2xl text-bridge-green">Analysis Complete!</CardTitle>
                  <CardDescription className="text-bridge-green/80">
                    We've successfully extracted key terms from your agreement
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert className="bg-green-50 border-green-200">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <AlertTitle className="text-green-800 font-semibold">AI Summary</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Here are the key details extracted. These will be used to configure your dashboard automatically.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {parsedData.aiAnalysis?.extractedTerms?.map((term: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{term.term}</p>
                          <p className="text-sm text-gray-600 mt-1">{term.value}</p>
                          <Badge variant="secondary" className="mt-2 text-xs bg-gray-100 text-gray-600 font-normal">
                            {(term.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {parsedData.custodyAgreement?.expenseSplit && (
                      <div className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Scale className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">Expense Split</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {parsedData.custodyAgreement.expenseSplit.ratio} Split
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                              Parent 1: {parsedData.custodyAgreement.expenseSplit.parent1}%
                            </Badge>
                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                              Parent 2: {parsedData.custodyAgreement.expenseSplit.parent2}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-sm text-gray-500 animate-pulse">
                    Redirecting to next step...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractUpload;

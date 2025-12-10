import React, { useState, useEffect } from 'react';
import { Copy, Check, Link2, Upload, FileText, Loader2, ArrowLeft, Sparkles, Share2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AnimatedBridgette from './AnimatedBridgette';
import { familyAPI, childrenAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Child } from '@/types/family';

interface FamilyCodeSetupProps {
  mode: 'create' | 'join';
  onSuccess: (familyData: any) => void;
  onBack?: () => void;
  familyName?: string;
  parent1Name?: string;
  parent2Name?: string;
  custodyArrangement?: string;
  children?: Child[];
}

const FamilyCodeSetup: React.FC<FamilyCodeSetupProps> = ({ 
  mode, 
  onSuccess, 
  onBack, 
  familyName, 
  parent1Name, 
  parent2Name: initialParent2Name, 
  custodyArrangement, 
  children 
}) => {
  const { toast } = useToast();
  const [familyCode, setFamilyCode] = useState('');
  const [parent2Name, setParent2Name] = useState(initialParent2Name || '');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [familyResponse, setFamilyResponse] = useState<any>(null);

  // Check for existing family on mount
  useEffect(() => {
    const checkExistingFamily = async () => {
      if (mode === 'create') {
        try {
          const response = await familyAPI.getFamily();
          if (response && response.familyCode) {
            console.log('Found existing family:', response);
            setGeneratedCode(response.familyCode);
            setFamilyResponse(response);
          }
        } catch (error) {
          // No family found, which is expected for new users
          console.log('No existing family found');
        }
      }
    };
    
    checkExistingFamily();
  }, [mode]);

  const handleCreateFamily = async () => {
    if (!familyName || !parent1Name) {
      toast({
        title: "Missing Information",
        description: "Please provide family name and parent name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Creating family with:', { familyName, parent1Name, custodyArrangement, children });
      
      // Check if user already has a family
      let response;
      try {
        response = await familyAPI.getFamily();
        
        // If family already exists, use that and just show the code
        if (response && response.familyCode) {
          setGeneratedCode(response.familyCode);
          setFamilyResponse(response);
          setIsSubmitting(false);
          toast({
            title: "Family Already Exists",
            description: "Using your existing family profile",
          });
          return; // Exit early, don't create new family
        }
      } catch (familyCheckError) {
        console.log('No existing family, creating new one');
      }
      
      // Create the family
      response = await familyAPI.createFamily({
        familyName,
        parent1_name: parent1Name,
        custodyArrangement: custodyArrangement || '50-50'
      });

      console.log('Family created successfully:', response);

      // Add all children to the family
      if (children && children.length > 0) {
        console.log('Adding children:', children);
        const childPromises = children.map(child => {
          const childData = {
            name: `${child.firstName} ${child.lastName}`,
            dateOfBirth: child.dateOfBirth instanceof Date 
              ? child.dateOfBirth.toISOString().split('T')[0]
              : child.dateOfBirth,
            grade: child.grade || '',
            school: child.school || '',
            allergies: child.allergies?.join(', ') || '',
            medications: child.medicalConditions?.join(', ') || '',
            notes: child.specialNeeds?.join(', ') || '',
          };
          console.log('Adding child:', childData);
          return childrenAPI.addChild(childData);
        });
        await Promise.all(childPromises);
        console.log('All children added successfully');
      }

      setGeneratedCode(response.familyCode);
      setFamilyResponse(response);
      toast({
        title: "Success!",
        description: "Family profile created with Family Code",
      });
    } catch (error) {
      console.error('Error creating family:', error);
      let errorMessage = "Failed to create family profile";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkFamily = async () => {
    if (!familyCode || familyCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-character Family Code",
        variant: "destructive",
      });
      return;
    }

    if (!parent2Name) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await familyAPI.linkToFamily({
        familyCode: familyCode.toUpperCase(),
        parent2_name: parent2Name
      });

      toast({
        title: "Success!",
        description: "Successfully linked to family!",
      });

      onSuccess(response);
    } catch (error) {
      console.error('Error linking to family:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to link to family. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Family Code copied to clipboard",
      });
    }
  };

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Bridgette Side */}
            <div className="text-center lg:text-left order-first lg:order-last">
              <AnimatedBridgette
                size="xl"
                expression={generatedCode ? "celebrating" : "encouraging"}
                animation={generatedCode ? "celebrate" : "float"}
                showSpeechBubble={true}
                message={generatedCode 
                  ? "Your family profile is ready! Share this code with your co-parent so they can join. It's the key to connecting your accounts! 🗝️✨"
                  : "Almost there! I just need to generate a unique code for your family. This keeps your data secure and helps your co-parent connect easily! 🛡️"
                }
                position="center"
              />
            </div>

            {/* Form Side */}
            <div className="w-full">
              {onBack && (
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="mb-4 text-gray-600 hover:text-gray-900 pl-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {!generatedCode ? (
                <Card className="w-full shadow-xl border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl pb-8">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Sparkles className="w-6 h-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl text-blue-900">Create Family Profile</CardTitle>
                    <CardDescription className="text-blue-700">
                      Generate your secure family space and invitation code
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Secure & Private</p>
                        <p>Your family data is protected. This code is the only way for your co-parent to link to this profile.</p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCreateFamily} 
                      disabled={isSubmitting}
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Family Code
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full shadow-xl border-green-200 ring-4 ring-green-50">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl text-center pb-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl text-green-900">You're All Set!</CardTitle>
                    <CardDescription className="text-green-700">
                      Your family profile has been created successfully
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-6">
                    <div className="text-center space-y-4">
                      <Label className="text-gray-500 uppercase tracking-wider text-xs font-semibold">
                        Your Unique Family Code
                      </Label>
                      <div className="relative group cursor-pointer" onClick={copyToClipboard}>
                        <div className="inline-flex items-center justify-center bg-white border-2 border-green-200 hover:border-green-400 rounded-xl px-8 py-6 transition-all duration-200 shadow-sm hover:shadow-md w-full">
                          <span className="text-4xl md:text-5xl font-bold font-mono text-green-800 tracking-[0.2em]">
                            {generatedCode}
                          </span>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 text-green-400 group-hover:text-green-600 transition-colors">
                          {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        </div>
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        {copied ? "Copied to clipboard!" : "Click code to copy"}
                      </p>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                      <Share2 className="w-4 h-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 font-semibold">Next Steps</AlertTitle>
                      <AlertDescription className="text-amber-700 text-sm mt-2">
                        <ol className="list-decimal list-inside space-y-1 ml-1">
                          <li>Share this code with your co-parent</li>
                          <li>They create a Bridge-it account</li>
                          <li>They enter this code to link accounts</li>
                        </ol>
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={() => familyResponse && onSuccess(familyResponse)}
                      disabled={!familyResponse}
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                    >
                      Go to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Join mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Bridgette Side */}
          <div className="text-center lg:text-left order-first lg:order-last">
            <AnimatedBridgette
              size="xl"
              expression="encouraging"
              animation="float"
              showSpeechBubble={true}
              message="Welcome! Enter the 6-digit code your co-parent shared with you. This will securely link your accounts so you can manage everything together! 🤝"
              position="center"
            />
          </div>

          {/* Form Side */}
          <div className="w-full">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="mb-4 text-gray-600 hover:text-gray-900 pl-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            <Card className="w-full shadow-xl border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl pb-8">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <HeartHandshake className="w-6 h-6 text-purple-500" />
                </div>
                <CardTitle className="text-2xl text-purple-900">Join Family Profile</CardTitle>
                <CardDescription className="text-purple-700">
                  Link your account to an existing family profile
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="parent2Name" className="text-gray-700">Your Full Name</Label>
                  <Input
                    id="parent2Name"
                    value={parent2Name}
                    onChange={(e) => setParent2Name(e.target.value)}
                    placeholder="e.g. Michael Smith"
                    className="h-12 text-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="familyCode" className="text-gray-700">Family Code</Label>
                  <div className="relative">
                    <Input
                      id="familyCode"
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="h-16 text-3xl font-mono tracking-[0.5em] text-center uppercase border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none">
                      <Link2 className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Enter the 6-character code shared by your co-parent
                  </p>
                </div>

                <Alert className="bg-purple-50 border-purple-200">
                  <AlertDescription className="text-purple-800 text-sm">
                    Don't have a code? Ask your co-parent to check their Bridge-it dashboard or create a new family profile if you're the first one here.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleLinkFamily} 
                  disabled={isSubmitting || !familyCode || !parent2Name}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Linking Account...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5 mr-2" />
                      Link to Family
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyCodeSetup;

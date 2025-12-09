import React, { useState } from 'react';
import { Copy, Check, Link2, Upload, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

const FamilyCodeSetup: React.FC<FamilyCodeSetupProps> = ({ mode, onSuccess, onBack, familyName, parent1Name, parent2Name: initialParent2Name, custodyArrangement, children }) => {
  const { toast } = useToast();
  const [familyCode, setFamilyCode] = useState('');
  const [parent2Name, setParent2Name] = useState(initialParent2Name || '');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [familyResponse, setFamilyResponse] = useState<any>(null);

  // Check for existing family on mount
  React.useEffect(() => {
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
        console.log('User already has a family, using existing:', response);
        
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
      <div className="space-y-6">
        <div className="text-center mb-6">
          <AnimatedBridgette
            size="md"
            expression="celebrating"
            animation="celebrate"
            showSpeechBubble={true}
            message={generatedCode 
              ? "Perfect! Share this Family Code with your co-parent so they can link their account. They'll need to create their own Bridge account first, then use this code to connect! 🎉"
              : "Great! I'm creating your family profile and generating a unique Family Code. Your co-parent will use this code to link their account to yours! 🔗"
            }
            position="center"
          />
        </div>

        {!generatedCode ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {onBack && (
                  <Button variant="ghost" size="sm" onClick={onBack} className="p-0 h-auto">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <CardTitle>Create Family Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  We'll generate a unique 6-character Family Code that your co-parent can use to link their account.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleCreateFamily} 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Generate Family Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-green-400 bg-green-50">
            <CardHeader>
              <CardTitle className="text-center text-green-800">Your Family Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center bg-white border-4 border-green-500 rounded-lg px-8 py-6 mb-4">
                  <span className="text-5xl font-bold font-mono text-green-800 tracking-widest">
                    {generatedCode}
                  </span>
                </div>
              </div>

              <Button 
                onClick={copyToClipboard} 
                variant="outline"
                className="w-full border-green-500 text-green-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Your co-parent needs to:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Create their own Bridge account</li>
                    <li>Choose "Link to Existing Family"</li>
                    <li>Enter this Family Code: <strong>{generatedCode}</strong></li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => familyResponse && onSuccess(familyResponse)}
                disabled={!familyResponse}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Join mode
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <AnimatedBridgette
          size="md"
          expression="encouraging"
          animation="float"
          showSpeechBubble={true}
          message="Welcome! Enter the Family Code that your co-parent shared with you. This will link your account to theirs so you can share calendars, messages, and expenses! 🤝"
          position="center"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="p-0 h-auto">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <CardTitle>Link to Existing Family</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent2Name">Your Name</Label>
            <Input
              id="parent2Name"
              value={parent2Name}
              onChange={(e) => setParent2Name(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyCode">Family Code</Label>
            <Input
              id="familyCode"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="text-2xl font-mono tracking-widest text-center"
            />
            <p className="text-xs text-gray-500">
              Enter the 6-character code your co-parent shared with you
            </p>
          </div>

          <Alert>
            <AlertDescription>
              Don't have a Family Code? Your co-parent needs to create a family profile first and share the code with you.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleLinkFamily} 
            disabled={isSubmitting || !familyCode || !parent2Name}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Link to Family
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyCodeSetup;



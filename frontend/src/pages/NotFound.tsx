import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BridgetteAvatar from "@/components/BridgetteAvatar";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-bridge-green/5 to-bridge-yellow/10 flex items-center justify-center p-4">
      <div className="text-center max-w-lg w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
        
        <div className="flex justify-center mb-6">
          <BridgetteAvatar 
            size="lg" 
            expression="thinking"
            showSpeechBubble={true}
            message="Hmm, I can't seem to find that page..."
          />
        </div>

        <h1 className="text-6xl font-bold text-bridge-blue mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8 text-lg">
          It looks like you've ventured into uncharted territory. 
          Let's get you back on track to fair and balanced co-parenting.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 border-bridge-blue text-bridge-blue hover:bg-bridge-blue/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button 
            onClick={() => navigate('/')}
            className="gap-2 bg-bridge-blue hover:bg-bridge-blue/90"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

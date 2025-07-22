import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Wand2, Settings, MoreHorizontal } from "lucide-react";
import FileUpload from "@/components/FileUpload";

interface TextInputProps {
  onAnalysisComplete: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export default function TextInput({ onAnalysisComplete, isAnalyzing, setIsAnalyzing }: TextInputProps) {
  const [text, setText] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sample data for demonstration
  const sampleData = `Interview with User A (E-commerce App):
- Found the checkout process confusing and too many steps
- Wants to save payment methods for faster checkout
- Difficulty finding the search feature on mobile
- Would like more product photos and reviews
- Mentioned app crashes occasionally on older phones

Interview with User B (E-commerce App):
- Loves the product recommendation feature
- Wants wishlist functionality to save items for later
- Found the return process unclear and cumbersome
- Suggested better filtering options for search results
- Would pay for premium features like early access to sales

Interview with User C (E-commerce App):
- Difficulty navigating between product categories
- Wants push notifications for price drops
- Found the app design outdated compared to competitors
- Likes the loyalty points system but wants more rewards
- Suggested integration with social media for sharing purchases

Focus Group Notes:
- All users mentioned wanting better customer support chat
- Dark mode was a frequently requested feature
- Users want more personalized shopping experience
- Concerns about data privacy and security
- Request for offline functionality to browse previously viewed items`;

  const analyzeThemesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/extract-themes', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "AI has successfully extracted themes from your research data",
      });
      onAnalysisComplete();
    },
    onError: () => {
      // If API fails (no OpenAI key), create sample themes
      createSampleThemes();
    },
  });

  const createSampleThemes = async () => {
    const sampleThemes = [
      {
        title: "Checkout & Payment Issues",
        description: "Users struggle with complex checkout process and want saved payment methods for convenience",
        color: "#fecaca",
        quotes: [
          { text: "Found the checkout process confusing and too many steps", source: "User A", transcriptId: 1 },
          { text: "Wants to save payment methods for faster checkout", source: "User A", transcriptId: 1 }
        ],
      },
      {
        title: "Search & Navigation Problems", 
        description: "Difficulty finding search features and navigating between product categories",
        color: "#fed7c3",
        quotes: [
          { text: "Difficulty finding the search feature on mobile", source: "User A", transcriptId: 1 },
          { text: "Difficulty navigating between product categories", source: "User C", transcriptId: 1 }
        ],
      },
      {
        title: "Product Information Needs",
        description: "Users want more comprehensive product details including photos, reviews, and better filtering",
        color: "#fef3c7",
        quotes: [
          { text: "Would like more product photos and reviews", source: "User A", transcriptId: 1 },
          { text: "Suggested better filtering options for search results", source: "User B", transcriptId: 1 }
        ],
      },
      {
        title: "Feature Requests",
        description: "High demand for wishlist, notifications, and dark mode functionality",
        color: "#d1fae5",
        quotes: [
          { text: "Wants wishlist functionality to save items for later", source: "User B", transcriptId: 1 },
          { text: "Wants push notifications for price drops", source: "User C", transcriptId: 1 },
          { text: "Dark mode was a frequently requested feature", source: "Focus Group", transcriptId: 1 }
        ],
      },
      {
        title: "App Performance & Design",
        description: "Concerns about app stability, outdated design, and need for modern interface",
        color: "#dbeafe",
        quotes: [
          { text: "Mentioned app crashes occasionally on older phones", source: "User A", transcriptId: 1 },
          { text: "Found the app design outdated compared to competitors", source: "User C", transcriptId: 1 }
        ],
      },
      {
        title: "Customer Support & Experience",
        description: "Users want better support options and more personalized shopping experience", 
        color: "#e0e7ff",
        quotes: [
          { text: "All users mentioned wanting better customer support chat", source: "Focus Group", transcriptId: 1 },
          { text: "Users want more personalized shopping experience", source: "Focus Group", transcriptId: 1 }
        ],
      }
    ];

    // Create sample themes via API calls
    for (const theme of sampleThemes) {
      try {
        await apiRequest('POST', '/api/themes', theme);
      } catch (error) {
        console.error('Failed to create sample theme:', error);
      }
    }
    
    toast({
      title: "Sample Analysis Complete",
      description: "Sample themes created for demonstration (OpenAI API key needed for real analysis)",
    });
    
    // Refetch themes to show the new sample data
    queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
    setIsAnalyzing(false);
    onAnalysisComplete();
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please paste some research data first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // First add the text as a transcript
    try {
      await apiRequest('POST', '/api/text', { content: text });
      // Then analyze themes
      analyzeThemesMutation.mutate();
    } catch (error) {
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: "Failed to process research data",
        variant: "destructive",
      });
    }
  };

  const handleUseSampleData = () => {
    setText(sampleData);
  };

  const handleClear = () => {
    setText("");
  };

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
  };

  // Count words and characters
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-slate-900">Paste Research Data</CardTitle>
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-slate-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Research Files</DialogTitle>
                </DialogHeader>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your user interview transcripts, research notes, or any text data here...

Example:
'Interview with User A:
- Mentioned difficulty finding the search feature
- Would like more customization options
- Found the onboarding confusing...'

Add as much text as you have - the AI works better with more data!"
            className="w-full h-80 resize-none"
            disabled={isAnalyzing}
          />
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {wordCount} words • {charCount} characters
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={handleUseSampleData}
                disabled={isAnalyzing}
                className="text-blue-600 hover:text-blue-800"
              >
                Use Sample Data
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={!text || isAnalyzing}
                className="text-slate-600 hover:text-slate-800"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleAnalyze}
          disabled={!text.trim() || isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
          size="lg"
        >
          <Wand2 className="w-5 h-5 mr-2" />
          {isAnalyzing ? "Analyzing..." : "Analyze Themes"}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="px-3">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="p-2">
              <p className="text-sm font-medium text-slate-700 mb-2">Analysis Settings</p>
              <p className="text-xs text-slate-500">
                Advanced options will be available with OpenAI API key
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

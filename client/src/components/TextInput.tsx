import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TextInputProps {
  onTextAdded: () => void;
}

export default function TextInput({ onTextAdded }: TextInputProps) {
  const [text, setText] = useState("");
  const { toast } = useToast();

  const addTextMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/text', { content });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Text content added successfully",
      });
      setText("");
      onTextAdded();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text content",
        variant: "destructive",
      });
      return;
    }
    addTextMutation.mutate(text);
  };

  const handleClear = () => {
    setText("");
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-slate-900">Paste Your Research Data</CardTitle>
        <p className="text-slate-600">Start by pasting interview transcripts, research notes, or any text data</p>
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
          className="w-full h-80 resize-none border-blue-300 focus:border-blue-500 focus:ring-blue-500"
          disabled={addTextMutation.isPending}
        />
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-slate-600">
            {text.length} characters {text.length > 0 && `• ${Math.ceil(text.length / 1000)} KB`}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={!text || addTextMutation.isPending}
              className="text-slate-600 hover:text-slate-800"
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || addTextMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 px-6"
              size="lg"
            >
              {addTextMutation.isPending ? "Adding..." : "Add Research Data"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

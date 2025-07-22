import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Theme, Quote } from "@shared/schema";

interface ThemeEditModalProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
}

const THEME_COLORS = [
  { value: "#ef4444", name: "Red", bg: "bg-red-200" },
  { value: "#8b5cf6", name: "Violet", bg: "bg-violet-200" },
  { value: "#06b6d4", name: "Cyan", bg: "bg-cyan-200" },
  { value: "#84cc16", name: "Lime", bg: "bg-lime-200" },
  { value: "#f97316", name: "Orange", bg: "bg-orange-200" },
  { value: "#ec4899", name: "Pink", bg: "bg-pink-200" },
  { value: "#eab308", name: "Yellow", bg: "bg-yellow-200" },
];

export default function ThemeEditModal({ theme, isOpen, onClose }: ThemeEditModalProps) {
  const [title, setTitle] = useState(theme.title);
  const [description, setDescription] = useState(theme.description || "");
  const [color, setColor] = useState(theme.color);
  const [quotes, setQuotes] = useState<Quote[]>(theme.quotes as Quote[]);
  const { toast } = useToast();

  useEffect(() => {
    setTitle(theme.title);
    setDescription(theme.description || "");
    setColor(theme.color);
    setQuotes(theme.quotes as Quote[]);
  }, [theme]);

  const updateThemeMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PATCH', `/api/themes/${theme.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Theme updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateThemeMutation.mutate({
      title,
      description,
      color,
      quotes,
    });
  };

  const addQuote = () => {
    setQuotes([...quotes, { text: "", source: "", transcriptId: 1 }]);
  };

  const updateQuote = (index: number, field: keyof Quote, value: string | number) => {
    const updatedQuotes = [...quotes];
    updatedQuotes[index] = { ...updatedQuotes[index], [field]: value };
    setQuotes(updatedQuotes);
  };

  const removeQuote = (index: number) => {
    setQuotes(quotes.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Theme</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Theme Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter theme title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this theme..."
              className="h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Theme Color
            </label>
            <div className="flex space-x-2">
              {THEME_COLORS.map((themeColor) => (
                <button
                  key={themeColor.value}
                  onClick={() => setColor(themeColor.value)}
                  className={`w-8 h-8 rounded-full ${themeColor.bg} border-2 ${
                    color === themeColor.value ? 'border-slate-900' : 'border-white'
                  } shadow-md focus:ring-2 focus:ring-blue-500`}
                  title={themeColor.name}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-900">
                Supporting Quotes
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addQuote}
                className="text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Quote
              </Button>
            </div>

            <div className="space-y-3">
              {quotes.map((quote, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3">
                  <Textarea
                    value={quote.text}
                    onChange={(e) => updateQuote(index, 'text', e.target.value)}
                    placeholder="Enter quote text..."
                    className="w-full text-sm resize-none border-none focus:ring-0 p-0 mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <Input
                      value={quote.source}
                      onChange={(e) => updateQuote(index, 'source', e.target.value)}
                      placeholder="Source (e.g., Interview #1)"
                      className="text-xs text-slate-600 border-none focus:ring-0 p-0 bg-transparent flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuote(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateThemeMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateThemeMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

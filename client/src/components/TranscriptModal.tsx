import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quote } from "@shared/schema";
import { ExternalLink, FileText } from "lucide-react";

interface TranscriptModalProps {
  quote: Quote;
  transcriptContent: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptModal({ quote, transcriptContent, isOpen, onOpenChange }: TranscriptModalProps) {
  const highlightQuoteInTranscript = (content: string, quoteText: string) => {
    const quoteIndex = content.toLowerCase().indexOf(quoteText.toLowerCase());
    if (quoteIndex === -1) return content;

    const before = content.substring(0, quoteIndex);
    const highlighted = content.substring(quoteIndex, quoteIndex + quoteText.length);
    const after = content.substring(quoteIndex + quoteText.length);

    return { before, highlighted, after, found: true };
  };

  const result = highlightQuoteInTranscript(transcriptContent, quote.text);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transcript Context
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Source: {quote.source}
            </Badge>
            <Badge variant="secondary">
              Transcript ID: {quote.transcriptId}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Selected Quote Highlight */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
              <h4 className="font-medium text-yellow-800 mb-2">Selected Quote</h4>
              <p className="text-gray-700 italic">"{quote.text}"</p>
              <p className="text-sm text-gray-500 mt-1">— {quote.source}</p>
            </div>

            {/* Full Transcript with Highlighted Quote */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-800 mb-3">Full Transcript Context</h4>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {typeof result === 'object' && result.found ? (
                  <>
                    {result.before}
                    <mark className="bg-yellow-200 px-1 py-0.5 rounded font-medium">
                      {result.highlighted}
                    </mark>
                    {result.after}
                  </>
                ) : (
                  <div>
                    <p className="text-amber-600 mb-3 italic">
                      Note: The exact quote text wasn't found in the transcript. This might be due to text processing or paraphrasing during AI analysis.
                    </p>
                    <div className="border-t border-gray-200 pt-3">
                      {transcriptContent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={() => {
              // Copy the full transcript to clipboard
              navigator.clipboard.writeText(transcriptContent);
            }}
          >
            Copy Full Transcript
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
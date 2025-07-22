import { useState } from "react";
import { Edit, Trash2, EllipsisVertical, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Theme, Quote } from "@shared/schema";

interface ThemeCardProps {
  theme: Theme;
  onEdit: (theme: Theme) => void;
  onDelete: (id: number) => void;
  isDragging?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const THEME_COLORS: Record<string, { bg: string; text: string; accent: string; border: string }> = {
  "#ef4444": { bg: "bg-red-200", text: "text-red-900", accent: "bg-red-100", border: "border-red-300" }, // Pain points
  "#10b981": { bg: "bg-green-200", text: "text-green-900", accent: "bg-green-100", border: "border-green-300" }, // What works
  "#eab308": { bg: "bg-yellow-200", text: "text-yellow-900", accent: "bg-yellow-100", border: "border-yellow-300" }, // Feature requests
  "#3b82f6": { bg: "bg-blue-200", text: "text-blue-900", accent: "bg-blue-100", border: "border-blue-300" }, // Emotions/behavior
  "#6b7280": { bg: "bg-gray-200", text: "text-gray-900", accent: "bg-gray-100", border: "border-gray-300" }, // Miscellaneous
};

export default function ThemeCard({ theme, onEdit, onDelete, isDragging = false, isCollapsed = false, onToggleCollapse }: ThemeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = THEME_COLORS[theme.color] || THEME_COLORS["#6b7280"];

  const quotes = theme.quotes as Quote[];
  const displayQuotes = quotes.slice(0, 2); // Show first 2 quotes

  const formatUpdatedTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (isCollapsed) {
    return (
      <Card
        className={`${colors.bg} ${colors.border} theme-card draggable-theme border-2 p-4 relative cursor-move ${
          isHovered ? 'rotate-1' : ''
        } ${isDragging ? 'opacity-50 rotate-3 scale-105' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          minHeight: '80px',
          boxShadow: isHovered 
            ? '0 10px 20px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.05)' 
            : '0 2px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
          transform: isHovered ? 'scale(1.02) rotate(1deg)' : 'scale(1) rotate(0deg)',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className={`font-semibold ${colors.text} text-base leading-tight`}>
              {theme.title}
            </h3>
            <div className={`${colors.text} text-sm font-medium opacity-80 flex items-center space-x-1`}>
              <MessageSquare className="w-3 h-3" />
              <span>{quotes.length}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse?.();
              }}
              className={`${colors.text} hover:opacity-80 p-1`}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(theme);
              }}
              className={`${colors.text} hover:opacity-80 p-1`}
            >
              <EllipsisVertical className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`${colors.bg} ${colors.border} theme-card draggable-theme border-2 p-5 relative cursor-move ${
        isHovered ? 'rotate-2' : ''
      } ${isDragging ? 'opacity-50 rotate-3 scale-105' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        minHeight: '280px',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)' 
          : '0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        transform: isHovered ? 'scale(1.05) rotate(2deg)' : 'scale(1) rotate(0deg)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold ${colors.text} text-lg leading-tight`}>
            {theme.title}
          </h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse?.();
              }}
              className={`${colors.text} hover:opacity-80 p-1`}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(theme);
              }}
              className={`${colors.text} hover:opacity-80 p-1`}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className={`${colors.text} text-sm font-medium opacity-80 flex items-center space-x-1`}>
          <MessageSquare className="w-3 h-3" />
          <span>{quotes.length} supporting quote{quotes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {displayQuotes.map((quote, index) => (
          <blockquote
            key={index}
            className={`${colors.text} text-sm italic ${colors.accent} p-3 rounded-lg`}
          >
            "{quote.text}"
            <cite className={`block text-xs ${colors.text} mt-1 not-italic opacity-75`}>
              - {quote.source}
            </cite>
          </blockquote>
        ))}
        {quotes.length > 2 && (
          <div className={`text-xs ${colors.text} opacity-75`}>
            +{quotes.length - 2} more quote{quotes.length - 2 !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs ${colors.text} opacity-75`}>
          Updated {formatUpdatedTime(theme.updatedAt)}
        </span>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(theme);
            }}
            className={`${colors.text} hover:opacity-80 p-1`}
          >
            <EllipsisVertical className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(theme.id);
            }}
            className={`${colors.text} hover:opacity-80 p-1`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

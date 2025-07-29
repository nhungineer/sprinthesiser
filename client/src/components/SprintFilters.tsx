import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface SprintFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  transcriptType: 'expert_interviews' | 'testing_notes';
}

export interface FilterState {
  searchTerm: string;
  category: string;
  hasQuotes: boolean | null;
  hasHMWs: boolean | null;
  hasAISuggestions: boolean | null;
}

export function SprintFilters({ onFilterChange, transcriptType }: SprintFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    category: 'all',
    hasQuotes: null,
    hasHMWs: null,
    hasAISuggestions: null,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const getCategoryOptions = () => {
    if (transcriptType === 'expert_interviews') {
      return [
        { value: 'all', label: 'All Categories' },
        { value: 'pain_points', label: 'Pain Points' },
        { value: 'opportunities', label: 'Opportunities' },
        { value: 'ideas_hmws', label: 'Ideas/HMWs' },
        { value: 'generic', label: 'Generic' },
      ];
    } else {
      return [
        { value: 'all', label: 'All Categories' },
        { value: 'pain_points', label: "What Didn't Work" },
        { value: 'opportunities', label: 'What Worked' },
        { value: 'ideas_hmws', label: 'Ideas/Next Steps' },
        { value: 'generic', label: 'Generic' },
      ];
    }
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearAllFilters = () => {
    const resetFilters: FilterState = {
      searchTerm: '',
      category: 'all',
      hasQuotes: null,
      hasHMWs: null,
      hasAISuggestions: null,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount = [
    filters.searchTerm !== '',
    filters.category !== 'all',
    filters.hasQuotes !== null,
    filters.hasHMWs !== null,
    filters.hasAISuggestions !== null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-700">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Basic' : 'Advanced'}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search themes, quotes, or AI suggestions..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="min-w-[180px]">
          <Select
            value={filters.category}
            onValueChange={(value) => updateFilters({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {getCategoryOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Has Quotes
            </label>
            <Select
              value={filters.hasQuotes === null ? 'all' : filters.hasQuotes.toString()}
              onValueChange={(value) => 
                updateFilters({ 
                  hasQuotes: value === 'all' ? null : value === 'true' 
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">With Quotes</SelectItem>
                <SelectItem value="false">No Quotes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Has HMWs
            </label>
            <Select
              value={filters.hasHMWs === null ? 'all' : filters.hasHMWs.toString()}
              onValueChange={(value) => 
                updateFilters({ 
                  hasHMWs: value === 'all' ? null : value === 'true' 
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">With HMWs</SelectItem>
                <SelectItem value="false">No HMWs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Has AI Steps
            </label>
            <Select
              value={filters.hasAISuggestions === null ? 'all' : filters.hasAISuggestions.toString()}
              onValueChange={(value) => 
                updateFilters({ 
                  hasAISuggestions: value === 'all' ? null : value === 'true' 
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">With AI Steps</SelectItem>
                <SelectItem value="false">No AI Steps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
import { FileText, Download, FileSpreadsheet, FileImage, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ExportSectionProps {
  disabled?: boolean;
}

export default function ExportSection({ disabled = false }: ExportSectionProps) {
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/export/${format}`);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === 'excel' || format === 'pdf') {
        // Handle structured data for complex formats
        const data = await response.json();
        toast({
          title: "Export Ready",
          description: `${format.toUpperCase()} export data prepared. This would typically trigger a download.`,
        });
      } else {
        // Handle direct file downloads for simple formats
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `themes.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Complete",
          description: `Themes exported as ${format.toUpperCase()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportOptions = [
    {
      format: 'excel',
      label: 'Excel',
      icon: FileSpreadsheet,
      description: 'Spreadsheet with themes and quotes',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      format: 'pdf',
      label: 'PDF',
      icon: FileText,
      description: 'Formatted report document',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      format: 'csv',
      label: 'CSV',
      icon: FileSpreadsheet,
      description: 'Comma-separated values',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      format: 'json',
      label: 'JSON',
      icon: Code,
      description: 'Raw structured data',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Export Results</CardTitle>
        <p className="text-sm text-slate-600">Download your theme analysis in various formats</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {exportOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.format}
                onClick={() => handleExport(option.format)}
                disabled={disabled}
                className={`flex items-center space-x-2 ${option.color} text-white`}
                title={option.description}
              >
                <IconComponent className="w-4 h-4" />
                <span>{option.label}</span>
              </Button>
            );
          })}
        </div>
        
        {disabled && (
          <p className="text-sm text-slate-500 mt-3">
            Extract themes first to enable export functionality
          </p>
        )}
      </CardContent>
    </Card>
  );
}

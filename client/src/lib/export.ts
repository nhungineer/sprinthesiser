import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Theme, Quote } from '@shared/schema';

export const exportToExcel = (themes: Theme[]) => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create main themes sheet
  const themesData = themes.map(theme => ({
    'Theme Title': theme.title,
    'Description': theme.description || '',
    'Color Category': getColorCategory(theme.color),
    'Number of Quotes': (theme.quotes as Quote[]).length,
    'Last Updated': new Date(theme.updatedAt).toLocaleDateString()
  }));
  
  const themesWS = XLSX.utils.json_to_sheet(themesData);
  XLSX.utils.book_append_sheet(wb, themesWS, 'Themes Overview');
  
  // Create detailed quotes sheet
  const quotesData: any[] = [];
  themes.forEach(theme => {
    const quotes = theme.quotes as Quote[];
    quotes.forEach(quote => {
      quotesData.push({
        'Theme Title': theme.title,
        'Quote Text': quote.text,
        'Source': quote.source,
        'Color Category': getColorCategory(theme.color)
      });
    });
  });
  
  const quotesWS = XLSX.utils.json_to_sheet(quotesData);
  XLSX.utils.book_append_sheet(wb, quotesWS, 'Detailed Quotes');
  
  // Save file
  XLSX.writeFile(wb, `ThemeSync-Export-${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (themes: Theme[]) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 30;
  
  // Title
  pdf.setFontSize(20);
  pdf.text('ThemeSync - Research Theme Analysis', margin, yPosition);
  yPosition += 20;
  
  pdf.setFontSize(12);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  pdf.text(`Total Themes: ${themes.length}`, pageWidth - 60, yPosition);
  yPosition += 30;
  
  themes.forEach((theme, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    
    // Theme title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${theme.title}`, margin, yPosition);
    yPosition += 10;
    
    // Color category
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Category: ${getColorCategory(theme.color)}`, margin + 5, yPosition);
    yPosition += 8;
    
    // Description
    if (theme.description) {
      const descLines = pdf.splitTextToSize(theme.description, pageWidth - 2 * margin);
      pdf.text(descLines, margin + 5, yPosition);
      yPosition += descLines.length * 5 + 5;
    }
    
    // Quotes
    const quotes = theme.quotes as Quote[];
    pdf.text(`Supporting Quotes (${quotes.length}):`, margin + 5, yPosition);
    yPosition += 8;
    
    quotes.slice(0, 3).forEach(quote => { // Show max 3 quotes per theme
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      const quoteText = `"${quote.text}" - ${quote.source}`;
      const quoteLines = pdf.splitTextToSize(quoteText, pageWidth - 2 * margin - 10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(quoteLines, margin + 10, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += quoteLines.length * 5 + 3;
    });
    
    if (quotes.length > 3) {
      pdf.text(`... and ${quotes.length - 3} more quotes`, margin + 10, yPosition);
      yPosition += 8;
    }
    
    yPosition += 15; // Space between themes
  });
  
  // Save file
  pdf.save(`ThemeSync-Export-${new Date().toISOString().split('T')[0]}.pdf`);
};

const getColorCategory = (color: string): string => {
  const colorMap: Record<string, string> = {
    '#ef4444': 'Pain Points',
    '#10b981': 'What Works',
    '#eab308': 'Feature Requests',
    '#3b82f6': 'Emotions/Behavior',
    '#6b7280': 'Miscellaneous'
  };
  return colorMap[color] || 'Other';
};

// Sorting functions
export const sortThemes = (themes: Theme[], sortType: 'az' | 'color'): Theme[] => {
  const sorted = [...themes];
  
  if (sortType === 'az') {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  
  if (sortType === 'color') {
    const colorOrder = ['#ef4444', '#10b981', '#eab308', '#3b82f6', '#6b7280'];
    return sorted.sort((a, b) => {
      const aIndex = colorOrder.indexOf(a.color);
      const bIndex = colorOrder.indexOf(b.color);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }
  
  return sorted;
};
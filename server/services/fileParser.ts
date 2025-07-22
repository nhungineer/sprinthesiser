import { FileUploadType } from "@shared/schema";

export class FileParserService {
  static async parseFile(file: FileUploadType): Promise<string> {
    const { content, fileType, filename } = file;
    
    try {
      switch (fileType.toLowerCase()) {
        case 'txt':
        case 'md':
          return this.parseTextFile(content);
        
        case 'pdf':
          return this.parsePdfFile(content);
        
        case 'doc':
        case 'docx':
          return this.parseWordFile(content);
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  private static parseTextFile(content: string): string {
    // Clean up common text formatting issues
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .trim();
  }

  private static parsePdfFile(content: string): string {
    // For now, assume content is already extracted text
    // In production, you'd use a library like pdf-parse
    return this.parseTextFile(content);
  }

  private static parseWordFile(content: string): string {
    // For now, assume content is already extracted text
    // In production, you'd use a library like mammoth
    return this.parseTextFile(content);
  }

  static validateFile(file: FileUploadType): { valid: boolean; error?: string } {
    const allowedTypes = ['txt', 'md', 'pdf', 'doc', 'docx'];
    
    if (!file.filename) {
      return { valid: false, error: 'Filename is required' };
    }
    
    if (!file.content) {
      return { valid: false, error: 'File content is required' };
    }
    
    if (!allowedTypes.includes(file.fileType.toLowerCase())) {
      return { 
        valid: false, 
        error: `Unsupported file type. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
    
    // Check file size (assuming content is base64 or text)
    const contentSize = file.content.length;
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (contentSize > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    return { valid: true };
  }

  static formatForAI(content: string): string {
    // Clean and format text for optimal AI parsing
    return content
      .replace(/[^\w\s\.\,\?\!\:\;\-\'\"\(\)]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

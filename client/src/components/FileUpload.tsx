import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { CloudUpload, File, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onUploadComplete: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.transcripts.length} files uploaded successfully`,
      });
      onUploadComplete();
      
      // Update file statuses to success
      setUploadedFiles(prev => 
        prev.map(file => ({ ...file, status: 'success' as const }))
      );
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Update file statuses to error
      setUploadedFiles(prev => 
        prev.map(file => ({ ...file, status: 'error' as const }))
      );
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add files to state
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start upload
    uploadMutation.mutate(acceptedFiles);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Upload Research Files</CardTitle>
        <p className="text-sm text-slate-600">Support for .txt, .doc, .docx, .md, .pdf files</p>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mb-4">
            <CloudUpload className="mx-auto h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {isDragActive ? 'Drop files here' : 'Drop files here'}
          </h3>
          <p className="text-sm text-slate-600 mb-4">or click to browse</p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Choose Files
          </Button>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  file.status === 'success' 
                    ? 'bg-green-50 border-green-200'
                    : file.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {file.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : file.status === 'error' ? (
                    <X className="h-5 w-5 text-red-600" />
                  ) : (
                    <File className="h-5 w-5 text-gray-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    file.status === 'success' 
                      ? 'text-green-900'
                      : file.status === 'error'
                      ? 'text-red-900'
                      : 'text-gray-900'
                  }`}>
                    {file.name}
                  </span>
                  <span className={`text-xs ${
                    file.status === 'success' 
                      ? 'text-green-600'
                      : file.status === 'error'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className={
                    file.status === 'success' 
                      ? 'text-green-600 hover:text-green-800'
                      : file.status === 'error'
                      ? 'text-red-600 hover:text-red-800'
                      : 'text-gray-600 hover:text-gray-800'
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

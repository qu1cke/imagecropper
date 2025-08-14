import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImageUploaderProps {
  onImagesUploaded: (files: File[]) => void;
  isProcessing?: boolean;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

const ImageUploader = ({
  onImagesUploaded,
  isProcessing = false,
  maxFileSize = 10, // Default 10MB
  acceptedFileTypes = ["image/jpeg", "image/png"],
}: ImageUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errorMessages = rejectedFiles.map((file) => {
          if (file.errors[0].code === "file-too-large") {
            return `${file.file.name} is too large. Max size is ${maxFileSize}MB.`;
          }
          if (file.errors[0].code === "file-invalid-type") {
            return `${file.file.name} has an invalid file type. Accepted types: JPG, PNG.`;
          }
          return `${file.file.name} couldn't be uploaded.`;
        });
        setErrors(errorMessages);
      } else {
        setErrors([]);
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        setFiles(acceptedFiles);
        // Simulate upload progress
        simulateUploadProgress();
        // Pass files to parent component
        onImagesUploaded(acceptedFiles);
      }
    },
    [maxFileSize, onImagesUploaded],
  );

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onImagesUploaded(newFiles);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setErrors([]);
    setUploadProgress(0);
    onImagesUploaded([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-12 w-12 text-gray-400" />
          <div className="space-y-1">
            <p className="text-lg font-medium">Drag & drop images here</p>
            <p className="text-sm text-gray-500">
              or click to select files (JPG, PNG)
            </p>
          </div>
          <Button variant="outline" disabled={isProcessing}>
            Select Files
          </Button>
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error uploading files</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload progress */}
      {files.length > 0 && uploadProgress < 100 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading {files.length} file(s)...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Uploaded Images ({files.length})</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group border rounded-md p-2 bg-gray-50"
              >
                <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                  {URL.createObjectURL && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                      onLoad={() =>
                        URL.revokeObjectURL(URL.createObjectURL(file))
                      }
                    />
                  )}
                </div>
                <div className="mt-2 text-xs truncate">{file.name}</div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={isProcessing}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 rounded-md">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" />
          <span className="text-blue-700">Processing images with AI...</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

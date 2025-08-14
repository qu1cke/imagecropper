import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Archive, Check, CheckSquare, Square } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DownloadManagerProps {
  processedImages: Array<{
    id: string;
    originalName: string;
    processedBlob?: Blob;
    croppedUrl?: string;
    isProcessed: boolean;
  }>;
  onDownloadSingle?: (imageId: string) => void;
  onDownloadAll?: (prefix: string) => void;
}

const DownloadManager = ({
  processedImages = [],
  onDownloadSingle = () => {},
  onDownloadAll = () => {},
}: DownloadManagerProps) => {
  const [filePrefix, setFilePrefix] = useState("portrait_");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const processedCount = processedImages.filter(
    (img) => img.isProcessed,
  ).length;
  const totalImages = processedImages.length;
  const allProcessed = processedCount === totalImages && totalImages > 0;
  const selectedCount = selectedImages.size;

  // Initialize with all processed images selected
  useEffect(() => {
    const processedImageIds = processedImages
      .filter((img) => img.isProcessed)
      .map((img) => img.id);
    setSelectedImages(new Set(processedImageIds));
  }, [processedImages]);

  // Function to download a single image
  const downloadSingleImage = (imageId: string) => {
    const image = processedImages.find((img) => img.id === imageId);
    if (!image || !image.croppedUrl) return;

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = image.croppedUrl;
    link.download = `${filePrefix}${image.originalName.replace(/\.[^/.]+$/, "")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to toggle image selection
  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Function to select/deselect all images
  const toggleSelectAll = () => {
    const processedImageIds = processedImages
      .filter((img) => img.isProcessed)
      .map((img) => img.id);

    if (selectedImages.size === processedImageIds.length) {
      // Deselect all
      setSelectedImages(new Set());
    } else {
      // Select all processed images
      setSelectedImages(new Set(processedImageIds));
    }
  };

  // Function to download all selected images as ZIP
  const downloadSelectedAsZip = async (prefix: string) => {
    const selectedImgs = processedImages.filter(
      (img) => img.isProcessed && img.croppedUrl && selectedImages.has(img.id),
    );
    if (selectedImgs.length === 0) return;

    try {
      // Import JSZip dynamically
      const JSZip = (await import("https://cdn.skypack.dev/jszip")).default;
      const zip = new JSZip();

      // Add each selected image to the zip
      for (const img of selectedImgs) {
        if (img.croppedUrl) {
          const response = await fetch(img.croppedUrl);
          const blob = await response.blob();
          const filename = `${prefix}${img.originalName.replace(/\.[^/.]+$/, "")}.png`;
          zip.file(filename, blob);
        }
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${prefix}portraits.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      alert(
        "Error creating ZIP file. Please try downloading images individually.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Selection */}
      <Card className="w-full bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Select Images to Download
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedCount > 0 && selectedCount === processedCount}
                onCheckedChange={toggleSelectAll}
                className="h-4 w-4"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Select All ({processedCount})
              </label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedCount} of {processedCount} processed images selected
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {processedImages
                .filter((img) => img.isProcessed)
                .map((image) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`image-${image.id}`}
                      checked={selectedImages.has(image.id)}
                      onCheckedChange={() => toggleImageSelection(image.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-shrink-0">
                      {image.croppedUrl && (
                        <img
                          src={image.croppedUrl}
                          alt={image.originalName}
                          className="w-12 h-16 object-cover rounded border"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`image-${image.id}`}
                        className="text-sm font-medium cursor-pointer block truncate"
                      >
                        {image.originalName}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        300 × 400 pixels
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadSingleImage(image.id)}
                      className="flex-shrink-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

              {processedCount === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No processed images available for download</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card className="w-full bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium">Download Options</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCount} images selected for download
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
              <div className="flex-grow sm:flex-grow-0 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <label htmlFor="prefix" className="text-sm whitespace-nowrap">
                    File prefix:
                  </label>
                  <Input
                    id="prefix"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="Enter file prefix"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        className="flex-1 sm:flex-none"
                        disabled={selectedCount === 0}
                        onClick={() => downloadSelectedAsZip(filePrefix)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Download Selected as ZIP ({selectedCount})
                        {selectedCount > 0 && (
                          <Check className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download selected images as a ZIP file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadManager;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import ImageUploader from "@/components/ImageUploader";
import ImageEditor from "@/components/ImageEditor";
import ImageGallery from "@/components/ImageGallery";
import DownloadManager from "@/components/DownloadManager";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  croppedUrl?: string;
  isProcessed: boolean;
  isEdited: boolean;
  isAccepted: boolean;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    position: { x: number; y: number };
    isGreyscale?: boolean;
  };
}

const ImageProcessor = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Mock function to simulate AI processing
  const processImages = (files: File[]) => {
    setError(null);
    setProcessingProgress(0);

    // Create processed image objects
    const newImages = files.map((file) => {
      return {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalFile: file,
        previewUrl: URL.createObjectURL(file),
        isProcessed: false,
        isEdited: false,
        isAccepted: false,
      };
    });

    // Simulate AI processing with progress updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProcessingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        // Update images as processed
        const processedImages = newImages.map((img) => ({
          ...img,
          isProcessed: true,
          // In a real app, this would be the AI-generated crop
          croppedUrl: img.previewUrl,
        }));

        setImages([...images, ...processedImages]);
        setSelectedImageId(processedImages[0]?.id || null);
        setActiveTab("edit");
      }
    }, 300);
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length === 0) {
      setError("No valid files selected");
      return;
    }

    processImages(files);
  };

  const handleImageEdit = (
    imageId: string,
    croppedUrl: string,
    cropData?: any,
  ) => {
    setImages(
      images.map((img) =>
        img.id === imageId
          ? {
              ...img,
              croppedUrl,
              isEdited: true,
              crop: cropData,
              isAccepted: true,
            }
          : img,
      ),
    );
  };

  const handleDeleteImage = (imageId: string) => {
    const newImages = images.filter((img) => img.id !== imageId);
    setImages(newImages);

    if (selectedImageId === imageId) {
      setSelectedImageId(newImages[0]?.id || null);
    }
  };

  const handleAcceptImage = (imageId: string, isAccepted: boolean) => {
    setImages(
      images.map((img) => {
        if (img.id === imageId) {
          // If accepting and there's no cropped URL yet, trigger a save from current editor state
          if (isAccepted && !img.croppedUrl && selectedImageId === imageId) {
            // This will be handled by the editor's save function
            return { ...img, isAccepted, isEdited: true };
          }
          return {
            ...img,
            isAccepted,
            isEdited: isAccepted ? true : img.isEdited,
          };
        }
        return img;
      }),
    );
  };

  const selectedImage = images.find((img) => img.id === selectedImageId);
  const allImagesProcessed =
    images.length > 0 && images.every((img) => img.isProcessed);
  const allImagesEdited =
    images.length > 0 && images.every((img) => img.isEdited || img.isAccepted);

  return (
    <div className="container mx-auto py-8 px-4 bg-background min-h-screen">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            AI Portrait Auto-Cropping Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="edit" disabled={!allImagesProcessed}>
                Edit
              </TabsTrigger>
              <TabsTrigger value="download" disabled={images.length === 0}>
                Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <ImageUploader onImagesUploaded={handleImageUpload} />

              {processingProgress > 0 && processingProgress < 100 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Processing images with AI...
                  </p>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <div className="flex gap-6 h-[800px]">
                {/* Left Column - Original Image Thumbnails (1/6 width) */}
                <div className="w-1/6 min-w-[200px]">
                  <ImageGallery
                    images={images.map((img) => ({
                      id: img.id,
                      src: img.previewUrl,
                      name: img.originalFile.name,
                      status: img.isProcessed ? "complete" : "processing",
                      isAccepted: img.isAccepted,
                      croppedUrl: img.croppedUrl,
                      crop: img.crop,
                    }))}
                    selectedImageId={selectedImageId}
                    onSelectImage={setSelectedImageId}
                    onAcceptImage={handleAcceptImage}
                    onMassAccept={(imageId) => {
                      setSelectedImageId(imageId);
                      setActiveTab("edit");
                    }}
                  />
                </div>

                {/* Middle Column - Final Result Preview */}
                <div className="w-1/3">
                  {selectedImage ? (
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">Final Result</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div
                            className="border border-border rounded-md overflow-hidden"
                            style={{
                              width: "240px",
                              height: "320px",
                            }}
                          >
                            {selectedImage.croppedUrl &&
                            selectedImage.isEdited ? (
                              <img
                                src={selectedImage.croppedUrl}
                                alt="Final result preview"
                                className="w-full h-full object-cover"
                                style={{
                                  filter:
                                    selectedImage.crop?.isGreyscale !== false
                                      ? "grayscale(100%)"
                                      : "none",
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">
                                  {selectedImage.isAccepted
                                    ? "Click Save Crop to see result"
                                    : "No crop saved yet"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`accept-${selectedImage.id}`}
                            checked={selectedImage.isAccepted}
                            onChange={(e) =>
                              handleAcceptImage(
                                selectedImage.id,
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`accept-${selectedImage.id}`}
                            className="text-sm font-medium"
                          >
                            Accept this crop
                          </label>
                        </div>

                        <div className="text-xs text-muted-foreground text-center">
                          <p>{selectedImage.originalFile.name}</p>
                          <p>300 × 400 pixels</p>
                          <p>
                            {selectedImage.crop?.isGreyscale !== false
                              ? "Greyscale"
                              : "Color"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="h-full">
                      <CardContent className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          Select an image to preview
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Editing Dialog */}
                <div className="flex-1">
                  {selectedImage ? (
                    <ImageEditor
                      images={images.map((img) => ({
                        id: img.id,
                        src: img.previewUrl,
                        name: img.originalFile.name,
                        processed: img.isProcessed,
                        crop: img.crop,
                      }))}
                      selectedImageId={selectedImageId}
                      onSelectImage={setSelectedImageId}
                      onImageSave={(id, crop) => {
                        handleImageEdit(
                          id,
                          crop.croppedUrl || selectedImage.previewUrl,
                          crop,
                        );
                      }}
                    />
                  ) : (
                    <Card className="h-full">
                      <CardContent className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          Select an image to edit
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="download" className="space-y-4">
              <DownloadManager
                processedImages={images.map((img) => ({
                  id: img.id,
                  originalName: img.originalFile.name,
                  isProcessed:
                    img.isProcessed && (img.isEdited || img.isAccepted),
                  croppedUrl:
                    img.croppedUrl ||
                    (img.isAccepted ? img.previewUrl : undefined),
                }))}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageProcessor;

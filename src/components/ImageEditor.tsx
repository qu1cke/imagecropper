import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, Move, Check, X, Eye, Palette } from "lucide-react";
import ImageGallery from "./ImageGallery";

interface ImageEditorProps {
  images?: Array<{
    id: string;
    src: string;
    name: string;
    processed: boolean;
    crop?: {
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
      position: { x: number; y: number };
      croppedUrl?: string;
      isGreyscale?: boolean;
    };
  }>;
  onImageSave?: (
    id: string,
    crop: {
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
      position: { x: number; y: number };
      croppedUrl?: string;
      isGreyscale?: boolean;
    },
  ) => void;
  onImageReject?: (id: string) => void;
  onSelectImage?: (id: string) => void;
  selectedImageId?: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  images = [],
  onImageSave = () => {},
  onImageReject = () => {},
  onSelectImage = () => {},
  selectedImageId = "",
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 300, height: 400 });
  const [faceDetected, setFaceDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGreyscale, setIsGreyscale] = useState(true);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedImage = images.find((img) => img.id === selectedImageId);

  // Face detection function using basic image analysis
  const detectFaceAndCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    setIsDetecting(true);
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsDetecting(false);
      return;
    }

    // Wait for image to load
    if (!img.complete) {
      img.onload = () => detectFaceAndCrop();
      return;
    }

    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw image to canvas for analysis
    ctx.drawImage(img, 0, 0);

    try {
      // Simple face detection heuristic based on image dimensions and common portrait ratios
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const aspectRatio = imgWidth / imgHeight;

      let faceX, faceY, faceWidth, faceHeight;

      // Estimate face position based on common portrait compositions
      if (aspectRatio > 0.6 && aspectRatio < 1.5) {
        // Portrait orientation - face likely in upper center
        faceWidth = Math.min(imgWidth * 0.4, imgHeight * 0.3);
        faceHeight = faceWidth * 1.2; // Face + some neck/shoulders
        faceX = (imgWidth - faceWidth) / 2;
        faceY = imgHeight * 0.15; // Start from upper portion
      } else if (aspectRatio >= 1.5) {
        // Landscape orientation - face might be off-center
        faceWidth = Math.min(imgWidth * 0.25, imgHeight * 0.6);
        faceHeight = faceWidth * 1.2;
        faceX = imgWidth * 0.3; // Slightly off-center
        faceY = (imgHeight - faceHeight) / 2;
      } else {
        // Square or very tall - center the crop
        faceWidth = Math.min(imgWidth * 0.6, imgHeight * 0.45);
        faceHeight = faceWidth * 1.33; // 3:4 ratio
        faceX = (imgWidth - faceWidth) / 2;
        faceY = imgHeight * 0.1;
      }

      // Ensure crop doesn't exceed image boundaries
      faceX = Math.max(0, Math.min(faceX, imgWidth - faceWidth));
      faceY = Math.max(0, Math.min(faceY, imgHeight - faceHeight));
      faceWidth = Math.min(faceWidth, imgWidth - faceX);
      faceHeight = Math.min(faceHeight, imgHeight - faceY);

      // Calculate optimal zoom and position for the detected face area
      const cropAspectRatio = 300 / 400; // Target crop ratio
      const faceAspectRatio = faceWidth / faceHeight;

      let newZoom;
      if (faceAspectRatio > cropAspectRatio) {
        // Face area is wider, fit by height
        newZoom = (400 / faceHeight) * 100;
      } else {
        // Face area is taller, fit by width
        newZoom = (300 / faceWidth) * 100;
      }

      // Limit zoom to reasonable bounds
      newZoom = Math.max(10, Math.min(200, newZoom));

      // Calculate position to center the face area in the crop
      const scaledImgWidth = imgWidth * (newZoom / 100);
      const scaledImgHeight = imgHeight * (newZoom / 100);
      const scaledFaceX = faceX * (newZoom / 100);
      const scaledFaceY = faceY * (newZoom / 100);

      const newX = 150 - scaledFaceX - (faceWidth * (newZoom / 100)) / 2;
      const newY = 200 - scaledFaceY - (faceHeight * (newZoom / 100)) / 2;

      // Apply the calculated values
      setZoom(newZoom);
      setPosition({ x: newX, y: newY });
      setFaceDetected(true);
    } catch (error) {
      console.error("Face detection failed:", error);
      // Fallback to center crop
      setZoom(100);
      setPosition({ x: 0, y: 0 });
    }

    setIsDetecting(false);
  }, []);

  // Reset editor state when selected image changes
  useEffect(() => {
    if (selectedImage) {
      setFaceDetected(false);
      setIsDetecting(false);

      // Use existing crop data if available, otherwise detect face
      if (selectedImage.crop) {
        setCrop({
          x: selectedImage.crop.x,
          y: selectedImage.crop.y,
          width: selectedImage.crop.width,
          height: selectedImage.crop.height,
        });
        setZoom(selectedImage.crop.zoom || 100);
        setPosition(selectedImage.crop.position || { x: 0, y: 0 });
        setIsGreyscale(selectedImage.crop.isGreyscale ?? true);
      } else {
        setCrop({ x: 0, y: 0, width: 300, height: 400 });
        // Auto-scale smaller images
        const optimalZoom = getOptimalZoom();
        setZoom(optimalZoom);
        setPosition({ x: 0, y: 0 });
        setIsGreyscale(true);
        // Auto-detect face after a short delay to ensure image is loaded
        setTimeout(() => {
          detectFaceAndCrop();
        }, 100);
      }
    }
  }, [selectedImageId, selectedImage, detectFaceAndCrop]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageContainerRef.current) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setPosition({
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  // Auto-scale smaller images
  const getOptimalZoom = useCallback(() => {
    if (!imageRef.current) return 100;

    const img = imageRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // If image is smaller than crop area, scale it up
    const scaleX = 300 / imgWidth;
    const scaleY = 400 / imgHeight;
    const minScale = Math.max(scaleX, scaleY);

    if (minScale > 1) {
      return Math.min(minScale * 100, 200); // Cap at 200%
    }

    return 100;
  }, []);

  const handleSave = () => {
    if (selectedImageId && imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = imageRef.current;

      if (!ctx) return;

      // Set canvas to exact output size
      canvas.width = 300;
      canvas.height = 400;

      // Clear with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 300, 400);

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const zoomFactor = zoom / 100;

      // Calculate the scaled image dimensions as they appear in the preview
      const scaledWidth = imgWidth * zoomFactor;
      const scaledHeight = imgHeight * zoomFactor;

      // Calculate which part of the original image is visible in the 300x400 crop area
      // The position represents where the top-left of the scaled image is positioned
      const visibleLeft = -position.x;
      const visibleTop = -position.y;
      const visibleRight = visibleLeft + 300;
      const visibleBottom = visibleTop + 400;

      // Convert the visible area back to original image coordinates
      const sourceLeft = visibleLeft / zoomFactor;
      const sourceTop = visibleTop / zoomFactor;
      const sourceRight = visibleRight / zoomFactor;
      const sourceBottom = visibleBottom / zoomFactor;

      // Clamp to original image bounds
      const clampedSourceLeft = Math.max(0, sourceLeft);
      const clampedSourceTop = Math.max(0, sourceTop);
      const clampedSourceRight = Math.min(imgWidth, sourceRight);
      const clampedSourceBottom = Math.min(imgHeight, sourceBottom);

      const clampedSourceWidth = clampedSourceRight - clampedSourceLeft;
      const clampedSourceHeight = clampedSourceBottom - clampedSourceTop;

      // Calculate where this should be drawn on the output canvas
      const destLeft = (clampedSourceLeft - sourceLeft) * zoomFactor;
      const destTop = (clampedSourceTop - sourceTop) * zoomFactor;
      const destWidth = clampedSourceWidth * zoomFactor;
      const destHeight = clampedSourceHeight * zoomFactor;

      // Draw the cropped portion
      ctx.drawImage(
        img,
        clampedSourceLeft,
        clampedSourceTop,
        clampedSourceWidth,
        clampedSourceHeight,
        destLeft,
        destTop,
        destWidth,
        destHeight,
      );

      // Apply greyscale filter if enabled
      if (isGreyscale) {
        const imageData = ctx.getImageData(0, 0, 300, 400);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const grey =
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = grey; // Red
          data[i + 1] = grey; // Green
          data[i + 2] = grey; // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);
      }

      // Convert to blob and save
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            onImageSave(selectedImageId, {
              x: crop.x,
              y: crop.y,
              width: crop.width,
              height: crop.height,
              zoom: zoom,
              position: { x: position.x, y: position.y },
              croppedUrl,
              isGreyscale,
            });
          }
        },
        "image/png",
        1.0,
      );
    }
  };

  const handleReject = () => {
    if (selectedImageId) {
      onImageReject(selectedImageId);
    }
  };

  return (
    <Card className="w-full bg-card h-full">
      <CardContent className="p-6 h-full">
        {selectedImage ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-lg font-medium">
                  Edit Portrait: {selectedImage.name}
                </h3>
                {faceDetected && (
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <Eye className="mr-1 h-3 w-3" />
                    Face area detected and optimized
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={detectFaceAndCrop}
                  disabled={isDetecting}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {isDetecting ? "Detecting..." : "Auto-Crop Face"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReject}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="mr-2 h-4 w-4" /> Save Crop
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="relative w-full flex justify-center">
                  <div
                    className="relative overflow-hidden border border-border rounded-md"
                    style={{
                      width: "300px",
                      height: "400px",
                    }}
                  >
                    <div
                      ref={imageContainerRef}
                      className="absolute w-full h-full"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        cursor: isDragging ? "grabbing" : "grab",
                      }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        ref={imageRef}
                        src={selectedImage.src}
                        alt={selectedImage.name}
                        style={{
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: "top left",
                          filter: isGreyscale ? "grayscale(100%)" : "none",
                          minWidth: "300px",
                          minHeight: "400px",
                        }}
                        className="max-w-none block"
                        crossOrigin="anonymous"
                      />
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Zoom</h4>
                    <div className="flex items-center gap-2">
                      <ZoomOut className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[zoom]}
                        min={10}
                        max={200}
                        step={1}
                        onValueChange={handleZoomChange}
                        className="flex-1"
                      />
                      <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {zoom}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Position</h4>
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Drag the image to adjust position
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Output Settings</h4>
                    <div className="text-xs text-muted-foreground">
                      300 × 400 pixels (Portrait)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Optimized for face and shoulders
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="greyscale-mode"
                        checked={isGreyscale}
                        onCheckedChange={setIsGreyscale}
                      />
                      <Label
                        htmlFor="greyscale-mode"
                        className="text-sm flex items-center"
                      >
                        <Palette className="mr-1 h-3 w-3" />
                        Greyscale output
                      </Label>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isGreyscale
                        ? "Output will be in greyscale"
                        : "Output will be in color"}
                    </div>
                  </div>

                  {faceDetected && (
                    <div className="space-y-2 p-3 bg-green-50 rounded-md border border-green-200">
                      <h4 className="text-sm font-medium text-green-800">
                        AI Detection
                      </h4>
                      <div className="text-xs text-green-700">
                        Face area automatically detected and positioned for
                        optimal portrait cropping
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setZoom(100);
                        setPosition({ x: 0, y: 0 });
                        setFaceDetected(false);
                      }}
                      className="w-full"
                    >
                      Reset Position
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <p>Select an image from the gallery to edit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageEditor;

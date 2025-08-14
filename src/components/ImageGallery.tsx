import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ImageItem {
  id: string;
  src: string;
  name: string;
  status: "processing" | "complete" | "error" | "selected";
  isAccepted?: boolean;
  croppedUrl?: string;
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

interface ImageGalleryProps {
  images: ImageItem[];
  onSelectImage: (imageId: string) => void;
  selectedImageId?: string;
  onAcceptImage?: (imageId: string, isAccepted: boolean) => void;
  onMassAccept?: (imageId: string) => void;
}

const ImageGallery = ({
  images = [
    {
      id: "1",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
      name: "profile-photo-1.jpg",
      status: "complete",
      isAccepted: false,
    },
    {
      id: "2",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      name: "profile-photo-2.jpg",
      status: "processing",
      isAccepted: false,
    },
    {
      id: "3",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
      name: "profile-photo-3.jpg",
      status: "selected",
      isAccepted: true,
    },
    {
      id: "4",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
      name: "profile-photo-4.jpg",
      status: "error",
      isAccepted: false,
    },
  ],
  onSelectImage = () => {},
  selectedImageId = "3",
  onAcceptImage = () => {},
  onMassAccept = () => {},
}: ImageGalleryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "complete":
        return "Complete";
      case "processing":
        return "Processing";
      case "error":
        return "Error";
      case "selected":
        return "Selected";
      default:
        return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "selected":
        return "bg-blue-100 text-blue-800";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full bg-white border rounded-md shadow-sm">
      <div className="p-2 border-b">
        <h3 className="text-sm font-medium">Thumbnails</h3>
        <p className="text-xs text-muted-foreground">{images.length} images</p>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-2 space-y-3">
          {images.map((image) => (
            <div key={image.id} className="space-y-1">
              {/* Original Image Thumbnail */}
              <div
                className={`relative rounded-md overflow-hidden cursor-pointer transition-all ${image.id === selectedImageId ? "ring-2 ring-primary ring-offset-1" : "hover:opacity-90"}`}
                onClick={() => onSelectImage(image.id)}
              >
                <div
                  className="w-full"
                  style={{ aspectRatio: "3/4", height: "160px" }}
                >
                  <img
                    src={
                      image.isAccepted && image.croppedUrl
                        ? image.croppedUrl
                        : image.src
                    }
                    alt={image.name}
                    className="w-full h-full object-cover"
                    style={{
                      filter:
                        image.isAccepted && image.crop?.isGreyscale !== false
                          ? "grayscale(100%)"
                          : "none",
                    }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-white">
                  <p className="text-xs truncate">{image.name.split(".")[0]}</p>
                </div>
                <Badge
                  className={`absolute top-1 right-1 text-xs px-1 py-0 ${image.isAccepted ? "bg-green-500 text-white" : getStatusColor(image.status)}`}
                >
                  {image.isAccepted
                    ? "✓"
                    : getStatusText(image.status).charAt(0)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ImageGallery;

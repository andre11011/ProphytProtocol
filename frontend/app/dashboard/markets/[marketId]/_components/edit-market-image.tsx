"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  addToast,
  Image,
} from "@heroui/react";
import { PencilIcon } from "@heroicons/react/24/outline";

import ImageUploadBox from "@/components/uploader/image-upload-box";
import { Market } from "@/types/market.types";
import { marketService } from "@/services/market.service";

interface EditMarketImageProps {
  market: Market;
  onImageUpdated: (updatedMarket: Market) => void;
}

export function EditMarketImage({
  market,
  onImageUpdated,
}: EditMarketImageProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [imageUrl, setImageUrl] = useState(market.imageUrl || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!imageUrl || imageUrl === market.imageUrl) {
      onOpenChange();

      return;
    }

    setIsLoading(true);

    try {
      const response = await marketService.updateMarketImage(
        market.id,
        imageUrl,
      );

      if (response.success && response.data) {
        onImageUpdated(response.data);
        addToast({
          title: "Market image updated successfully!",
          color: "success",
        });
        onOpenChange();
      } else {
        throw new Error("Failed to update image");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update image";

      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setImageUrl(market.imageUrl || "");
    onOpenChange();
  };

  return (
    <>
      <Button
        isIconOnly
        className="z-10"
        size="sm"
        startContent={<PencilIcon className="h-4 w-4" />}
        variant="flat"
        onPress={onOpen}
      />

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3>Edit Market Image</h3>
                <p className="text-sm text-gray-500 font-normal">
                  Upload a new image for &quot;{market.question}&quot;
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {market.imageUrl && (
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-2">
                        Current Image
                      </span>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <Image
                          alt="Current market image"
                          className="max-w-full h-auto max-h-32 object-contain"
                          src={market.imageUrl}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      {market.imageUrl ? "New Image" : "Upload Image"}
                    </span>
                    <ImageUploadBox
                      value={imageUrl}
                      onChange={(value: string) => setImageUrl(value)}
                    />
                  </div>

                  {imageUrl && imageUrl !== market.imageUrl && (
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-2">
                        Preview
                      </span>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <Image
                          alt="New market image preview"
                          className="max-w-full h-auto max-h-32 object-contain"
                          src={imageUrl}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Image Guidelines
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>
                        • Use high-quality images (recommended: 400x300px)
                      </li>
                      <li>
                        • Images should be relevant to the market question
                      </li>
                      <li>• Supported formats: JPG, PNG, WebP</li>
                      <li>• Maximum file size: 10MB</li>
                    </ul>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  isDisabled={isLoading}
                  variant="flat"
                  onPress={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isDisabled={!imageUrl || imageUrl === market.imageUrl}
                  isLoading={isLoading}
                  onPress={handleSave}
                >
                  {isLoading ? "Updating..." : "Update Image"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

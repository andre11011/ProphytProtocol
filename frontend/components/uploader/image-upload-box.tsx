"use client";

import { ImageUp } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { useCallback } from "react";

interface ImageUploadBoxProps {
  onChange: (value: string) => void;
  value: string;
}

declare global {
  var cloudinary: any;
}

const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({ onChange, value }) => {
  const handleUpload = useCallback(
    (result: any) => {
      onChange(result.info.secure_url);
    },
    [onChange],
  );

  return (
    <CldUploadWidget uploadPreset="z6euuqyl" onSuccess={handleUpload}>
      {({ open }) => {
        return (
          <button
            className={`relative cursor-pointer hover:opacity-70 transition border-dashed border-2 ${value && value.length > 0 ? "p-5" : "p-10"} border-neutral-300 flex flex-col justify-center items-center gap-4 text-neutral-600`}
            onClick={() => open && open()}
          >
            {value && value.length <= 0 && (
              <div>
                <ImageUp size={50} />
                <div className="font-semibold text-lg">Click to upload</div>
              </div>
            )}
            {value && value.length > 0 && (
              <div className="flex flex-row flex-wrap gap-5 w-fit h-full">
                <Image
                  alt={`Uploaded image`}
                  height={100}
                  src={value}
                  style={{ objectFit: "contain" }}
                  width={100}
                />
              </div>
            )}
          </button>
        );
      }}
    </CldUploadWidget>
  );
};

export default ImageUploadBox;

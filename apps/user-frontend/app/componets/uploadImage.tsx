"use client";

import { Backed_URL, CLOUDFRONT_URL } from "../uitls/index";
import { useState, ChangeEvent } from "react";
import axios from "axios";
import Image from "next/image";

interface UploadImageProps {
  onImageAdded: (image: string) => void;
  image?: string;
}

export default function UploadImage({ onImageAdded, image }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);

  async function getPresignedUrl() {
    const response = await axios.get(`${Backed_URL}/api/v1/user/presignedUrl`, {
      headers: {
        Authorization: localStorage.getItem("token") ?? "",
      },
    });
    return response.data;
  }

  function createFormData(file: File, fields: Record<string, string>) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.set(key, value);
    });
    formData.append("file", file);
    return formData;
  }

  async function onFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const presignedData = await getPresignedUrl();
      const formData = createFormData(file, presignedData.fields);

      await axios.post(presignedData.URL, formData);

      onImageAdded(`${CLOUDFRONT_URL}/${presignedData.fields["key"]}`);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {image ? (
        <Image
          className="p-2 w-96 rounded"
          src={image}
          alt="Uploaded"
          width={384}
          height={384}
        />
      ) : (
        <div className="w-40 h-40 rounded border text-2xl cursor-pointer">
          <div className="h-full flex justify-center flex-col relative w-full">
            <div className="h-full flex justify-center w-full pt-16 text-4xl">
              {uploading ? (
                <div className="text-sm">Loading...</div>
              ) : (
                <>
                  +
                  <input
                    className="w-full h-full bg-red-400"
                    type="file"
                    style={{
                      position: "absolute",
                      opacity: 0,
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      width: "100%",
                      height: "100%",
                    }}
                    onChange={onFileSelect}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

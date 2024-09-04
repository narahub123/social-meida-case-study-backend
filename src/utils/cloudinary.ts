import { v2 as cloudinary } from "cloudinary";

export const saveImageToCloudinary = async (imgUrl: string) => {
  const uploadedResponse = await cloudinary.uploader.upload(imgUrl);

  return uploadedResponse.secure_url;
};

import fs from "fs";
import { supabase } from "./supabaseClient";

export const uploadImageToSupabase = async (
  file: Express.Multer.File, // assuming you're using multer
  fileName: string
) => {
  const fileBuffer = fs.readFileSync(file.path);

  const contentType = file.mimetype;

  if (!contentType || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
    throw new Error("Unsupported or invalid file type. Only images and videos are allowed.");
  }

  const filePath = `media/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, fileBuffer, {
      contentType: contentType,
      upsert: true,
    });

  if (uploadError) {
    console.error("❌ Upload failed:", uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    console.error("❌ Failed to get public URL");
    throw new Error("Public URL not found");
  }

  return urlData.publicUrl;
};

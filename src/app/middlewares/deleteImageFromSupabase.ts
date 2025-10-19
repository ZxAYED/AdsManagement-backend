import { supabase } from "./supabaseClient";

export const deleteImageFromSupabase = async (imageUrl: string) => {
  console.log("Deleting image:", imageUrl);
  try {
    // get path form url after 'attachments/' 
    const urlParts = imageUrl.split("/attachments/");
    if (urlParts.length < 2) return;

    const filePath = urlParts[1]; // example: media/1760853743504_Screenshot_1.png
    console.log("Supabase file path:", filePath);

    const { error } = await supabase.storage
      .from("attachments")
      .remove([filePath]);

    if (error) {
      console.error("❌ Supabase delete error:", error.message);
    } else {
      console.log("🗑️ Deleted old image:", filePath);
    }
  } catch (err) {
    console.error("❌ Delete failed:", err);
  }
};

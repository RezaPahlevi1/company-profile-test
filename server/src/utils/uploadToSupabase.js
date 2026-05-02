import supabase from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";

const uploadToSupabase = async (fileBuffer, mimetype, folder = "general") => {
  const extension = mimetype.split("/")[1];
  const filename = `${folder}/${uuidv4()}.${extension}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filename, fileBuffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export default uploadToSupabase;

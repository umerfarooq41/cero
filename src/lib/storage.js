import { supabase } from "@/lib/supabase";

const DEFAULT_BUCKET = "attachments";

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Supabase session error:", error);
    throw error;
  }
  const user = data.session?.user;
  if (!user) {
    throw new Error("You must be signed in to manage files.");
  }
  return user;
}

export async function uploadAttachment(file, bucket = DEFAULT_BUCKET) {
  const user = await getCurrentUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw error;
  }

  return { ...data, bucket, path };
}


export async function getSignedAttachmentUrl(path, expiresIn = 3600, bucket = DEFAULT_BUCKET) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Supabase storage signed URL error:", error);
    throw error;
  }

  return data.signedUrl;
}

export async function deleteAttachment(path, bucket = DEFAULT_BUCKET) {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Supabase storage delete error:", error);
    throw error;
  }

  return data;
}

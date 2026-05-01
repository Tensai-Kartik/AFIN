import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'afin-storage';

// Helper to sanitize filenames (remove spaces, special chars)
const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_').toLowerCase();
};

// Helper to get file extension
const getExtension = (filename: string) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop() : '';
};

/**
 * Upload Content (Notes, PYQs, Assignments, Solutions)
 */
export const uploadContent = async (
  file: File,
  userId: string,
  type: 'notes' | 'pyqs' | 'assignments' | 'solutions'
) => {
  const ext = getExtension(file.name);
  const safeName = sanitizeFilename(file.name.replace(`.${ext}`, ''));
  const timestamp = Date.now();
  // Format: content/{type}/{userId}-{filename}-{timestamp}.{ext}
  const filePath = `content/${type}/${userId}-${safeName}-${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  // Return public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

/**
 * Upload ID Card
 */
export const uploadIdCard = async (file: File, userId: string) => {
  const ext = getExtension(file.name);
  // Format: id_cards/{userId}/card.{ext}
  const filePath = `id_cards/${userId}/card_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

/**
 * Upload Avatar
 */
export const uploadAvatar = async (file: File, userId: string) => {
  const ext = getExtension(file.name);
  // Format: avatars/{userId}.{ext}
  const filePath = `avatars/${userId}_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

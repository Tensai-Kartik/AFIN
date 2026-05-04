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
  // 2MB Limit
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size exceeds 2MB limit.');
  }
  // Image or PDF validation
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    throw new Error('Only images or PDFs are allowed for ID Card.');
  }

  const ext = getExtension(file.name) || 'png';
  // Strict format per requirements: id_cards/{userId}/card.png
  // We'll keep the extension dynamic just in case, or force .png if preferred. Let's force .png for image, or original if PDF.
  const finalExt = file.type === 'application/pdf' ? 'pdf' : 'png';
  const filePath = `id_cards/${userId}/card.${finalExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // Add a cache buster timestamp query parameter since we are using upsert
  return `${publicUrlData.publicUrl}?t=${Date.now()}`;
};

/**
 * Upload Avatar
 */
export const uploadAvatar = async (file: File, userId: string) => {
  // 2MB Limit
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('File size exceeds 2MB limit.');
  }
  // Image only validation
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed for Avatars.');
  }

  // Strict format per requirements: avatars/{userId}.png
  const filePath = `avatars/${userId}.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return `${publicUrlData.publicUrl}?t=${Date.now()}`;
};

/**
 * Upload Multiple Images (For Lost/Found, Accommodation, etc.)
 */
export const uploadMultipleImages = async (
  files: File[],
  folderName: string,
  userId: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File ${file.name} exceeds 5MB limit.`);
    }
    
    // Image only validation
    if (!file.type.startsWith('image/')) {
      throw new Error(`File ${file.name} is not a valid image.`);
    }

    const ext = getExtension(file.name) || 'jpg';
    const timestamp = Date.now();
    // afin-storage/{folderName}/{userId}-{timestamp}-{index}.{ext}
    const filePath = `${folderName}/${userId}-${timestamp}-${i}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error(`Error uploading ${file.name}:`, error);
      throw new Error(`Failed to upload ${file.name}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrlData.publicUrl);
  }

  return uploadedUrls;
};

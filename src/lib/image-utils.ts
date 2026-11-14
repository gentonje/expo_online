import { supabase } from './supabase';

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return 'https://via.placeholder.com/400';

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return 'https://via.placeholder.com/400';

    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;

    return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
};

const IMAGES_BUCKET = 'images';

/**
 * Uploads a picked image (file://, content://, blob:, data: or http(s) URI) into the
 * user's own folder, which the storage RLS policy requires.
 */
export const uploadProductImage = async (userId: string, uri: string, index: number): Promise<string> => {
    const response = await fetch(uri);
    if (!response.ok && response.status !== 0) {
        throw new Error('Could not read the selected image');
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const body = await response.arrayBuffer();
    const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(filePath, body, { contentType, upsert: false });

    if (error) throw error;
    return filePath;
};

/** Best-effort cleanup; a failed removal should never block the user's action. */
export const removeStorageFiles = async (paths: Array<string | null | undefined>) => {
    const storagePaths = Array.from(
        new Set(paths.filter((p): p is string => !!p && !p.startsWith('http')))
    );
    if (storagePaths.length === 0) return;

    const { error } = await supabase.storage.from(IMAGES_BUCKET).remove(storagePaths);
    if (error) console.error('Failed to remove storage files:', error);
};

export const getProductMainImage = (product: any) => {
    // Check if there's a storage_path directly on the product
    if (product.storage_path) return getImageUrl(product.storage_path);

    // Check if there's product_images array
    if (product.product_images && product.product_images.length > 0) {
        const mainImage = product.product_images.find((img: any) => img.is_main) || product.product_images[0];
        return getImageUrl(mainImage.storage_path);
    }

    return getImageUrl(null);
};

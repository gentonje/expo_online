// supabase import removed as it was unused


export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return 'https://via.placeholder.com/400';

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return 'https://via.placeholder.com/400';

    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;

    return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
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

import { supabase } from '../lib/supabase';
import { useFeedback } from '../contexts/FeedbackContext';

export function useShopping() {
    const { showToast } = useFeedback();

    const addToCart = async (productId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast('Please login to add items to your cart', 'info');
                return false;
            }

            // Check if product exists and is available
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('id, available_quantity, product_status')
                .eq('id', productId)
                .single();

            if (productError || !product) {
                showToast('Product not found', 'error');
                return false;
            }

            if (product.product_status !== 'published') {
                showToast('This product is not available', 'error');
                return false;
            }

            // Get or create cart
            let { data: cart, error: cartFetchError } = await supabase
                .from('cart')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (cartFetchError) throw cartFetchError;

            if (!cart) {
                const { data: newCart, error: cartCreateError } = await supabase
                    .from('cart')
                    .insert({ user_id: user.id })
                    .select('id')
                    .single();

                if (cartCreateError) throw cartCreateError;
                cart = newCart;
            }

            // Check if item already in cart
            const { data: existingItem, error: existingItemError } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('cart_id', cart.id)
                .eq('product_id', productId)
                .maybeSingle();

            if (existingItemError) throw existingItemError;

            if (existingItem) {
                // Check if adding more would exceed available quantity
                const newQuantity = existingItem.quantity + 1;
                if (product.available_quantity && newQuantity > product.available_quantity) {
                    showToast(`Only ${product.available_quantity} items available`, 'error');
                    return false;
                }

                // Update quantity
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                showToast('Cart updated!');
            } else {
                // Check if product is in stock
                if (product.available_quantity && product.available_quantity < 1) {
                    showToast('This product is out of stock', 'error');
                    return false;
                }

                // Insert new item
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        cart_id: cart.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
                showToast('Item added to cart!');
            }

            return true;
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            showToast(error.message || 'Failed to add item to cart', 'error');
            return false;
        }
    };


    const addToWishlist = async (productId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast('Please login to add items to your wishlist', 'info');
                return false;
            }

            // Check if already in wishlist
            const { data: existingWishlistItem } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            if (existingWishlistItem) {
                showToast('This item is already in your wishlist', 'info');
                return true;
            }

            const { error: insertError } = await supabase
                .from('wishlist')
                .insert({
                    user_id: user.id,
                    product_id: productId
                });

            if (insertError) throw insertError;

            showToast('Item added to wishlist!');
            return true;
        } catch (error: any) {
            console.error('Error adding to wishlist:', error);
            showToast(error.message || 'Failed to add item to wishlist', 'error');
            return false;
        }
    };



    const toggleWishlist = async (productId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast('Please login to manage your wishlist', 'info');
                return { success: false, action: null };
            }

            const { data: existing } = await supabase
                .from('wishlist')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase.from('wishlist').delete().eq('id', existing.id);
                if (error) throw error;
                showToast('Removed from wishlist');
                return { success: true, action: 'removed' };
            } else {
                const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
                if (error) throw error;
                showToast('Added to wishlist!');
                return { success: true, action: 'added' };
            }
        } catch (error: any) {
            console.error('Error toggling wishlist:', error);
            showToast('Failed to update wishlist', 'error');
            return { success: false, action: null };
        }
    };

    const removeFromWishlist = async (wishlistItemId: string) => {
        try {
            const { error } = await supabase.from('wishlist').delete().eq('id', wishlistItemId);
            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error('Error removing from wishlist:', error);
            showToast('Failed to remove from wishlist', 'error');
            return false;
        }
    };




    const placeOrder = async (shippingDetails: {
        full_name: string;
        address: string;
        phone: string;
        total_amount: number;
    }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 1. Get cart
            const { data: cart } = await supabase.from('cart').select('id').eq('user_id', user.id).single();
            if (!cart) throw new Error('Cart not found');

            // 2. Get cart items with product details for price persistence
            const { data: items, error: itemsError } = await supabase
                .from('cart_items')
                .select(`
                    quantity,
                    product_id,
                    products (
                        price
                    )
                `)
                .eq('cart_id', cart.id);

            if (itemsError) throw itemsError;
            if (!items || items.length === 0) throw new Error('Cart is empty');

            // 3. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    status: 'pending',
                    total_amount: shippingDetails.total_amount,
                    shipping_address: shippingDetails.address,
                    shipping_name: shippingDetails.full_name,
                    shipping_phone: shippingDetails.phone
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 4. Create Order Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_time: (item.products as any)?.price || 0
            }));

            const { error: orderItemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (orderItemsError) throw orderItemsError;

            // 5. Clear Cart Items
            const { error: clearError } = await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cart.id);

            if (clearError) throw clearError;

            showToast('Order placed successfully!', 'success');
            return order;
        } catch (error: any) {
            console.error('Error placing order:', error);
            showToast(error.message || 'Failed to place order', 'error');
            return null;
        }
    };


    return {
        addToCart,
        addToWishlist,
        toggleWishlist,
        removeFromWishlist,
        placeOrder
    };
}


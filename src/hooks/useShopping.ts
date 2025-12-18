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

            // Get or create cart
            let { data: cart } = await supabase.from('cart').select('id').eq('user_id', user.id).maybeSingle();

            if (!cart) {
                const { data: newCart, error: cartError } = await supabase
                    .from('cart')
                    .insert({ user_id: user.id })
                    .select('id')
                    .single();

                if (cartError) throw cartError;
                cart = newCart;
            }

            // Check if item already in cart
            const { data: existingItem } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('cart_id', cart.id)
                .eq('product_id', productId)
                .maybeSingle();

            if (existingItem) {
                // Update quantity
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: existingItem.quantity + 1 })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
            } else {
                // Insert new item
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        cart_id: cart.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
            }

            showToast('Item added to cart!');
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


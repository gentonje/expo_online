export interface ProductFormValues {
    title: string;
    price: string;
    available_quantity: string;
    country_id: string;
    county: string;
}

export type ProductValidationResult =
    | { ok: true; price: number; quantity: number; countryId: number }
    | { ok: false; message: string };

const MAX_PRICE = 100_000_000;
const MAX_QUANTITY = 1_000_000;

export const validateProductForm = (
    values: ProductFormValues,
    images: Array<{ isMain: boolean }>
): ProductValidationResult => {
    if (!values.title.trim() || !values.price.trim() || !values.country_id || !values.county) {
        return { ok: false, message: 'Please fill in all required fields' };
    }
    if (images.length === 0) {
        return { ok: false, message: 'Please add at least one image' };
    }
    if (!images.some(img => img.isMain)) {
        return { ok: false, message: 'Please set one image as the main image' };
    }

    const priceText = values.price.trim();
    const price = Number(priceText);
    if (!/^\d+(\.\d{1,2})?$/.test(priceText) || !Number.isFinite(price) || price <= 0 || price > MAX_PRICE) {
        return { ok: false, message: 'Enter a valid price greater than 0 (up to 2 decimal places)' };
    }

    const quantityText = values.available_quantity.trim();
    const quantity = Number(quantityText);
    if (!/^\d+$/.test(quantityText) || quantity < 1 || quantity > MAX_QUANTITY) {
        return { ok: false, message: 'Quantity must be a whole number of at least 1' };
    }

    const countryId = Number(values.country_id);
    if (!Number.isInteger(countryId)) {
        return { ok: false, message: 'Please select a valid country' };
    }

    return { ok: true, price, quantity, countryId };
};

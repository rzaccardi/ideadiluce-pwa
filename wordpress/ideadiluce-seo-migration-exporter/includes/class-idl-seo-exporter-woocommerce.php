<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_WooCommerce
{
    public static function get_product_data(int $post_id): array
    {
        if (!function_exists('wc_get_product')) {
            return [];
        }

        $product = wc_get_product($post_id);
        if (!$product) {
            return [];
        }

        $categories = wp_get_post_terms($post_id, 'product_cat', ['fields' => 'names']);
        $tags = wp_get_post_terms($post_id, 'product_tag', ['fields' => 'names']);

        if (is_wp_error($categories)) {
            $categories = [];
        }
        if (is_wp_error($tags)) {
            $tags = [];
        }

        return [
            'woocommerce_sku' => (string) $product->get_sku(),
            'woocommerce_price' => (string) $product->get_price(),
            'woocommerce_regular_price' => (string) $product->get_regular_price(),
            'woocommerce_sale_price' => (string) $product->get_sale_price(),
            'woocommerce_stock_status' => (string) $product->get_stock_status(),
            'woocommerce_stock_quantity' => $product->get_stock_quantity() !== null
                ? (string) $product->get_stock_quantity()
                : '',
            'woocommerce_product_type' => (string) $product->get_type(),
            'woocommerce_categories' => IDL_SEO_Exporter_Utils::pipe_join($categories),
            'woocommerce_tags' => IDL_SEO_Exporter_Utils::pipe_join($tags),
            'woocommerce_attributes' => self::get_attributes($product),
            'woocommerce_weight' => (string) $product->get_weight(),
            'woocommerce_dimensions' => self::get_dimensions($product),
            'woocommerce_gallery_images' => self::get_gallery_images($product),
            'woocommerce_upsells' => IDL_SEO_Exporter_Utils::pipe_join($product->get_upsell_ids()),
            'woocommerce_cross_sells' => IDL_SEO_Exporter_Utils::pipe_join($product->get_cross_sell_ids()),
        ];
    }

    private static function get_dimensions($product): string
    {
        return sprintf(
            '%s|%s|%s',
            (string) $product->get_length(),
            (string) $product->get_width(),
            (string) $product->get_height()
        );
    }

    private static function get_gallery_images($product): string
    {
        $urls = [];
        foreach ($product->get_gallery_image_ids() as $image_id) {
            $url = wp_get_attachment_url($image_id);
            if ($url) {
                $urls[] = esc_url_raw($url);
            }
        }
        return IDL_SEO_Exporter_Utils::pipe_join($urls);
    }

    private static function get_attributes($product): string
    {
        $parts = [];
        foreach ($product->get_attributes() as $attribute) {
            if ($attribute->is_taxonomy()) {
                $terms = wc_get_product_terms($product->get_id(), $attribute->get_name(), ['fields' => 'names']);
                if (is_wp_error($terms)) {
                    continue;
                }
                $parts[] = wc_attribute_label($attribute->get_name()) . ':' . implode(',', $terms);
            } else {
                $parts[] = $attribute->get_name() . ':' . implode(',', $attribute->get_options());
            }
        }
        return IDL_SEO_Exporter_Utils::pipe_join($parts);
    }
}

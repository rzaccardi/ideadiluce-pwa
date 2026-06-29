<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Posts
{
    public static function export_batch(array $options, int $page, int $per_page): array
    {
        $include_drafts = !empty($options['include_drafts']);
        $include_posts = array_key_exists('include_posts', $options) ? !empty($options['include_posts']) : true;
        $include_products = !empty($options['include_products']);
        $include_yoast = !empty($options['include_yoast']);
        $include_woocommerce = !empty($options['include_woocommerce']);
        $include_images = !empty($options['include_images']);
        $include_links = !empty($options['include_links']);

        $post_types = self::resolve_post_types($include_posts, $include_products);
        if (empty($post_types)) {
            return ['rows' => [], 'has_more' => false];
        }

        $statuses = $include_drafts
            ? ['publish', 'draft', 'private', 'pending']
            : ['publish'];

        $query = new WP_Query([
            'post_type' => array_values($post_types),
            'post_status' => $statuses,
            'posts_per_page' => max(1, $per_page),
            'paged' => max(1, $page),
            'fields' => 'ids',
            'no_found_rows' => false,
            'orderby' => 'ID',
            'order' => 'ASC',
        ]);

        $rows = [];
        foreach ($query->posts as $post_id) {
            $row = self::build_row(
                (int) $post_id,
                $include_yoast,
                $include_woocommerce,
                $include_images,
                $include_links
            );
            if ($row !== null) {
                $rows[] = $row;
            }
        }

        return [
            'rows' => $rows,
            'has_more' => $page < (int) $query->max_num_pages,
        ];
    }

    public static function export(array $options = []): array
    {
        $rows = [];
        $page = 1;

        do {
            $result = self::export_batch($options, $page, IDL_SEO_Exporter_Job::BATCH_SIZE);
            $rows = array_merge($rows, $result['rows']);
            $page++;

            $limit_rows = isset($options['limit_rows']) ? (int) $options['limit_rows'] : 0;
            if ($limit_rows > 0 && count($rows) >= $limit_rows) {
                return array_slice($rows, 0, $limit_rows);
            }
        } while ($result['has_more']);

        return $rows;
    }

    private static function resolve_post_types(bool $include_posts, bool $include_products): array
    {
        if ($include_posts && $include_products) {
            $post_types = get_post_types(['public' => true], 'names');
            unset($post_types['attachment']);
            return $post_types;
        }

        if ($include_products) {
            return ['product' => 'product', 'product_variation' => 'product_variation'];
        }

        if ($include_posts) {
            $post_types = get_post_types(['public' => true], 'names');
            unset($post_types['attachment'], $post_types['product'], $post_types['product_variation']);
            return $post_types;
        }

        return [];
    }

    private static function build_row(
        int $post_id,
        bool $include_yoast,
        bool $include_woocommerce,
        bool $include_images,
        bool $include_links
    ): ?array {
        $post = get_post($post_id);
        if (!$post) {
            return null;
        }

        $content = (string) $post->post_content;
        $permalink = get_permalink($post_id);
        if (!$permalink) {
            $permalink = '';
        }

        $parent_url = '';
        if ((int) $post->post_parent > 0) {
            $parent_permalink = get_permalink((int) $post->post_parent);
            $parent_url = $parent_permalink ? esc_url_raw($parent_permalink) : '';
        }

        $row = IDL_SEO_Exporter_Utils::empty_row();
        $row['record_type'] = $post->post_type === 'product' ? 'product' : 'post';
        $row['object_id'] = (string) $post_id;
        $row['post_type'] = (string) $post->post_type;
        $row['status'] = (string) $post->post_status;
        $row['current_url'] = esc_url_raw($permalink);
        $row['slug'] = (string) $post->post_name;
        $row['parent_url'] = $parent_url;
        $row['title_wp'] = (string) $post->post_title;
        $row['h1_detected'] = IDL_SEO_Exporter_Utils::extract_h1($content);
        $row['published_at'] = (string) $post->post_date_gmt;
        $row['modified_at'] = (string) $post->post_modified_gmt;
        $row['word_count'] = (string) str_word_count(wp_strip_all_tags($content));
        $row['content_length'] = (string) strlen($content);
        $row['excerpt'] = (string) $post->post_excerpt;

        $shortcodes = IDL_SEO_Exporter_Utils::extract_shortcodes($content);
        $row['has_shortcode'] = !empty($shortcodes) ? 'yes' : 'no';
        $row['shortcodes_found'] = IDL_SEO_Exporter_Utils::pipe_join($shortcodes);
        $row['schema_type_detected'] = IDL_SEO_Exporter_Utils::detect_schema_type($content, $post_id);

        if ($include_yoast) {
            $yoast = IDL_SEO_Exporter_Yoast::get_post_yoast_meta($post_id);
            foreach ($yoast as $key => $value) {
                if (array_key_exists($key, $row)) {
                    $row[$key] = (string) $value;
                }
            }
            $row['robots_effective'] = IDL_SEO_Exporter_Utils::robots_effective($yoast);
            $row['canonical_effective'] = IDL_SEO_Exporter_Utils::canonical_effective($yoast, $permalink);
        } else {
            $row['canonical_effective'] = esc_url_raw($permalink);
            $row['robots_effective'] = 'index,follow';
        }

        if ($include_images) {
            $featured = IDL_SEO_Exporter_Utils::get_featured_image_data($post_id);
            $row['featured_image_url'] = $featured['url'];
            $row['featured_image_alt'] = $featured['alt'];

            $images = IDL_SEO_Exporter_Utils::extract_images($content);
            $row['all_image_urls'] = IDL_SEO_Exporter_Utils::pipe_join(array_column($images, 'src'));
            $row['all_image_alts'] = IDL_SEO_Exporter_Utils::pipe_join(array_column($images, 'alt'));
        }

        if ($include_links) {
            $links = IDL_SEO_Exporter_Utils::extract_links($content);
            $row['internal_links_count'] = (string) count($links['internal']);
            $row['internal_links'] = IDL_SEO_Exporter_Utils::pipe_join($links['internal']);
            $row['external_links_count'] = (string) count($links['external']);
            $row['external_links'] = IDL_SEO_Exporter_Utils::pipe_join($links['external']);
        }

        if (
            $include_woocommerce
            && in_array($post->post_type, ['product', 'product_variation'], true)
        ) {
            $wc_data = IDL_SEO_Exporter_WooCommerce::get_product_data($post_id);
            foreach ($wc_data as $key => $value) {
                if (array_key_exists($key, $row)) {
                    $row[$key] = (string) $value;
                }
            }
        }

        return $row;
    }
}

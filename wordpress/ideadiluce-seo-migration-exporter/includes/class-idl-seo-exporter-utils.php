<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Utils
{
    public const MASTER_COLUMNS = [
        'record_type',
        'object_id',
        'post_type',
        'taxonomy',
        'term_id',
        'status',
        'current_url',
        'slug',
        'parent_url',
        'title_wp',
        'h1_detected',
        'yoast_seo_title',
        'yoast_meta_description',
        'yoast_focus_keyword',
        'yoast_canonical',
        'yoast_noindex',
        'yoast_nofollow',
        'yoast_opengraph_title',
        'yoast_opengraph_description',
        'yoast_opengraph_image',
        'robots_effective',
        'canonical_effective',
        'published_at',
        'modified_at',
        'word_count',
        'content_length',
        'excerpt',
        'featured_image_url',
        'featured_image_alt',
        'all_image_urls',
        'all_image_alts',
        'internal_links_count',
        'internal_links',
        'external_links_count',
        'external_links',
        'has_shortcode',
        'shortcodes_found',
        'schema_type_detected',
        'woocommerce_sku',
        'woocommerce_price',
        'woocommerce_regular_price',
        'woocommerce_sale_price',
        'woocommerce_stock_status',
        'woocommerce_stock_quantity',
        'woocommerce_product_type',
        'woocommerce_categories',
        'woocommerce_tags',
        'woocommerce_attributes',
        'woocommerce_weight',
        'woocommerce_dimensions',
        'woocommerce_gallery_images',
        'woocommerce_upsells',
        'woocommerce_cross_sells',
        'sitemap_present',
        'sitemap_lastmod',
        'sitemap_source',
        'redirect_source_url',
        'redirect_target_url',
        'redirect_type',
        'seo_priority',
        'recommended_action',
        'nextjs_target_url',
        'notes',
    ];

    public static function empty_row(): array
    {
        return array_fill_keys(self::MASTER_COLUMNS, '');
    }

    public static function normalize_row(array $row): array
    {
        $normalized = self::empty_row();
        foreach ($row as $key => $value) {
            if (array_key_exists($key, $normalized)) {
                $normalized[$key] = is_scalar($value) || $value === null
                    ? (string) $value
                    : wp_json_encode($value);
            }
        }
        return $normalized;
    }

    public static function normalize_url(string $url): string
    {
        if ($url === '') {
            return '';
        }
        $url = trim($url);
        $url = strtok($url, '#') ?: $url;
        $parsed = wp_parse_url($url);
        if (!$parsed || empty($parsed['host'])) {
            return untrailingslashit(strtolower($url));
        }
        $scheme = isset($parsed['scheme']) ? strtolower($parsed['scheme']) : 'https';
        $host = strtolower($parsed['host']);
        $path = isset($parsed['path']) ? untrailingslashit($parsed['path']) : '';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
        return $scheme . '://' . $host . $path . $query;
    }

    public static function extract_h1(string $html): string
    {
        if (empty($html)) {
            return '';
        }
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html);
        $h1s = $dom->getElementsByTagName('h1');
        if ($h1s->length > 0) {
            return trim($h1s->item(0)->textContent);
        }
        return '';
    }

    public static function extract_links(string $html): array
    {
        $site_host = parse_url(home_url(), PHP_URL_HOST);
        $internal = [];
        $external = [];

        if (empty($html)) {
            return compact('internal', 'external');
        }

        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html);

        foreach ($dom->getElementsByTagName('a') as $a) {
            $href = trim($a->getAttribute('href'));
            if (
                !$href
                || strpos($href, '#') === 0
                || strpos($href, 'mailto:') === 0
                || strpos($href, 'tel:') === 0
            ) {
                continue;
            }
            $host = parse_url($href, PHP_URL_HOST);
            if (!$host || $host === $site_host) {
                $internal[] = esc_url_raw($href);
            } else {
                $external[] = esc_url_raw($href);
            }
        }

        return [
            'internal' => array_values(array_unique($internal)),
            'external' => array_values(array_unique($external)),
        ];
    }

    public static function extract_images(string $html): array
    {
        $images = [];
        if (empty($html)) {
            return $images;
        }

        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html);

        foreach ($dom->getElementsByTagName('img') as $img) {
            $src = esc_url_raw($img->getAttribute('src'));
            if ($src === '') {
                continue;
            }
            $images[] = [
                'src' => $src,
                'alt' => sanitize_text_field($img->getAttribute('alt')),
            ];
        }

        return $images;
    }

    public static function extract_shortcodes(string $html): array
    {
        if (empty($html)) {
            return [];
        }
        preg_match_all('/\[([\w-]+)/', $html, $matches);
        if (empty($matches[1])) {
            return [];
        }
        return array_values(array_unique($matches[1]));
    }

    public static function get_featured_image_data(int $post_id): array
    {
        $thumb_id = get_post_thumbnail_id($post_id);
        if (!$thumb_id) {
            return ['url' => '', 'alt' => ''];
        }
        $url = wp_get_attachment_url($thumb_id);
        $alt = get_post_meta($thumb_id, '_wp_attachment_image_alt', true);
        return [
            'url' => $url ? esc_url_raw($url) : '',
            'alt' => sanitize_text_field((string) $alt),
        ];
    }

    public static function detect_schema_type(string $html, int $post_id = 0): string
    {
        if ($post_id > 0) {
            $yoast_schema = get_post_meta($post_id, '_yoast_wpseo_schema_page_type', true);
            if (is_string($yoast_schema) && $yoast_schema !== '') {
                return sanitize_text_field($yoast_schema);
            }
        }

        if (preg_match('/"@type"\s*:\s*"([^"]+)"/', $html, $m)) {
            return sanitize_text_field($m[1]);
        }

        if (preg_match('/itemtype=["\']([^"\']+)["\']/', $html, $m)) {
            $parts = explode('/', rtrim($m[1], '/'));
            return sanitize_text_field(end($parts));
        }

        return '';
    }

    public static function robots_effective(array $yoast): string
    {
        $parts = [];
        $noindex = isset($yoast['yoast_noindex']) ? (string) $yoast['yoast_noindex'] : '';
        $nofollow = isset($yoast['yoast_nofollow']) ? (string) $yoast['yoast_nofollow'] : '';

        if ($noindex === '1') {
            $parts[] = 'noindex';
        } else {
            $parts[] = 'index';
        }

        if ($nofollow === '1') {
            $parts[] = 'nofollow';
        } else {
            $parts[] = 'follow';
        }

        return implode(',', $parts);
    }

    public static function canonical_effective(array $yoast, string $fallback_url): string
    {
        $canonical = isset($yoast['yoast_canonical']) ? trim((string) $yoast['yoast_canonical']) : '';
        return $canonical !== '' ? esc_url_raw($canonical) : esc_url_raw($fallback_url);
    }

    public static function pipe_join(array $items): string
    {
        return implode('|', array_filter(array_map('strval', $items), static function ($v) {
            return $v !== '';
        }));
    }

    public static function apply_sitemap_flags(array $row, array $sitemap_map): array
    {
        $normalized = self::normalize_url($row['current_url'] ?? '');
        if ($normalized !== '' && isset($sitemap_map[$normalized])) {
            $row['sitemap_present'] = 'yes';
            $row['sitemap_lastmod'] = $sitemap_map[$normalized]['lastmod'] ?? '';
            $row['sitemap_source'] = $sitemap_map[$normalized]['source'] ?? '';
        } else {
            $row['sitemap_present'] = 'no';
        }
        return $row;
    }

    public static function guess_action(array $row): string
    {
        if (!empty($row['yoast_noindex']) && $row['yoast_noindex'] === '1') {
            return 'NOINDEX_CHECK';
        }
        if (
            ($row['record_type'] === 'product' || $row['post_type'] === 'product')
            && ($row['woocommerce_stock_status'] ?? '') === 'outofstock'
        ) {
            return 'CHECK_OUT_OF_STOCK';
        }
        if ((int) ($row['word_count'] ?? 0) < 100 && in_array($row['post_type'] ?? '', ['post', 'page'], true)) {
            return 'IMPROVE_THIN_CONTENT';
        }
        if (($row['sitemap_present'] ?? '') !== 'yes') {
            return 'CHECK_NOT_IN_SITEMAP';
        }
        return 'KEEP_CHECK';
    }

    public static function output_csv(string $filename, array $rows): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized', 'idl-seo-exporter'));
        }

        nocache_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . sanitize_file_name($filename));

        $output = fopen('php://output', 'w');
        if ($output === false) {
            wp_die(esc_html__('Unable to open output stream.', 'idl-seo-exporter'));
        }

        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($output, self::MASTER_COLUMNS);

        if (empty($rows)) {
            $empty = self::empty_row();
            $empty['notes'] = 'empty';
            fputcsv($output, array_values($empty));
            fclose($output);
            exit;
        }

        foreach ($rows as $row) {
            $normalized = self::normalize_row($row);
            fputcsv($output, array_values($normalized));
        }

        fclose($output);
        exit;
    }

    public static function output_json(string $filename, array $rows): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized', 'idl-seo-exporter'));
        }

        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . sanitize_file_name($filename));

        $normalized = array_map([self::class, 'normalize_row'], $rows);
        echo wp_json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

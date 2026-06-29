<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Yoast
{
    public static function get_post_yoast_meta(int $post_id): array
    {
        return [
            'yoast_seo_title' => (string) get_post_meta($post_id, '_yoast_wpseo_title', true),
            'yoast_meta_description' => (string) get_post_meta($post_id, '_yoast_wpseo_metadesc', true),
            'yoast_focus_keyword' => (string) get_post_meta($post_id, '_yoast_wpseo_focuskw', true),
            'yoast_canonical' => (string) get_post_meta($post_id, '_yoast_wpseo_canonical', true),
            'yoast_noindex' => (string) get_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', true),
            'yoast_nofollow' => (string) get_post_meta($post_id, '_yoast_wpseo_meta-robots-nofollow', true),
            'yoast_opengraph_title' => (string) get_post_meta($post_id, '_yoast_wpseo_opengraph-title', true),
            'yoast_opengraph_description' => (string) get_post_meta($post_id, '_yoast_wpseo_opengraph-description', true),
            'yoast_opengraph_image' => (string) get_post_meta($post_id, '_yoast_wpseo_opengraph-image', true),
            'yoast_twitter_title' => (string) get_post_meta($post_id, '_yoast_wpseo_twitter-title', true),
            'yoast_twitter_description' => (string) get_post_meta($post_id, '_yoast_wpseo_twitter-description', true),
            'yoast_twitter_image' => (string) get_post_meta($post_id, '_yoast_wpseo_twitter-image', true),
        ];
    }

    public static function get_term_yoast_meta(int $term_id, string $taxonomy): array
    {
        $result = [
            'yoast_seo_title' => '',
            'yoast_meta_description' => '',
            'yoast_focus_keyword' => '',
            'yoast_canonical' => '',
            'yoast_noindex' => '',
            'yoast_nofollow' => '',
            'yoast_opengraph_title' => '',
            'yoast_opengraph_description' => '',
            'yoast_opengraph_image' => '',
        ];

        $term_title = get_term_meta($term_id, '_yoast_wpseo_title', true);
        $term_desc = get_term_meta($term_id, '_yoast_wpseo_metadesc', true);
        $term_canonical = get_term_meta($term_id, '_yoast_wpseo_canonical', true);
        $term_noindex = get_term_meta($term_id, '_yoast_wpseo_noindex', true);
        $term_nofollow = get_term_meta($term_id, '_yoast_wpseo_nofollow', true);

        if ($term_title !== '' && $term_title !== false) {
            $result['yoast_seo_title'] = (string) $term_title;
        }
        if ($term_desc !== '' && $term_desc !== false) {
            $result['yoast_meta_description'] = (string) $term_desc;
        }
        if ($term_canonical !== '' && $term_canonical !== false) {
            $result['yoast_canonical'] = (string) $term_canonical;
        }
        if ($term_noindex !== '' && $term_noindex !== false) {
            $result['yoast_noindex'] = (string) $term_noindex;
        }
        if ($term_nofollow !== '' && $term_nofollow !== false) {
            $result['yoast_nofollow'] = (string) $term_nofollow;
        }

        $prefix = 'wpseo_taxonomy_meta';
        $all_meta = get_option($prefix, []);
        if (is_array($all_meta) && isset($all_meta[$taxonomy][$term_id]) && is_array($all_meta[$taxonomy][$term_id])) {
            $term_meta = $all_meta[$taxonomy][$term_id];
            if ($result['yoast_seo_title'] === '' && !empty($term_meta['wpseo_title'])) {
                $result['yoast_seo_title'] = (string) $term_meta['wpseo_title'];
            }
            if ($result['yoast_meta_description'] === '' && !empty($term_meta['wpseo_desc'])) {
                $result['yoast_meta_description'] = (string) $term_meta['wpseo_desc'];
            }
            if ($result['yoast_canonical'] === '' && !empty($term_meta['canonical'])) {
                $result['yoast_canonical'] = (string) $term_meta['canonical'];
            }
            if ($result['yoast_noindex'] === '' && isset($term_meta['noindex'])) {
                $result['yoast_noindex'] = (string) $term_meta['noindex'];
            }
            if ($result['yoast_nofollow'] === '' && isset($term_meta['nofollow'])) {
                $result['yoast_nofollow'] = (string) $term_meta['nofollow'];
            }
        }

        return $result;
    }
}

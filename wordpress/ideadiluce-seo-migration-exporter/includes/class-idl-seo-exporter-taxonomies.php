<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Taxonomies
{
    public static function export_batch(
        array $options,
        int $taxonomy_index,
        int $offset,
        int $limit
    ): array {
        $include_yoast = !empty($options['include_yoast']);
        $taxonomies = array_values(get_taxonomies(['public' => true], 'names'));

        if ($taxonomy_index >= count($taxonomies)) {
            return [
                'rows' => [],
                'taxonomy_index' => $taxonomy_index,
                'taxonomy_offset' => 0,
                'phase_complete' => true,
            ];
        }

        $taxonomy = $taxonomies[$taxonomy_index];
        $terms = get_terms([
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
            'number' => max(1, $limit),
            'offset' => max(0, $offset),
            'orderby' => 'term_id',
            'order' => 'ASC',
        ]);

        if (is_wp_error($terms)) {
            $terms = [];
        }

        $rows = [];
        foreach ($terms as $term) {
            $rows[] = self::build_row($term, $taxonomy, $include_yoast);
        }

        $fetched = count($terms);
        $next_offset = $offset + $fetched;
        $next_index = $taxonomy_index;
        $phase_complete = false;

        if ($fetched < $limit) {
            $next_index = $taxonomy_index + 1;
            $next_offset = 0;
            if ($next_index >= count($taxonomies)) {
                $phase_complete = true;
            }
        }

        return [
            'rows' => $rows,
            'taxonomy_index' => $next_index,
            'taxonomy_offset' => $next_offset,
            'phase_complete' => $phase_complete,
        ];
    }

    public static function export(array $options = []): array
    {
        $rows = [];
        $taxonomy_index = 0;
        $taxonomy_offset = 0;
        $limit_rows = isset($options['limit_rows']) ? (int) $options['limit_rows'] : 0;

        do {
            $batch_limit = IDL_SEO_Exporter_Job::BATCH_SIZE;
            if ($limit_rows > 0) {
                $batch_limit = min($batch_limit, max(0, $limit_rows - count($rows)));
                if ($batch_limit === 0) {
                    break;
                }
            }

            $result = self::export_batch($options, $taxonomy_index, $taxonomy_offset, $batch_limit);
            $rows = array_merge($rows, $result['rows']);
            $taxonomy_index = (int) $result['taxonomy_index'];
            $taxonomy_offset = (int) $result['taxonomy_offset'];

            if ($limit_rows > 0 && count($rows) >= $limit_rows) {
                return array_slice($rows, 0, $limit_rows);
            }
        } while (empty($result['phase_complete']));

        return $rows;
    }

    private static function build_row($term, string $taxonomy, bool $include_yoast): array
    {
        $term_url = get_term_link($term);
        if (is_wp_error($term_url)) {
            $term_url = '';
        }

        $parent_url = '';
        if ((int) $term->parent > 0) {
            $parent_link = get_term_link((int) $term->parent, $taxonomy);
            $parent_url = is_wp_error($parent_link) ? '' : esc_url_raw($parent_link);
        }

        $row = IDL_SEO_Exporter_Utils::empty_row();
        $row['record_type'] = 'taxonomy';
        $row['object_id'] = (string) $term->term_id;
        $row['taxonomy'] = (string) $taxonomy;
        $row['term_id'] = (string) $term->term_id;
        $row['status'] = 'publish';
        $row['current_url'] = esc_url_raw((string) $term_url);
        $row['slug'] = (string) $term->slug;
        $row['parent_url'] = $parent_url;
        $row['title_wp'] = (string) $term->name;
        $row['excerpt'] = wp_strip_all_tags((string) $term->description);
        $row['word_count'] = (string) str_word_count(wp_strip_all_tags((string) $term->description));
        $row['content_length'] = (string) strlen((string) $term->description);
        $row['notes'] = sprintf('term_count=%d', (int) $term->count);

        if ($include_yoast) {
            $yoast = IDL_SEO_Exporter_Yoast::get_term_yoast_meta((int) $term->term_id, $taxonomy);
            foreach ($yoast as $key => $value) {
                if (array_key_exists($key, $row)) {
                    $row[$key] = (string) $value;
                }
            }
            $row['robots_effective'] = IDL_SEO_Exporter_Utils::robots_effective($yoast);
            $row['canonical_effective'] = IDL_SEO_Exporter_Utils::canonical_effective(
                $yoast,
                (string) $term_url
            );
        } else {
            $row['canonical_effective'] = esc_url_raw((string) $term_url);
            $row['robots_effective'] = 'index,follow';
        }

        return $row;
    }
}

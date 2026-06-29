<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Redirects
{
    public static function get_all_items(): array
    {
        $items = self::get_redirection_plugin_items();
        foreach (self::get_yoast_premium_redirect_items() as $item) {
            $items[] = $item;
        }
        return $items;
    }

    public static function build_row_from_item(array $item): array
    {
        $row = IDL_SEO_Exporter_Utils::empty_row();
        $row['record_type'] = 'redirect';
        $row['redirect_source_url'] = esc_url_raw((string) ($item['source'] ?? ''));
        $row['redirect_target_url'] = esc_url_raw((string) ($item['target'] ?? ''));
        $row['redirect_type'] = (string) ($item['type'] ?? '');
        $row['current_url'] = $row['redirect_source_url'];
        $row['recommended_action'] = 'KEEP_CHECK';

        $notes = [];
        if (!empty($item['match_type'])) {
            $notes[] = 'match_type=' . sanitize_text_field((string) $item['match_type']);
        }
        if (isset($item['hits'])) {
            $notes[] = 'hits=' . (int) $item['hits'];
        }
        if (!empty($item['last_access'])) {
            $notes[] = 'last_access=' . sanitize_text_field((string) $item['last_access']);
        }
        if (!empty($item['source_plugin'])) {
            $notes[] = 'source_plugin=' . sanitize_text_field((string) $item['source_plugin']);
        }
        $row['notes'] = implode('; ', $notes);

        return $row;
    }

    public static function export(array $options = []): array
    {
        $limit_rows = isset($options['limit_rows']) ? (int) $options['limit_rows'] : 0;
        $rows = [];

        foreach (self::get_all_items() as $item) {
            $rows[] = self::build_row_from_item($item);
            if ($limit_rows > 0 && count($rows) >= $limit_rows) {
                break;
            }
        }

        return $rows;
    }

    public static function redirect_map(array $options = []): array
    {
        $map = [];
        foreach (self::export($options) as $row) {
            $source = IDL_SEO_Exporter_Utils::normalize_url($row['redirect_source_url'] ?? '');
            if ($source === '') {
                continue;
            }
            $map[$source] = $row;
        }
        return $map;
    }

    public static function merge_redirects_into_rows(array $rows, array $redirect_map): array
    {
        foreach ($rows as $index => $row) {
            $url = IDL_SEO_Exporter_Utils::normalize_url($row['current_url'] ?? '');
            if ($url === '' || !isset($redirect_map[$url])) {
                continue;
            }
            $redirect = $redirect_map[$url];
            $rows[$index]['redirect_source_url'] = $redirect['redirect_source_url'] ?? '';
            $rows[$index]['redirect_target_url'] = $redirect['redirect_target_url'] ?? '';
            $rows[$index]['redirect_type'] = $redirect['redirect_type'] ?? '';
            if (!empty($redirect['notes'])) {
                $rows[$index]['notes'] = trim(($rows[$index]['notes'] ?? '') . ' ' . $redirect['notes']);
            }
        }
        return $rows;
    }

    private static function get_redirection_plugin_items(): array
    {
        global $wpdb;

        $table = $wpdb->prefix . 'redirection_items';
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
        if ($exists !== $table) {
            return [];
        }

        $items = $wpdb->get_results(
            "SELECT url, action_data, action_code, match_url, last_count, last_access FROM {$table}",
            ARRAY_A
        );
        if (!is_array($items)) {
            return [];
        }

        $rows = [];
        foreach ($items as $item) {
            $rows[] = [
                'source' => self::absolute_redirect_url((string) ($item['url'] ?? '')),
                'target' => self::resolve_redirect_target((string) ($item['action_data'] ?? '')),
                'type' => (string) ($item['action_code'] ?? ''),
                'match_type' => (string) ($item['match_url'] ?? ''),
                'hits' => isset($item['last_count']) ? (int) $item['last_count'] : 0,
                'last_access' => (string) ($item['last_access'] ?? ''),
                'source_plugin' => 'redirection',
            ];
        }

        return $rows;
    }

    private static function get_yoast_premium_redirect_items(): array
    {
        $option = get_option('wpseo-premium-redirects-base', []);
        if (!is_array($option) || empty($option)) {
            $option = get_option('wpseo_redirect', []);
        }
        if (!is_array($option) || empty($option)) {
            return [];
        }

        $rows = [];
        foreach ($option as $origin => $data) {
            if (is_array($data)) {
                $target = $data['url'] ?? ($data['target'] ?? '');
                $type = $data['type'] ?? ($data['header_code'] ?? '301');
            } else {
                $target = (string) $data;
                $type = '301';
            }
            $rows[] = [
                'source' => self::absolute_redirect_url((string) $origin),
                'target' => self::absolute_redirect_url((string) $target),
                'type' => (string) $type,
                'match_type' => 'yoast',
                'hits' => 0,
                'last_access' => '',
                'source_plugin' => 'yoast-premium',
            ];
        }

        return $rows;
    }

    private static function resolve_redirect_target(string $action_data): string
    {
        if ($action_data === '') {
            return '';
        }

        $decoded = json_decode($action_data, true);
        if (is_array($decoded)) {
            if (!empty($decoded['url'])) {
                return self::absolute_redirect_url((string) $decoded['url']);
            }
            if (!empty($decoded['target'])) {
                return self::absolute_redirect_url((string) $decoded['target']);
            }
        }

        return self::absolute_redirect_url($action_data);
    }

    private static function absolute_redirect_url(string $url): string
    {
        $url = trim($url);
        if ($url === '') {
            return '';
        }
        if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
            return esc_url_raw($url);
        }
        return esc_url_raw(home_url($url));
    }
}

<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Crawler
{
    private static array $visited_sitemaps = [];

    public static function fetch_sitemap_urls(string $sitemap_url = ''): array
    {
        if ($sitemap_url === '') {
            $sitemap_url = home_url('/sitemap_index.xml');
        }

        $urls = [];
        self::$visited_sitemaps = [];
        self::parse_sitemap($sitemap_url, $urls);
        return $urls;
    }

    public static function fetch_sitemap_map(string $sitemap_url = ''): array
    {
        $map = [];
        foreach (self::fetch_sitemap_urls($sitemap_url) as $entry) {
            $loc = isset($entry['loc']) ? (string) $entry['loc'] : '';
            if ($loc === '') {
                continue;
            }
            $normalized = IDL_SEO_Exporter_Utils::normalize_url($loc);
            $map[$normalized] = [
                'lastmod' => isset($entry['lastmod']) ? (string) $entry['lastmod'] : '',
                'source' => isset($entry['source']) ? (string) $entry['source'] : '',
            ];
        }
        return $map;
    }

    public static function export_sitemap_rows(array $options = []): array
    {
        $limit_rows = isset($options['limit_rows']) ? (int) $options['limit_rows'] : 0;
        $rows = [];

        foreach (self::fetch_sitemap_urls() as $entry) {
            $row = IDL_SEO_Exporter_Utils::empty_row();
            $row['record_type'] = 'sitemap';
            $row['current_url'] = esc_url_raw((string) ($entry['loc'] ?? ''));
            $row['sitemap_present'] = 'yes';
            $row['sitemap_lastmod'] = (string) ($entry['lastmod'] ?? '');
            $row['sitemap_source'] = (string) ($entry['source'] ?? '');
            $row['recommended_action'] = 'KEEP_CHECK';
            $rows[] = $row;

            if ($limit_rows > 0 && count($rows) >= $limit_rows) {
                break;
            }
        }

        return $rows;
    }

    public static function sitemap_orphan_rows(array $sitemap_map, array $existing_rows): array
    {
        $known = [];
        foreach ($existing_rows as $row) {
            $url = IDL_SEO_Exporter_Utils::normalize_url($row['current_url'] ?? '');
            if ($url !== '') {
                $known[$url] = true;
            }
        }

        $orphans = [];
        foreach ($sitemap_map as $url => $meta) {
            if (isset($known[$url])) {
                continue;
            }
            $row = IDL_SEO_Exporter_Utils::empty_row();
            $row['record_type'] = 'sitemap_orphan';
            $row['current_url'] = $url;
            $row['sitemap_present'] = 'yes';
            $row['sitemap_lastmod'] = $meta['lastmod'] ?? '';
            $row['sitemap_source'] = $meta['source'] ?? '';
            $row['recommended_action'] = 'CHECK_NOT_IN_SITEMAP';
            $orphans[] = $row;
        }

        return $orphans;
    }

    private static function parse_sitemap(string $sitemap_url, array &$urls): void
    {
        if (isset(self::$visited_sitemaps[$sitemap_url])) {
            return;
        }
        self::$visited_sitemaps[$sitemap_url] = true;

        $response = wp_remote_get($sitemap_url, [
            'timeout' => 30,
            'user-agent' => 'IDL SEO Migration Exporter',
        ]);

        if (is_wp_error($response)) {
            return;
        }

        $body = wp_remote_retrieve_body($response);
        if ($body === '') {
            return;
        }

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body);
        if ($xml === false) {
            return;
        }

        $namespaces = $xml->getNamespaces(true);
        if (isset($namespaces[''])) {
            $xml->registerXPathNamespace('sm', $namespaces['']);
        }

        if (isset($xml->sitemap)) {
            foreach ($xml->sitemap as $sitemap) {
                $child_url = (string) $sitemap->loc;
                if ($child_url !== '') {
                    self::parse_sitemap($child_url, $urls);
                }
            }
        }

        if (isset($xml->url)) {
            foreach ($xml->url as $url) {
                $urls[] = [
                    'loc' => (string) $url->loc,
                    'lastmod' => isset($url->lastmod) ? (string) $url->lastmod : '',
                    'source' => $sitemap_url,
                ];
            }
        }
    }
}

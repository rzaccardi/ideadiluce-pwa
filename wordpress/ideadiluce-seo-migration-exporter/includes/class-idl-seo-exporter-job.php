<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Job
{
    public const BATCH_SIZE = 100;
    private const TRANSIENT_TTL = DAY_IN_SECONDS;

    public static function get_base_dir(): string
    {
        $upload_dir = wp_upload_dir();
        return trailingslashit($upload_dir['basedir']) . 'idl-seo-exports';
    }

    public static function ensure_base_dir(): string
    {
        $dir = self::get_base_dir();
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
        }
        if (!file_exists($dir . '/index.html')) {
            file_put_contents($dir . '/index.html', '');
        }
        if (!file_exists($dir . '/.htaccess')) {
            file_put_contents($dir . '/.htaccess', "Deny from all\n");
        }
        return $dir;
    }

    public static function create(string $export_type, array $options, int $user_id): array|WP_Error
    {
        self::ensure_base_dir();

        $job_id = wp_generate_password(16, false, false);
        $job_dir = self::get_base_dir() . '/' . $job_id;
        if (!wp_mkdir_p($job_dir)) {
            return new WP_Error('idl_mkdir_failed', __('Impossibile creare la directory di export.', 'idl-seo-exporter'));
        }

        file_put_contents($job_dir . '/index.html', '');

        $format = str_contains($export_type, 'json') ? 'json' : 'csv';
        $job = [
            'id' => $job_id,
            'export_type' => $export_type,
            'format' => $format,
            'options' => $options,
            'status' => 'running',
            'phase' => self::initial_phase($export_type, $options),
            'phase_page' => 1,
            'taxonomy_index' => 0,
            'taxonomy_offset' => 0,
            'redirect_offset' => 0,
            'sitemap_offset' => 0,
            'orphan_offset' => 0,
            'processed' => 0,
            'message' => __('Preparazione export...', 'idl-seo-exporter'),
            'job_dir' => $job_dir,
            'file_csv' => $job_dir . '/export.csv',
            'file_jsonl' => $job_dir . '/export.jsonl',
            'file_json' => $job_dir . '/export.json',
            'known_urls_file' => $job_dir . '/known-urls.txt',
            'header_written' => false,
            'created_at' => time(),
            'user_id' => $user_id,
            'bo_run_id' => '',
            'batch_counter' => 0,
            'bo_last_error' => '',
        ];

        $prepare = self::prepare_job_caches($job);
        if (is_wp_error($prepare)) {
            self::cleanup_job_dir($job_dir);
            return $prepare;
        }

        self::write_csv_header($job);
        $job = self::maybe_start_bo_sync($job);
        self::save($job);

        return $job;
    }

    public static function get(string $job_id): ?array
    {
        $job = get_transient(self::transient_key($job_id));
        return is_array($job) ? $job : null;
    }

    public static function save(array $job): void
    {
        set_transient(self::transient_key($job['id']), $job, self::TRANSIENT_TTL);
        self::write_progress_file($job);
    }

    public static function process_batch(string $job_id): array|WP_Error
    {
        $job = self::get($job_id);
        if (!$job) {
            return new WP_Error('idl_job_not_found', __('Job di export non trovato o scaduto.', 'idl-seo-exporter'));
        }

        if ((int) $job['user_id'] !== get_current_user_id()) {
            return new WP_Error('idl_job_forbidden', __('Non autorizzato su questo job.', 'idl-seo-exporter'));
        }

        if ($job['status'] === 'complete') {
            return self::response($job, true);
        }

        if ($job['status'] === 'failed') {
            return new WP_Error('idl_job_failed', (string) ($job['message'] ?? __('Export fallito.', 'idl-seo-exporter')));
        }

        if (function_exists('set_time_limit')) {
            @set_time_limit(60);
        }

        try {
            $result = self::run_phase_batch($job);
        } catch (Throwable $e) {
            $job['status'] = 'failed';
            $job['message'] = $e->getMessage();
            self::save($job);
            return new WP_Error('idl_batch_exception', $job['message']);
        }

        $job = $result['job'];
        $rows = $result['rows'];

        if (!empty($rows)) {
            $remaining = self::remaining_limit($job);
            if ($remaining > 0 && count($rows) > $remaining) {
                $rows = array_slice($rows, 0, $remaining);
            }

            self::append_rows($job, $rows);
            self::track_known_urls($job, $rows);
            $job['processed'] = (int) $job['processed'] + count($rows);
            $job = self::maybe_push_bo_batch($job, $rows);
        }

        if (!empty($result['phase_complete'])) {
            $next = self::next_phase($job);
            if ($next === null) {
                $job = self::finalize_job($job);
            } else {
                $job['phase'] = $next;
                $job['phase_page'] = 1;
                $job['taxonomy_index'] = 0;
                $job['taxonomy_offset'] = 0;
                $job['redirect_offset'] = 0;
                $job['sitemap_offset'] = 0;
                $job['orphan_offset'] = 0;
                $job['message'] = self::phase_label($next);
            }
        }

        if (self::limit_reached($job)) {
            $job = self::finalize_job($job);
        }

        self::save($job);

        return self::response($job, $job['status'] === 'complete');
    }

    public static function get_download_path(array $job): string
    {
        if ($job['format'] === 'json' && file_exists($job['file_json'])) {
            return $job['file_json'];
        }
        return $job['file_csv'];
    }

    public static function get_download_filename(array $job): string
    {
        $stamp = gmdate('Y-m-d-His', (int) $job['created_at']);
        if ($job['format'] === 'json') {
            return 'idl-seo-export-' . $stamp . '.json';
        }
        return 'idl-seo-export-' . $stamp . '.csv';
    }

    private static function transient_key(string $job_id): string
    {
        return 'idl_seo_job_' . $job_id;
    }

    private static function initial_phase(string $export_type, array $options): string
    {
        return match ($export_type) {
            'sitemap_csv' => 'sitemap',
            'posts_csv' => 'posts',
            'taxonomies_csv' => 'taxonomies',
            'redirects_csv' => 'redirects',
            default => !empty($options['include_posts']) || !empty($options['include_products']) ? 'posts' : (
                !empty($options['include_taxonomies']) ? 'taxonomies' : (
                    !empty($options['include_redirects']) ? 'redirects' : (
                        !empty($options['include_sitemap']) ? 'sitemap_orphans' : 'done'
                    )
                )
            ),
        };
    }

    private static function next_phase(array $job): ?string
    {
        $options = $job['options'];
        $type = $job['export_type'];

        if ($type === 'posts_csv' || $type === 'taxonomies_csv' || $type === 'redirects_csv' || $type === 'sitemap_csv') {
            return null;
        }

        $order = [];
        if (!empty($options['include_posts']) || !empty($options['include_products'])) {
            $order[] = 'posts';
        }
        if (!empty($options['include_taxonomies'])) {
            $order[] = 'taxonomies';
        }
        if (!empty($options['include_redirects'])) {
            $order[] = 'redirects';
        }
        if (!empty($options['include_sitemap'])) {
            $order[] = 'sitemap_orphans';
        }

        $current = $job['phase'];
        $index = array_search($current, $order, true);
        if ($index === false) {
            return null;
        }

        return $order[$index + 1] ?? null;
    }

    private static function phase_label(string $phase): string
    {
        return match ($phase) {
            'posts' => __('Export post/pagine/prodotti...', 'idl-seo-exporter'),
            'taxonomies' => __('Export tassonomie...', 'idl-seo-exporter'),
            'redirects' => __('Export redirect...', 'idl-seo-exporter'),
            'sitemap' => __('Export sitemap...', 'idl-seo-exporter'),
            'sitemap_orphans' => __('Analisi URL sitemap orfani...', 'idl-seo-exporter'),
            default => __('Finalizzazione...', 'idl-seo-exporter'),
        };
    }

    private static function prepare_job_caches(array $job): true|WP_Error
    {
        $options = $job['options'];
        $dir = $job['job_dir'];

        if (!empty($options['include_sitemap']) || in_array($job['export_type'], ['full_csv', 'full_json', 'sitemap_csv'], true)) {
            $map = IDL_SEO_Exporter_Crawler::fetch_sitemap_map();
            if (!self::write_json_file($dir . '/sitemap-map.json', $map)) {
                return new WP_Error('idl_sitemap_cache', __('Impossibile salvare la cache sitemap.', 'idl-seo-exporter'));
            }
            if ($job['export_type'] === 'sitemap_csv') {
                $urls = IDL_SEO_Exporter_Crawler::fetch_sitemap_urls();
                if (!self::write_json_file($dir . '/sitemap-urls.json', $urls)) {
                    return new WP_Error('idl_sitemap_cache', __('Impossibile salvare la lista sitemap.', 'idl-seo-exporter'));
                }
            }
        }

        if (!empty($options['include_redirects']) || $job['export_type'] === 'redirects_csv') {
            $redirects = IDL_SEO_Exporter_Redirects::get_all_items();
            if (!self::write_json_file($dir . '/redirects.json', $redirects)) {
                return new WP_Error('idl_redirect_cache', __('Impossibile salvare la cache redirect.', 'idl-seo-exporter'));
            }
        }

        return true;
    }

    private static function run_phase_batch(array $job): array
    {
        $options = $job['options'];
        $limit = self::remaining_limit($job);
        $batch_size = $limit > 0 ? min(self::BATCH_SIZE, $limit) : self::BATCH_SIZE;

        $rows = [];
        $phase_complete = false;
        $job['message'] = self::phase_label($job['phase']);

        switch ($job['phase']) {
            case 'posts':
                $result = IDL_SEO_Exporter_Posts::export_batch($options, (int) $job['phase_page'], $batch_size);
                $rows = self::enrich_rows($result['rows'], $job);
                if (!$result['has_more']) {
                    $phase_complete = true;
                } else {
                    $job['phase_page'] = (int) $job['phase_page'] + 1;
                }
                break;

            case 'taxonomies':
                $result = IDL_SEO_Exporter_Taxonomies::export_batch(
                    $options,
                    (int) $job['taxonomy_index'],
                    (int) $job['taxonomy_offset'],
                    $batch_size
                );
                $rows = self::enrich_rows($result['rows'], $job);
                $job['taxonomy_index'] = (int) $result['taxonomy_index'];
                $job['taxonomy_offset'] = (int) $result['taxonomy_offset'];
                $phase_complete = !empty($result['phase_complete']);
                break;

            case 'redirects':
                $result = self::export_redirect_batch($job, $batch_size);
                $rows = $result['rows'];
                $job['redirect_offset'] = (int) $result['redirect_offset'];
                $phase_complete = !empty($result['phase_complete']);
                break;

            case 'sitemap':
                $result = self::export_sitemap_batch($job, $batch_size);
                $rows = $result['rows'];
                $job['sitemap_offset'] = (int) $result['sitemap_offset'];
                $phase_complete = !empty($result['phase_complete']);
                break;

            case 'sitemap_orphans':
                $result = self::export_orphan_batch($job, $batch_size);
                $rows = $result['rows'];
                $job['orphan_offset'] = (int) $result['orphan_offset'];
                $phase_complete = !empty($result['phase_complete']);
                break;

            default:
                $phase_complete = true;
                break;
        }

        return [
            'job' => $job,
            'rows' => $rows,
            'phase_complete' => $phase_complete,
        ];
    }

    private static function export_redirect_batch(array $job, int $batch_size): array
    {
        $items = self::read_json_file($job['job_dir'] . '/redirects.json');
        $offset = (int) $job['redirect_offset'];
        $slice = array_slice($items, $offset, $batch_size);
        $rows = [];
        $known = self::read_known_urls($job);

        foreach ($slice as $item) {
            $row = IDL_SEO_Exporter_Redirects::build_row_from_item($item);
            $source = IDL_SEO_Exporter_Utils::normalize_url($row['redirect_source_url'] ?? '');

            if ($job['export_type'] === 'redirects_csv') {
                $rows[] = $row;
                continue;
            }

            if ($source !== '' && isset($known[$source])) {
                continue;
            }
            $rows[] = $row;
        }

        $next_offset = $offset + count($slice);
        return [
            'rows' => $rows,
            'redirect_offset' => $next_offset,
            'phase_complete' => $next_offset >= count($items),
        ];
    }

    private static function export_sitemap_batch(array $job, int $batch_size): array
    {
        $items = self::read_json_file($job['job_dir'] . '/sitemap-urls.json');
        $offset = (int) $job['sitemap_offset'];
        $slice = array_slice($items, $offset, $batch_size);
        $rows = [];

        foreach ($slice as $entry) {
            $row = IDL_SEO_Exporter_Utils::empty_row();
            $row['record_type'] = 'sitemap';
            $row['current_url'] = esc_url_raw((string) ($entry['loc'] ?? ''));
            $row['sitemap_present'] = 'yes';
            $row['sitemap_lastmod'] = (string) ($entry['lastmod'] ?? '');
            $row['sitemap_source'] = (string) ($entry['source'] ?? '');
            $row['recommended_action'] = 'KEEP_CHECK';
            $rows[] = $row;
        }

        $next_offset = $offset + count($slice);
        return [
            'rows' => $rows,
            'sitemap_offset' => $next_offset,
            'phase_complete' => $next_offset >= count($items),
        ];
    }

    private static function export_orphan_batch(array $job, int $batch_size): array
    {
        $orphans_file = $job['job_dir'] . '/sitemap-orphans.json';
        if ((int) $job['orphan_offset'] === 0 || !file_exists($orphans_file)) {
            $map = self::read_json_file($job['job_dir'] . '/sitemap-map.json');
            $known = self::read_known_urls($job);
            $orphans = [];
            foreach ($map as $url => $meta) {
                if (!isset($known[$url])) {
                    $orphans[] = ['url' => $url, 'meta' => $meta];
                }
            }
            self::write_json_file($orphans_file, $orphans);
        }

        $orphans = self::read_json_file($orphans_file);
        $offset = (int) $job['orphan_offset'];
        $slice = array_slice($orphans, $offset, $batch_size);
        $rows = [];

        foreach ($slice as $orphan) {
            $row = IDL_SEO_Exporter_Utils::empty_row();
            $row['record_type'] = 'sitemap_orphan';
            $row['current_url'] = (string) $orphan['url'];
            $row['sitemap_present'] = 'yes';
            $row['sitemap_lastmod'] = $orphan['meta']['lastmod'] ?? '';
            $row['sitemap_source'] = $orphan['meta']['source'] ?? '';
            $row['recommended_action'] = 'CHECK_NOT_IN_SITEMAP';
            $rows[] = $row;
        }

        $next_offset = $offset + count($slice);
        return [
            'rows' => $rows,
            'orphan_offset' => $next_offset,
            'phase_complete' => $next_offset >= count($orphans),
        ];
    }

    private static function enrich_rows(array $rows, array $job): array
    {
        $options = $job['options'];
        $sitemap_map = [];
        $redirect_map = [];

        if (!empty($options['include_sitemap'])) {
            $sitemap_map = self::read_json_file($job['job_dir'] . '/sitemap-map.json');
        }

        if (!empty($options['include_redirects'])) {
            $redirect_map = self::build_redirect_map_from_cache($job);
        }

        foreach ($rows as $index => $row) {
            if (!empty($options['include_sitemap'])) {
                $rows[$index] = IDL_SEO_Exporter_Utils::apply_sitemap_flags($row, $sitemap_map);
            } else {
                $rows[$index]['sitemap_present'] = 'no';
            }

            if (!empty($options['include_sitemap']) || !empty($options['include_redirects'])) {
                $rows[$index]['recommended_action'] = IDL_SEO_Exporter_Utils::guess_action($rows[$index]);
            }

            if (!empty($redirect_map)) {
                $url = IDL_SEO_Exporter_Utils::normalize_url($rows[$index]['current_url'] ?? '');
                if ($url !== '' && isset($redirect_map[$url])) {
                    $redirect = $redirect_map[$url];
                    $rows[$index]['redirect_source_url'] = $redirect['redirect_source_url'] ?? '';
                    $rows[$index]['redirect_target_url'] = $redirect['redirect_target_url'] ?? '';
                    $rows[$index]['redirect_type'] = $redirect['redirect_type'] ?? '';
                }
            }
        }

        return $rows;
    }

    private static function build_redirect_map_from_cache(array $job): array
    {
        $map = [];
        foreach (self::read_json_file($job['job_dir'] . '/redirects.json') as $item) {
            $row = IDL_SEO_Exporter_Redirects::build_row_from_item($item);
            $source = IDL_SEO_Exporter_Utils::normalize_url($row['redirect_source_url'] ?? '');
            if ($source !== '') {
                $map[$source] = $row;
            }
        }
        return $map;
    }

    private static function write_csv_header(array &$job): void
    {
        if (!empty($job['header_written'])) {
            return;
        }

        $handle = fopen($job['file_csv'], 'w');
        if ($handle === false) {
            throw new RuntimeException(__('Impossibile creare il file CSV.', 'idl-seo-exporter'));
        }
        fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($handle, IDL_SEO_Exporter_Utils::MASTER_COLUMNS);
        fclose($handle);
        $job['header_written'] = true;
    }

    private static function append_rows(array $job, array $rows): void
    {
        if (empty($rows)) {
            return;
        }

        $handle = fopen($job['file_csv'], 'a');
        if ($handle === false) {
            throw new RuntimeException(__('Impossibile appendere al file CSV.', 'idl-seo-exporter'));
        }

        foreach ($rows as $row) {
            $normalized = IDL_SEO_Exporter_Utils::normalize_row($row);
            fputcsv($handle, array_values($normalized));

            if ($job['format'] === 'json') {
                file_put_contents(
                    $job['file_jsonl'],
                    wp_json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n",
                    FILE_APPEND
                );
            }
        }

        fclose($handle);
    }

    private static function track_known_urls(array $job, array $rows): void
    {
        $lines = [];
        foreach ($rows as $row) {
            $url = IDL_SEO_Exporter_Utils::normalize_url($row['current_url'] ?? '');
            if ($url !== '') {
                $lines[] = $url;
            }
        }
        if (!empty($lines)) {
            file_put_contents($job['known_urls_file'], implode("\n", $lines) . "\n", FILE_APPEND);
        }
    }

    private static function read_known_urls(array $job): array
    {
        if (!file_exists($job['known_urls_file'])) {
            return [];
        }
        $known = [];
        $handle = fopen($job['known_urls_file'], 'r');
        if ($handle === false) {
            return [];
        }
        while (($line = fgets($handle)) !== false) {
            $url = trim($line);
            if ($url !== '') {
                $known[$url] = true;
            }
        }
        fclose($handle);
        return $known;
    }

    private static function finalize_job(array $job): array
    {
        if ($job['format'] === 'json') {
            self::finalize_json_from_jsonl($job);
        }

        $job['status'] = 'complete';
        $job['message'] = sprintf(
            __('Export completato: %d righe elaborate.', 'idl-seo-exporter'),
            (int) $job['processed']
        );
        $job = self::maybe_complete_bo_sync($job);
        return $job;
    }

    private static function finalize_json_from_jsonl(array $job): void
    {
        $jsonl = $job['file_jsonl'];
        $json = $job['file_json'];
        $out = fopen($json, 'w');
        if ($out === false) {
            throw new RuntimeException(__('Impossibile creare il file JSON.', 'idl-seo-exporter'));
        }

        fwrite($out, "[\n");
        $first = true;

        if (file_exists($jsonl)) {
            $in = fopen($jsonl, 'r');
            if ($in !== false) {
                while (($line = fgets($in)) !== false) {
                    $line = trim($line);
                    if ($line === '') {
                        continue;
                    }
                    if (!$first) {
                        fwrite($out, ",\n");
                    }
                    fwrite($out, $line);
                    $first = false;
                }
                fclose($in);
            }
        }

        fwrite($out, "\n]\n");
        fclose($out);
    }

    private static function write_progress_file(array $job): void
    {
        $progress = [
            'id' => $job['id'],
            'status' => $job['status'],
            'phase' => $job['phase'],
            'processed' => (int) $job['processed'],
            'message' => (string) $job['message'],
            'updated_at' => time(),
        ];
        file_put_contents(
            $job['job_dir'] . '/progress.json',
            wp_json_encode($progress, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    private static function response(array $job, bool $done): array
    {
        return [
            'done' => $done,
            'job_id' => $job['id'],
            'status' => $job['status'],
            'phase' => $job['phase'],
            'processed' => (int) $job['processed'],
            'message' => (string) $job['message'],
            'bo_run_id' => (string) ($job['bo_run_id'] ?? ''),
            'bo_last_error' => (string) ($job['bo_last_error'] ?? ''),
            'download_url' => $done
                ? self::download_url($job['id'])
                : '',
        ];
    }

    private static function maybe_start_bo_sync(array $job): array
    {
        if (!IDL_SEO_Exporter_Remote::is_enabled()) {
            return $job;
        }

        $result = IDL_SEO_Exporter_Remote::start_run($job);
        if (is_wp_error($result)) {
            $job['bo_last_error'] = $result->get_error_message();
            return $job;
        }

        $job['bo_run_id'] = (string) ($result['id'] ?? '');
        $job['bo_last_error'] = '';
        $job['message'] = __('Export avviato e sincronizzato con il backoffice.', 'idl-seo-exporter');
        return $job;
    }

    private static function maybe_push_bo_batch(array $job, array $rows): array
    {
        if (!IDL_SEO_Exporter_Remote::is_enabled() || empty($job['bo_run_id']) || empty($rows)) {
            return $job;
        }

        $job['batch_counter'] = (int) ($job['batch_counter'] ?? 0) + 1;
        $result = IDL_SEO_Exporter_Remote::push_batch($job, $rows, (int) $job['batch_counter']);
        if (is_wp_error($result)) {
            $job['bo_last_error'] = $result->get_error_message();
            return $job;
        }

        $job['bo_last_error'] = '';
        return $job;
    }

    private static function maybe_complete_bo_sync(array $job): array
    {
        if (!IDL_SEO_Exporter_Remote::is_enabled() || empty($job['bo_run_id'])) {
            return $job;
        }

        $result = IDL_SEO_Exporter_Remote::complete_run($job);
        if (is_wp_error($result)) {
            $job['bo_last_error'] = $result->get_error_message();
            return $job;
        }

        $job['bo_last_error'] = '';
        $job['message'] .= ' ' . __('Dati inviati al backoffice.', 'idl-seo-exporter');
        return $job;
    }

    public static function download_url(string $job_id): string
    {
        return wp_nonce_url(
            admin_url('admin-post.php?action=idl_seo_export_download&job_id=' . rawurlencode($job_id)),
            'idl_seo_download_' . $job_id,
            'idl_seo_download_nonce'
        );
    }

    private static function limit_reached(array $job): bool
    {
        $limit = (int) ($job['options']['limit_rows'] ?? 0);
        return $limit > 0 && (int) $job['processed'] >= $limit;
    }

    private static function remaining_limit(array $job): int
    {
        $limit = (int) ($job['options']['limit_rows'] ?? 0);
        if ($limit <= 0) {
            return 0;
        }
        return max(0, $limit - (int) $job['processed']);
    }

    private static function write_json_file(string $path, array $data): bool
    {
        return file_put_contents(
            $path,
            wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ) !== false;
    }

    private static function read_json_file(string $path): array
    {
        if (!file_exists($path)) {
            return [];
        }
        $raw = file_get_contents($path);
        if ($raw === false || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function cleanup_job_dir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $files = glob($dir . '/*');
        if (is_array($files)) {
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
        rmdir($dir);
    }
}

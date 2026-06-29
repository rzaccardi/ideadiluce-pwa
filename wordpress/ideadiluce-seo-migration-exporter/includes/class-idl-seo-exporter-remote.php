<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Remote
{
    public const OPTION_API_URL = 'idl_seo_exporter_bo_api_url';
    public const OPTION_API_TOKEN = 'idl_seo_exporter_bo_token';
    public const OPTION_PUSH_ENABLED = 'idl_seo_exporter_push_to_bo';

    public static function is_enabled(): bool
    {
        if (!get_option(self::OPTION_PUSH_ENABLED, '1')) {
            return false;
        }
        return self::get_api_url() !== '' && self::get_api_token() !== '';
    }

    public static function get_api_url(): string
    {
        return untrailingslashit((string) get_option(self::OPTION_API_URL, ''));
    }

    public static function get_api_token(): string
    {
        return trim((string) get_option(self::OPTION_API_TOKEN, ''));
    }

    public static function register_settings(): void
    {
        register_setting('idl_seo_exporter', self::OPTION_API_URL, [
            'type' => 'string',
            'sanitize_callback' => [self::class, 'sanitize_api_url'],
            'default' => '',
        ]);
        register_setting('idl_seo_exporter', self::OPTION_API_TOKEN, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => '',
        ]);
        register_setting('idl_seo_exporter', self::OPTION_PUSH_ENABLED, [
            'type' => 'string',
            'sanitize_callback' => static function ($value) {
                return $value ? '1' : '';
            },
            'default' => '1',
        ]);
    }

    public static function sanitize_api_url(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }
        return esc_url_raw(untrailingslashit($value));
    }

    public static function start_run(array $job): array|WP_Error
    {
        return self::request('POST', '/runs', [
            'externalJobId' => $job['id'],
            'exportType' => $job['export_type'],
            'options' => $job['options'] ?? [],
            'sourceUrl' => home_url('/'),
        ]);
    }

    public static function push_batch(array $job, array $rows, int $batch_number): array|WP_Error
    {
        if (empty($job['bo_run_id'])) {
            return new WP_Error('idl_bo_run_missing', __('Run BO non inizializzato.', 'idl-seo-exporter'));
        }

        return self::request('POST', '/runs/' . rawurlencode((string) $job['bo_run_id']) . '/batches', [
            'batchNumber' => $batch_number,
            'phase' => $job['phase'] ?? '',
            'processed' => (int) ($job['processed'] ?? 0),
            'message' => (string) ($job['message'] ?? ''),
            'rows' => array_map([IDL_SEO_Exporter_Utils::class, 'normalize_row'], $rows),
        ]);
    }

    public static function push_progress(array $job, array $extra = []): array|WP_Error
    {
        if (empty($job['bo_run_id'])) {
            return new WP_Error('idl_bo_run_missing', __('Run BO non inizializzato.', 'idl-seo-exporter'));
        }

        return self::request('POST', '/runs/' . rawurlencode((string) $job['bo_run_id']) . '/progress', array_merge([
            'phase' => $job['phase'] ?? '',
            'processed' => (int) ($job['processed'] ?? 0),
            'message' => (string) ($job['message'] ?? ''),
            'status' => ($job['status'] ?? '') === 'failed' ? 'failed' : 'running',
            'errorMessage' => (string) ($job['bo_last_error'] ?? ''),
        ], $extra));
    }

    public static function complete_run(array $job): array|WP_Error
    {
        if (empty($job['bo_run_id'])) {
            return new WP_Error('idl_bo_run_missing', __('Run BO non inizializzato.', 'idl-seo-exporter'));
        }

        return self::request('POST', '/runs/' . rawurlencode((string) $job['bo_run_id']) . '/complete', [
            'processed' => (int) ($job['processed'] ?? 0),
            'message' => (string) ($job['message'] ?? ''),
        ]);
    }

    private static function request(string $method, string $path, array $body = []): array|WP_Error
    {
        $api_url = self::get_api_url();
        $token = self::get_api_token();

        if ($api_url === '' || $token === '') {
            return new WP_Error('idl_bo_not_configured', __('API backoffice non configurata.', 'idl-seo-exporter'));
        }

        $response = wp_remote_request($api_url . $path, [
            'method' => $method,
            'timeout' => 45,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Integrations-Token' => $token,
            ],
            'body' => wp_json_encode($body),
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = wp_remote_retrieve_body($response);
        $decoded = json_decode($raw, true);

        if ($status < 200 || $status >= 300) {
            $message = is_array($decoded) && isset($decoded['error']['message'])
                ? (string) $decoded['error']['message']
                : ('HTTP ' . $status);
            return new WP_Error('idl_bo_http_error', $message, ['status' => $status, 'body' => $raw]);
        }

        if (!is_array($decoded) || !isset($decoded['data']) || !is_array($decoded['data'])) {
            return new WP_Error('idl_bo_invalid_response', __('Risposta API backoffice non valida.', 'idl-seo-exporter'));
        }

        return $decoded['data'];
    }
}

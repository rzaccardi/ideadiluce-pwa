<?php

if (!defined('ABSPATH')) {
    exit;
}

class IDL_SEO_Exporter_Admin
{
    private const NONCE_ACTION = 'idl_seo_export';
    private const NONCE_FIELD = 'idl_seo_nonce';

    public function __construct()
    {
        add_action('admin_init', [IDL_SEO_Exporter_Remote::class, 'register_settings']);
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_idl_seo_export_start', [$this, 'ajax_start_export']);
        add_action('wp_ajax_idl_seo_export_batch', [$this, 'ajax_process_batch']);
        add_action('admin_post_idl_seo_export_download', [$this, 'handle_download']);
    }

    public function register_menu(): void
    {
        add_management_page(
            __('SEO Migration Export', 'idl-seo-exporter'),
            __('SEO Migration Export', 'idl-seo-exporter'),
            'manage_options',
            'idl-seo-migration-export',
            [$this, 'render_page']
        );
    }

    public function enqueue_assets(string $hook): void
    {
        if ($hook !== 'tools_page_idl-seo-migration-export') {
            return;
        }

        wp_enqueue_style(
            'idl-seo-exporter-admin',
            IDL_SEO_EXPORTER_URL . 'assets/admin.css',
            [],
            IDL_SEO_EXPORTER_VERSION
        );

        wp_enqueue_script(
            'idl-seo-exporter-admin',
            IDL_SEO_EXPORTER_URL . 'assets/admin.js',
            [],
            IDL_SEO_EXPORTER_VERSION,
            true
        );

        wp_localize_script('idl-seo-exporter-admin', 'idlSeoExporter', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce(self::NONCE_ACTION),
            'batchSize' => IDL_SEO_Exporter_Job::BATCH_SIZE,
            'i18n' => [
                'starting' => __('Avvio export...', 'idl-seo-exporter'),
                'running' => __('Export in corso...', 'idl-seo-exporter'),
                'complete' => __('Export completato.', 'idl-seo-exporter'),
                'failed' => __('Export fallito.', 'idl-seo-exporter'),
                'download' => __('Scarica file', 'idl-seo-exporter'),
            ],
        ]);
    }

    public function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'idl-seo-exporter'));
        }
        ?>
        <div class="wrap idl-seo-exporter-wrap">
            <h1><?php echo esc_html__('SEO Migration Export', 'idl-seo-exporter'); ?></h1>
            <p class="description">
                <?php echo esc_html__(
                    'Genera un report completo SEO per la migrazione da WordPress/WooCommerce/Yoast verso Next.js. L\'export avviene in batch da 100 entità con salvataggio progressivo e invio al backoffice del nuovo sito.',
                    'idl-seo-exporter'
                ); ?>
            </p>

            <form method="post" action="options.php" class="idl-seo-exporter-options">
                <?php settings_fields('idl_seo_exporter'); ?>
                <h2><?php echo esc_html__('Sincronizzazione backoffice', 'idl-seo-exporter'); ?></h2>
                <p class="description">
                    <?php echo esc_html__(
                        'Configura l\'URL API del nuovo sito e il token INTEGRATIONS_TOKEN. Ogni batch viene inviato al BO come storico permanente.',
                        'idl-seo-exporter'
                    ); ?>
                </p>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="idl_seo_exporter_bo_api_url"><?php echo esc_html__('URL API backoffice', 'idl-seo-exporter'); ?></label>
                        </th>
                        <td>
                            <input
                                type="url"
                                class="regular-text"
                                id="idl_seo_exporter_bo_api_url"
                                name="<?php echo esc_attr(IDL_SEO_Exporter_Remote::OPTION_API_URL); ?>"
                                value="<?php echo esc_attr(IDL_SEO_Exporter_Remote::get_api_url()); ?>"
                                placeholder="https://api.example.com/api/v1/integrations/wp-seo-migration"
                            >
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="idl_seo_exporter_bo_token"><?php echo esc_html__('Token API', 'idl-seo-exporter'); ?></label>
                        </th>
                        <td>
                            <input
                                type="password"
                                class="regular-text"
                                id="idl_seo_exporter_bo_token"
                                name="<?php echo esc_attr(IDL_SEO_Exporter_Remote::OPTION_API_TOKEN); ?>"
                                value="<?php echo esc_attr(IDL_SEO_Exporter_Remote::get_api_token()); ?>"
                                autocomplete="off"
                            >
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php echo esc_html__('Invia al backoffice', 'idl-seo-exporter'); ?></th>
                        <td>
                            <label>
                                <input
                                    type="checkbox"
                                    name="<?php echo esc_attr(IDL_SEO_Exporter_Remote::OPTION_PUSH_ENABLED); ?>"
                                    value="1"
                                    <?php checked((bool) get_option(IDL_SEO_Exporter_Remote::OPTION_PUSH_ENABLED, '1')); ?>
                                >
                                <?php echo esc_html__('Invia ogni batch di 100 record al backoffice Next.js', 'idl-seo-exporter'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(__('Salva configurazione BO', 'idl-seo-exporter')); ?>
            </form>

            <form id="idl-seo-exporter-form" method="post" action="#">
                <div class="idl-seo-exporter-options">
                    <h2><?php echo esc_html__('Opzioni export', 'idl-seo-exporter'); ?></h2>
                    <fieldset>
                        <?php $this->render_checkbox('include_posts', __('Include post/pages', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_products', __('Include products', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_taxonomies', __('Include taxonomies', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_yoast', __('Include Yoast metadata', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_woocommerce', __('Include WooCommerce fields', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_images', __('Include images', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_links', __('Include internal/external links', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_sitemap', __('Include sitemap URLs', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_redirects', __('Include redirects', 'idl-seo-exporter'), true); ?>
                        <?php $this->render_checkbox('include_drafts', __('Include draft/private', 'idl-seo-exporter'), false); ?>
                    </fieldset>

                    <p class="idl-seo-exporter-limit">
                        <label for="idl_limit_rows">
                            <?php echo esc_html__('Limit rows (0 = unlimited, for testing)', 'idl-seo-exporter'); ?>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            name="limit_rows"
                            id="idl_limit_rows"
                            value="0"
                            class="small-text"
                        >
                    </p>
                </div>

                <div class="idl-seo-exporter-actions">
                    <?php $this->render_button(__('Esporta report completo CSV', 'idl-seo-exporter'), 'full_csv', true); ?>
                    <?php $this->render_button(__('Esporta report completo JSON', 'idl-seo-exporter'), 'full_json'); ?>
                    <?php $this->render_button(__('Esporta solo URL sitemap', 'idl-seo-exporter'), 'sitemap_csv'); ?>
                    <?php $this->render_button(__('Esporta solo post/pages/products', 'idl-seo-exporter'), 'posts_csv'); ?>
                    <?php $this->render_button(__('Esporta solo tassonomie', 'idl-seo-exporter'), 'taxonomies_csv'); ?>
                    <?php $this->render_button(__('Esporta solo redirect', 'idl-seo-exporter'), 'redirects_csv'); ?>
                </div>
            </form>

            <div id="idl-seo-exporter-progress" class="idl-seo-exporter-progress" hidden>
                <h2><?php echo esc_html__('Progresso export', 'idl-seo-exporter'); ?></h2>
                <div class="idl-seo-exporter-progress-bar" aria-hidden="true">
                    <div id="idl-seo-exporter-progress-fill" class="idl-seo-exporter-progress-fill"></div>
                </div>
                <p id="idl-seo-exporter-progress-text" class="idl-seo-exporter-progress-text"></p>
                <p id="idl-seo-exporter-progress-meta" class="idl-seo-exporter-progress-meta"></p>
                <p id="idl-seo-exporter-download-wrap" hidden>
                    <a id="idl-seo-exporter-download-link" class="button button-primary" href="#">
                        <?php echo esc_html__('Scarica file', 'idl-seo-exporter'); ?>
                    </a>
                </p>
            </div>
        </div>
        <?php
    }

    public function ajax_start_export(): void
    {
        $this->assert_ajax_permissions();

        $export_type = isset($_POST['export_type'])
            ? sanitize_key(wp_unslash((string) $_POST['export_type']))
            : 'full_csv';

        $options = $this->parse_options();
        $job = IDL_SEO_Exporter_Job::create($export_type, $options, get_current_user_id());

        if (is_wp_error($job)) {
            wp_send_json_error(['message' => $job->get_error_message()], 400);
        }

        wp_send_json_success([
            'job_id' => $job['id'],
            'message' => __('Job avviato. Elaborazione batch in corso...', 'idl-seo-exporter'),
            'batch_size' => IDL_SEO_Exporter_Job::BATCH_SIZE,
        ]);
    }

    public function ajax_process_batch(): void
    {
        $this->assert_ajax_permissions();

        $job_id = isset($_POST['job_id'])
            ? sanitize_key(wp_unslash((string) $_POST['job_id']))
            : '';

        if ($job_id === '') {
            wp_send_json_error(['message' => __('Job ID mancante.', 'idl-seo-exporter')], 400);
        }

        $result = IDL_SEO_Exporter_Job::process_batch($job_id);
        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()], 400);
        }

        wp_send_json_success($result);
    }

    public function handle_download(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized', 'idl-seo-exporter'));
        }

        $job_id = isset($_GET['job_id'])
            ? sanitize_key(wp_unslash((string) $_GET['job_id']))
            : '';

        if ($job_id === '') {
            wp_die(esc_html__('Job ID mancante.', 'idl-seo-exporter'));
        }

        check_admin_referer('idl_seo_download_' . $job_id, 'idl_seo_download_nonce');

        $job = IDL_SEO_Exporter_Job::get($job_id);
        if (!$job || (int) $job['user_id'] !== get_current_user_id()) {
            wp_die(esc_html__('Export non disponibile.', 'idl-seo-exporter'));
        }

        $path = IDL_SEO_Exporter_Job::get_download_path($job);
        if (!file_exists($path)) {
            wp_die(esc_html__('File export non trovato.', 'idl-seo-exporter'));
        }

        $filename = IDL_SEO_Exporter_Job::get_download_filename($job);
        $mime = $job['format'] === 'json' ? 'application/json' : 'text/csv';

        nocache_headers();
        header('Content-Type: ' . $mime . '; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . sanitize_file_name($filename));
        header('Content-Length: ' . (string) filesize($path));

        readfile($path);
        exit;
    }

    private function assert_ajax_permissions(): void
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('Unauthorized', 'idl-seo-exporter')], 403);
        }

        check_ajax_referer(self::NONCE_ACTION, 'nonce');
    }

    private function parse_options(): array
    {
        $limit_rows = isset($_POST['limit_rows']) ? absint(wp_unslash($_POST['limit_rows'])) : 0;

        return [
            'include_posts' => $this->post_checkbox('include_posts'),
            'include_products' => $this->post_checkbox('include_products'),
            'include_taxonomies' => $this->post_checkbox('include_taxonomies'),
            'include_yoast' => $this->post_checkbox('include_yoast'),
            'include_woocommerce' => $this->post_checkbox('include_woocommerce'),
            'include_images' => $this->post_checkbox('include_images'),
            'include_links' => $this->post_checkbox('include_links'),
            'include_sitemap' => $this->post_checkbox('include_sitemap'),
            'include_redirects' => $this->post_checkbox('include_redirects'),
            'include_drafts' => $this->post_checkbox('include_drafts'),
            'limit_rows' => $limit_rows,
        ];
    }

    private function post_checkbox(string $name): bool
    {
        if (!isset($_POST[$name])) {
            return false;
        }
        return !empty(sanitize_text_field(wp_unslash((string) $_POST[$name])));
    }

    private function render_checkbox(string $name, string $label, bool $checked): void
    {
        ?>
        <label>
            <input type="checkbox" name="<?php echo esc_attr($name); ?>" value="1" <?php checked($checked); ?>>
            <?php echo esc_html($label); ?>
        </label>
        <?php
    }

    private function render_button(string $label, string $export_type, bool $primary = false): void
    {
        $class = $primary ? 'button button-primary idl-seo-export-trigger' : 'button idl-seo-export-trigger';
        ?>
        <button
            type="button"
            class="<?php echo esc_attr($class); ?>"
            data-export-type="<?php echo esc_attr($export_type); ?>"
        >
            <?php echo esc_html($label); ?>
        </button>
        <?php
    }
}

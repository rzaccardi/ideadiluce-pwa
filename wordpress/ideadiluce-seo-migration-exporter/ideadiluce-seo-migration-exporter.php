<?php
/**
 * Plugin Name: IdeaDiLuce SEO Migration Exporter
 * Description: Export completo SEO, Yoast, WooCommerce, sitemap e redirect per migrazione a Next.js.
 * Version: 1.2.0
 * Author: IdeaDiLuce
 */

if (!defined('ABSPATH')) {
    exit;
}

define('IDL_SEO_EXPORTER_VERSION', '1.2.0');
define('IDL_SEO_EXPORTER_PATH', plugin_dir_path(__FILE__));
define('IDL_SEO_EXPORTER_URL', plugin_dir_url(__FILE__));

require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-utils.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-yoast.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-woocommerce.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-posts.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-taxonomies.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-crawler.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-redirects.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-remote.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-job.php';
require_once IDL_SEO_EXPORTER_PATH . 'includes/class-idl-seo-exporter-admin.php';

register_activation_hook(__FILE__, function () {
    IDL_SEO_Exporter_Job::ensure_base_dir();
});

add_action('plugins_loaded', function () {
    if (is_admin()) {
        new IDL_SEO_Exporter_Admin();
    }
});

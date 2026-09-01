<?php
/**
 * Plugin Name: Zopit WooCommerce Connector
 * Plugin URI: https://zopit.ir
 * Description: افزونه اختصاصی همگام‌سازی محصولات و ارسال خودکار سفارشات ووکامرس به پلتفرم زوپیت.
 * Version: 1.0.0
 * Author: Zopit Platform
 * Author URI: https://zopit.ir
 * Text Domain: zopit-woo-connector
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Zopit_Woo_Connector {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance == null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        // Admin Menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));

        // AJAX Action for product sync
        add_action('wp_ajax_zopit_sync_products', array($this, 'ajax_sync_products'));

        // WooCommerce order completion hook
        add_action('woocommerce_payment_complete', array($this, 'send_order_to_zopit'), 10, 1);
        add_action('woocommerce_order_status_processing', array($this, 'send_order_to_zopit'), 10, 1);
    }

    public function add_admin_menu() {
        add_menu_page(
            'اتصال زوپیت',
            'تنظیمات زوپیت',
            'manage_options',
            'zopit-connector',
            array($this, 'render_admin_page'),
            'dashicons-rest-api',
            56
        );
    }

    public function register_settings() {
        register_setting('zopit_settings_group', 'zopit_api_url');
        register_setting('zopit_settings_group', 'zopit_api_key');
    }

    public function render_admin_page() {
        $api_url = get_option('zopit_api_url', 'https://zopit.ir');
        $api_key = get_option('zopit_api_key', '');
        ?>
        <div class="wrap" dir="rtl" style="font-family: tahoma, sans-serif;">
            <h1>تنظیمات افزونه اتصال زوپیت به ووکامرس</h1>
            <p>با استفاده از این افزونه، محصولات پلتفرم زوپیت به همراه فرمول سوددهی شما وارد ووکامرس شده و سفارشات مشتریان مستقیماً به پنل زوپیت منتقل می‌شوند.</p>
            
            <form method="post" action="options.php">
                <?php settings_fields('zopit_settings_group'); ?>
                <?php do_settings_sections('zopit_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">آدرس دامنه زوپیت (Server Base URL):</th>
                        <td>
                            <input type="url" name="zopit_api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" required placeholder="https://zopit.ir" />
                            <p class="description">آدرس دامنه سرور زوپیت (بدون / در انتها)</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">کلید اختصاصی API Key زوپیت:</th>
                        <td>
                            <input type="text" name="zopit_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" required placeholder="zop_live_..." />
                            <p class="description">این کلید را از پنل مدیر فروشگاه زوپیت بخش تنظیمات اتصال کپی کنید.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('ذخیره تنظیمات'); ?>
            </form>

            <hr style="margin: 30px 0;" />

            <h2>همگام‌سازی محصولات</h2>
            <p>جهت دریافت جدیدترین کالاها به همراه قیمت محاسبه‌شده طبق سود اختصاصی شما کلیک کنید:</p>
            <button id="zopit-sync-btn" class="button button-primary button-hero">همگام‌سازی کالاها از زوپیت</button>
            <div id="zopit-sync-result" style="margin-top: 15px; font-weight: bold;"></div>

            <script type="text/javascript">
            jQuery(document).ready(function($) {
                $('#zopit-sync-btn').on('click', function(e) {
                    e.preventDefault();
                    var btn = $(this);
                    var res = $('#zopit-sync-result');
                    btn.prop('disabled', true).text('در حال همگام‌سازی کالاها...');
                    res.html('<span style="color: blue;">در حال فراخوانی API زوپیت... لطفا شکیبا باشید.</span>');

                    $.post(ajaxurl, {
                        action: 'zopit_sync_products'
                    }, function(response) {
                        btn.prop('disabled', false).text('همگام‌سازی کالاها از زوپیت');
                        if (response.success) {
                            res.html('<span style="color: green;">' + response.data.message + '</span>');
                        } else {
                            res.html('<span style="color: red;">خطا: ' + (response.data ? response.data.error : 'خطای نامشخص') + '</span>');
                        }
                    }).fail(function() {
                        btn.prop('disabled', false).text('همگام‌سازی کالاها از زوپیت');
                        res.html('<span style="color: red;">خطا در ارتباط با سرور وردپرس!</span>');
                    });
                });
            });
            </script>
        </div>
        <?php
    }

    public function ajax_sync_products() {
        @set_time_limit(300);
        if (function_exists('wp_raise_memory_limit')) {
            wp_raise_memory_limit('admin');
        }

        $api_url = rtrim(get_option('zopit_api_url'), '/');
        $api_key = get_option('zopit_api_key');

        if (empty($api_key)) {
            wp_send_json_error(array('error' => 'کلید API زوپیت تنظیم نشده است.'));
        }

        $endpoint = $api_url . '/api/v1/store/products';
        $response = wp_remote_get($endpoint, array(
            'headers' => array(
                'X-API-KEY' => $api_key,
                'Content-Type' => 'application/json'
            ),
            'timeout' => 60,
            'sslverify' => false
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('error' => $response->get_error_message()));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!$data || !isset($data['success']) || !$data['success']) {
            $err = isset($data['error']) ? $data['error'] : 'پاسخ نامعتبر از سرور زوپیت';
            wp_send_json_error(array('error' => $err));
        }

        $products = isset($data['products']) ? $data['products'] : array();
        $synced_count = 0;

        // BATCH QUERY OPTIMIZATION: Load all existing mapped products in 1 query instead of N queries
        global $wpdb;
        $raw_metas = $wpdb->get_results("SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_zopit_product_id'");
        $existing_map = array();
        if ($raw_metas) {
            foreach ($raw_metas as $m) {
                $existing_map[strval($m->meta_value)] = intval($m->post_id);
            }
        }

        foreach ($products as $p) {
            $zopit_id = strval($p['id']);
            $title = $p['name'];
            $price = $p['price'];
            $sku = $p['sku'];
            $desc = $p['longDescription'];
            $short_desc = $p['shortDescription'];
            $stock = isset($p['inventory']) ? intval($p['inventory']) : 0;
            $stock_status = ($stock > 0) ? 'instock' : 'outofstock';

            if (isset($existing_map[$zopit_id])) {
                $product_id = $existing_map[$zopit_id];

                // Update product price, stock & stock status
                update_post_meta($product_id, '_price', $price);
                update_post_meta($product_id, '_regular_price', $price);
                update_post_meta($product_id, '_manage_stock', 'yes');
                update_post_meta($product_id, '_stock', $stock);
                update_post_meta($product_id, '_stock_status', $stock_status);
                wc_delete_product_transients($product_id);
                $synced_count++;
            } else {
                // Create new Simple WooCommerce Product
                $post_id = wp_insert_post(array(
                    'post_title' => $title,
                    'post_content' => $desc,
                    'post_excerpt' => $short_desc,
                    'post_status' => 'publish',
                    'post_type' => 'product'
                ));

                if ($post_id && !is_wp_error($post_id)) {
                    wp_set_object_terms($post_id, 'simple', 'product_type');
                    update_post_meta($post_id, '_visibility', 'visible');
                    update_post_meta($post_id, '_manage_stock', 'yes');
                    update_post_meta($post_id, '_stock', $stock);
                    update_post_meta($post_id, '_stock_status', $stock_status);
                    update_post_meta($post_id, '_sku', $sku);
                    update_post_meta($post_id, '_price', $price);
                    update_post_meta($post_id, '_regular_price', $price);
                    update_post_meta($post_id, '_zopit_product_id', $zopit_id);
                    $existing_map[$zopit_id] = $post_id;
                    $synced_count++;
                }
            }
        }

        wp_send_json_success(array('message' => "تعداد {$synced_count} محصول با موفقیت از زوپیت همگام‌سازی گردید."));
    }

    public function send_order_to_zopit($order_id) {
        if (!$order_id) return;

        // Prevent duplicate webhooks with concurrency lock
        if (get_post_meta($order_id, '_zopit_synced', true) || get_post_meta($order_id, '_zopit_syncing', true)) {
            return;
        }

        // Set lock
        update_post_meta($order_id, '_zopit_syncing', true);

        $order = wc_get_order($order_id);
        if (!$order) {
            delete_post_meta($order_id, '_zopit_syncing');
            return;
        }

        $api_url = rtrim(get_option('zopit_api_url'), '/');
        $api_key = get_option('zopit_api_key');

        if (empty($api_key)) {
            delete_post_meta($order_id, '_zopit_syncing');
            return;
        }

        $items = array();
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $zopit_product_id = get_post_meta($product_id, '_zopit_product_id', true);

            if ($zopit_product_id) {
                $items[] = array(
                    'product_id' => intval($zopit_product_id),
                    'quantity' => intval($item->get_quantity())
                );
            }
        }

        if (empty($items)) {
            delete_post_meta($order_id, '_zopit_syncing');
            return;
        }

        $payload = array(
            'woo_order_id' => strval($order_id),
            'items' => $items,
            'customer' => array(
                'name' => trim($order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name()) ?: trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()),
                'mobile' => $order->get_billing_phone(),
                'address' => $order->get_shipping_address_1() ?: $order->get_billing_address_1(),
                'province' => $order->get_shipping_state() ?: $order->get_billing_state(),
                'city' => $order->get_shipping_city() ?: $order->get_billing_city(),
                'postal_code' => $order->get_shipping_postcode() ?: $order->get_billing_postcode()
            ),
            'shipping_method' => $order->get_shipping_method() ?: 'POST'
        );

        $response = wp_remote_post($api_url . '/api/v1/store/orders', array(
            'headers' => array(
                'X-API-KEY' => $api_key,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode($payload),
            'timeout' => 60,
            'sslverify' => false
        ));

        delete_post_meta($order_id, '_zopit_syncing');

        if (!is_wp_error($response)) {
            $res_body = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($res_body['success']) && $res_body['success']) {
                update_post_meta($order_id, '_zopit_synced', true);
                update_post_meta($order_id, '_zopit_order_id', $res_body['zopitOrderId']);
            }
        }
    }
}

// Initialize plugin
add_action('plugins_loaded', array('Zopit_Woo_Connector', 'get_instance'));

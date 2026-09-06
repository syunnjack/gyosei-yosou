<?php
if ( !defined( 'ABSPATH' ) ) {
exit;
}

if ( !function_exists( 'st_chiled_js_enqueue_scripts' ) ) {
    function st_chiled_js_enqueue_scripts() {
        // wp_head()で読み込むJavaScriptファイル
        wp_enqueue_script('st-theme-head-js', get_stylesheet_directory_uri() . '/js/st_wp_head.js', array(), false, false);
        // wp_footer()で読み込むJavaScriptファイル
        wp_enqueue_script('st-theme-footer-js', get_stylesheet_directory_uri() . '/js/st_wp_footer.js', array(), false, true);
    }
}
add_action('wp_enqueue_scripts', 'st_chiled_js_enqueue_scripts');

/* =========================================================
 * gyosei-yosou.jp カスタマイズ
 * ========================================================= */

// AFFINGER管理の初期値（初回のみ適用。管理画面で変更した値は上書きしない）
function gy_bootstrap_affinger_options() {
	if ( get_option( 'gy_bootstrap' ) === '3' ) {
		return;
	}
	$defaults = array(
		'st-data33'  => '行政書士試験 合格までの記録', // トップ用タイトル（構造化データ）
		'st-data34'  => '4回目の受験。模試13回の得点推移、スタディングAI実力スコア、2026年11月8日の本試験までの学習計画を公開。',
		'st-data406' => 'yes', // Webサイト情報（構造化データ）
		'st-data407' => 'yes', // 記事（著者）情報（構造化データ）
		'st-data651' => 'yes', // 「広告」を明記（ステマ規制対応）
		'st-data100' => 'yes', // 固定ページにも広告表示
		'st-data322' => 'yes', // 関連記事をカード表示
		'st-data96'  => 'yes', // TOC+にオリジナルCSS
	);
	foreach ( $defaults as $k => $v ) {
		if ( get_option( $k, null ) === null || get_option( $k ) === '' ) {
			update_option( $k, $v );
		}
	}
	update_option( 'gy_bootstrap', '3' );
}
add_action( 'init', 'gy_bootstrap_affinger_options', 20 );

// AFFINGERのメタディスクリプション等をREST APIから編集可能にする
function gy_register_meta() {
	foreach ( array( 'post', 'page' ) as $type ) {
		register_post_meta( $type, 'st_description', array(
			'show_in_rest' => true, 'single' => true, 'type' => 'string',
			'auth_callback' => function () { return current_user_can( 'edit_posts' ); },
		) );
		register_post_meta( $type, 'st_display_ad_mark_hide', array(
			'show_in_rest' => true, 'single' => true, 'type' => 'string',
			'auth_callback' => function () { return current_user_can( 'edit_posts' ); },
		) );
	}
}
add_action( 'init', 'gy_register_meta' );

// AdSense: 「設定 > 一般」等ではなく wp_options の gy_adsense_client（ca-pub-xxxx）を設定すると出力される。
// 未設定のときは何も出力しない（審査前にダミーコードを置かないため）。
function gy_adsense_client() {
	return trim( (string) get_option( 'gy_adsense_client', '' ) );
}

function gy_adsense_head() {
	$client = gy_adsense_client();
	if ( $client === '' ) {
		return;
	}
	echo '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' . esc_attr( $client ) . '" crossorigin="anonymous"></script>' . "\n";
}
add_action( 'wp_head', 'gy_adsense_head', 5 );

// [gy_ad slot="1234567890" format="auto"] — 記事内の任意位置に広告ユニットを置く
function gy_ad_shortcode( $atts ) {
	$a = shortcode_atts( array( 'slot' => '', 'format' => 'auto', 'label' => 'スポンサーリンク' ), $atts );
	$client = gy_adsense_client();
	if ( $client === '' || $a['slot'] === '' ) {
		return '';
	}
	return '<div class="gy-ad"><span class="gy-ad-label">' . esc_html( $a['label'] ) . '</span>'
		. '<ins class="adsbygoogle" style="display:block" data-ad-client="' . esc_attr( $client ) . '" data-ad-slot="' . esc_attr( $a['slot'] ) . '" data-ad-format="' . esc_attr( $a['format'] ) . '" data-full-width-responsive="true"></ins>'
		. '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>';
}
add_shortcode( 'gy_ad', 'gy_ad_shortcode' );

// [gy_pr] — アフィリエイト記事の冒頭に置く広告表記
function gy_pr_shortcode() {
	return '<p class="gy-pr">本記事にはアフィリエイト広告（PR）を含みます。紹介している講座・教材は実際に受講・使用したものです。</p>';
}
add_shortcode( 'gy_pr', 'gy_pr_shortcode' );

// [gy_countdown] — 本試験までの残り日数
function gy_countdown_shortcode( $atts ) {
	$a = shortcode_atts( array( 'date' => '2026-11-08', 'label' => '令和8年度 行政書士試験' ), $atts );
	$tz = new DateTimeZone( 'Asia/Tokyo' );
	$today = new DateTime( 'today', $tz );
	$exam = new DateTime( $a['date'], $tz );
	$days = (int) $today->diff( $exam )->format( '%r%a' );
	if ( $days > 0 ) {
		$txt = 'あと <strong>' . $days . '</strong> 日';
	} elseif ( $days === 0 ) {
		$txt = '<strong>本試験当日</strong>';
	} else {
		$txt = '試験終了（' . abs( $days ) . '日経過）';
	}
	return '<div class="gy-countdown"><span class="gy-countdown-label">' . esc_html( $a['label'] ) . '（' . esc_html( $exam->format( 'Y年n月j日' ) ) . '）</span><span class="gy-countdown-days">' . $txt . '</span></div>';
}
add_shortcode( 'gy_countdown', 'gy_countdown_shortcode' );

// [gy_faq] … [/gy_faq] の中に [gy_q q="質問"]回答[/gy_q] を並べると FAQPage の JSON-LD も出力する
$gy_faq_items = array();
function gy_q_shortcode( $atts, $content = '' ) {
	global $gy_faq_items;
	$a = shortcode_atts( array( 'q' => '' ), $atts );
	$ans = trim( do_shortcode( $content ) );
	$gy_faq_items[] = array( 'q' => $a['q'], 'a' => wp_strip_all_tags( $ans ) );
	return '<div class="gy-faq-item"><h3 class="gy-faq-q">' . esc_html( $a['q'] ) . '</h3><div class="gy-faq-a">' . wpautop( $ans ) . '</div></div>';
}
add_shortcode( 'gy_q', 'gy_q_shortcode' );

function gy_faq_shortcode( $atts, $content = '' ) {
	global $gy_faq_items;
	$gy_faq_items = array();
	$html = do_shortcode( $content );
	$ld = '';
	if ( $gy_faq_items ) {
		$main = array();
		foreach ( $gy_faq_items as $it ) {
			$main[] = array(
				'@type' => 'Question', 'name' => $it['q'],
				'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $it['a'] ),
			);
		}
		$ld = '<script type="application/ld+json">' . wp_json_encode( array(
			'@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $main,
		), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>';
	}
	return '<div class="gy-faq">' . $html . '</div>' . $ld;
}
add_shortcode( 'gy_faq', 'gy_faq_shortcode' );

// 投稿の更新日を明示（AdSense/E-E-A-T 向け）
function gy_body_class( $classes ) {
	$classes[] = 'gy';
	return $classes;
}
add_filter( 'body_class', 'gy_body_class' );

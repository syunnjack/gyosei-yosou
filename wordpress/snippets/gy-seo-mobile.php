<?php
/**
 * gyosei-yosou.jp：SEO・スマホ最適化（Code Snippets に「gy-seo-mobile」として登録する）
 *
 * 1. サイトマップから noindex のタグ一覧・著者ページを外す（サーチコンソールの「noindex が送信された」対策）
 * 2. noindex のページで矛盾する robots / 壊れた canonical を出さない（/page/2/ が /2/ を指していた）
 * 3. トップページの <title>・description・OGP を、いまのコンセプトに合わせる
 * 4. 記事の <title> のサイト名部分を短くする（検索結果で記事名が切れないように）
 * 5. カテゴリ一覧に meta description を出す（カテゴリの説明文から）
 * 6. スマホでピンチ拡大を許可し、本文を読みやすい文字サイズにする
 * 7. 使わないページで Contact Form 7・comment-reply の読み込みを止める
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

define( 'GY_HOME_TITLE', '資格試験をクイズ・ゲームとして楽しむ｜行政書士・司法書士の攻略記録' );
define( 'GY_HOME_DESC', '50代の受験生が、行政書士（5回目）と司法書士をクイズとゲームのつもりで攻略する記録。本試験・模試の得点、間違いノート、合格お祝い金・全額返金の比較を、良い数字も悪い数字もそのまま載せます。' );
define( 'GY_SHORT_BRAND', '資格はクイズで遊ぶ' );

// 0. カウントダウンの既定を、終わった行政書士試験から次の司法書士試験（筆記・予定）に変える。
//    サイドバーの「本試験まで」ウィジェットは [gy_countdown] を日付なしで使っているため、既定値で切り替える。
add_action(
	'init',
	function () {
		if ( ! function_exists( 'gy_countdown_shortcode' ) ) {
			return;
		}
		remove_shortcode( 'gy_countdown' );
		add_shortcode(
			'gy_countdown',
			function ( $atts ) {
				$atts = (array) $atts;
				if ( empty( $atts['date'] ) ) {
					// 日付なしの呼び出し（サイドバー等）は、名前だけ残っていても司法書士試験にそろえる
					unset( $atts['label'] );
				}
				$atts = shortcode_atts(
					array(
						'date'  => '2027-07-04',
						'label' => '令和9年度 司法書士試験 筆記（予定）',
					),
					(array) $atts
				);
				return gy_countdown_shortcode( $atts );
			}
		);
	},
	99
);
add_filter(
	'widget_title',
	function ( $title ) {
		return ( '本試験まで' === $title ) ? '司法書士試験まで' : $title;
	}
);

// 1. サイトマップ
add_filter(
	'wp_sitemaps_add_provider',
	function ( $provider, $name ) {
		return ( 'users' === $name ) ? false : $provider;
	},
	10,
	2
);
add_filter(
	'wp_sitemaps_taxonomies',
	function ( $taxonomies ) {
		unset( $taxonomies['post_tag'] );
		return $taxonomies;
	}
);

// 4. 記事・固定ページの <title> のサイト名を短く
add_filter(
	'document_title_parts',
	function ( $parts ) {
		if ( is_singular() && ! is_front_page() && isset( $parts['site'] ) ) {
			$parts['site'] = GY_SHORT_BRAND;
		}
		return $parts;
	},
	99
);

// 5. カテゴリ一覧の meta description
add_action(
	'wp_head',
	function () {
		if ( ! is_category() || is_paged() ) {
			return;
		}
		$desc = trim( wp_strip_all_tags( category_description() ) );
		if ( '' !== $desc ) {
			echo '<meta name="description" content="' . esc_attr( wp_html_excerpt( $desc, 120, '' ) ) . '">' . "\n";
		}
	},
	2
);

// 6. スマホの読みやすさ
add_action(
	'wp_head',
	function () {
		echo '<style id="gy-mobile">'
			. '@media (max-width:599px){'
			. '.st-post p,.st-post li{font-size:16px;line-height:1.85}'
			. '.st-post table{font-size:14px}'
			. '.st-post table th,.st-post table td{padding:6px 5px}'
			. '.st-post img{max-width:100%;height:auto}'
			. '}'
			. '</style>' . "\n";
	},
	99
);

// 7. 使わないページでスクリプトを読まない
add_action(
	'wp_enqueue_scripts',
	function () {
		if ( ! is_page( 'contact' ) ) {
			wp_dequeue_script( 'contact-form-7' );
			wp_dequeue_script( 'swv' );
			wp_dequeue_style( 'contact-form-7' );
		}
		if ( ! is_singular() || ! comments_open() ) {
			wp_dequeue_script( 'comment-reply' );
		}
	},
	100
);

// 2・3・6. 出力された HTML の <head> を直す（テーマが直接出しているタグ）
add_action(
	'template_redirect',
	function () {
		if ( is_admin() || wp_doing_ajax() || is_feed() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}
		ob_start( 'gy_seo_filter_html' );
	},
	0
);

function gy_seo_filter_html( $html ) {
	if ( ! is_string( $html ) || false === stripos( $html, '<head' ) ) {
		return $html;
	}
	$parts = preg_split( '/(<\/head>)/i', $html, 2, PREG_SPLIT_DELIM_CAPTURE );
	if ( count( $parts ) < 3 ) {
		return $html;
	}
	$head = $parts[0];

	// 6. ピンチ拡大を許可
	$head = preg_replace(
		'/(<meta\s+name="viewport"\s+content=")[^"]*(")/i',
		'${1}width=device-width,initial-scale=1,viewport-fit=cover${2}',
		$head
	);

	// 2. noindex のページは index の robots と canonical を出さない
	if ( preg_match( '/<meta\s+name="robots"\s+content="[^"]*noindex/i', $head ) ) {
		$head = preg_replace( '/<meta\s+name="robots"\s+content="\s*index\s*,\s*follow\s*"\s*\/?>\s*/i', '', $head );
		$head = preg_replace( '/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>\s*/i', '', $head );
	}

	// 4. 記事・固定ページの <title> のサイト名を短く（テーマが title を直接組み立てるため、ここで置き換える）
	if ( is_singular() && ! is_front_page() ) {
		$site = esc_html( get_bloginfo( 'name' ) );
		$head = str_replace( ' - ' . $site . '</title>', ' - ' . esc_html( GY_SHORT_BRAND ) . '</title>', $head );
	}

	// 3. トップページ
	if ( is_front_page() && ! is_paged() ) {
		$title = esc_html( GY_HOME_TITLE );
		$desc  = esc_attr( GY_HOME_DESC );
		$head  = preg_replace( '/<title>.*?<\/title>/is', '<title>' . $title . '</title>', $head, 1 );
		$head  = preg_replace( '/(<meta\s+name="description"\s+content=")[^"]*(")/i', '${1}' . $desc . '${2}', $head, 1 );
		$head  = preg_replace( '/(<meta\s+property="og:title"\s+content=")[^"]*(")/i', '${1}' . $title . '${2}', $head, 1 );
		$head  = preg_replace( '/(<meta\s+property="og:description"\s+content=")[^"]*(")/i', '${1}' . $desc . '${2}', $head, 1 );
		$head  = preg_replace( '/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i', '${1}' . $title . '${2}', $head, 1 );
		$head  = preg_replace( '/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i', '${1}' . $desc . '${2}', $head, 1 );
	}

	return $head . $parts[1] . $parts[2];
}

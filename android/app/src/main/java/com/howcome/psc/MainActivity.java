package com.howcome.psc;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.view.ViewGroup;

public class MainActivity extends Activity {

    private WebView webView;
    private static final String URL = "https://how-come.vercel.app/";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#000000"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#000000"));

        // Wrap the WebView in a container and pad the CONTAINER by the system
        // bars. Padding the WebView itself does not shrink the web viewport,
        // so position:fixed elements (the bottom nav) ended up hidden behind
        // the navigation bar.
        final FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#000000"));
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        // Android 15 (API 35) enforces edge-to-edge, and Android 16 (API 36)
        // removed the opt-out flag. Without this the page would render beneath
        // the status bar and the gesture/navigation bar, hiding the app header
        // and the bottom nav. Inset the WebView by the system bars instead.
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                int left, top, right, bottom;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    Insets bars = insets.getInsets(
                            WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    left = bars.left; top = bars.top; right = bars.right; bottom = bars.bottom;
                } else {
                    left = insets.getSystemWindowInsetLeft();
                    top = insets.getSystemWindowInsetTop();
                    right = insets.getSystemWindowInsetRight();
                    bottom = insets.getSystemWindowInsetBottom();
                }
                v.setPadding(left, top, right, bottom);
                // Consume the insets so the WebView doesn't add the same
                // space a second time via CSS env(safe-area-inset-*).
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    return WindowInsets.CONSUMED;
                }
                return insets.consumeSystemWindowInsets();
            }
        });

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        // Lock text rendering to 100% regardless of the device's system
        // "Font size" accessibility setting. Without this, WebView inherits
        // that OS-level scale and blows up every font size and emoji icon
        // in the app for users who've bumped up their phone's text size.
        settings.setTextZoom(100);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String url = uri.toString();
                if (url.startsWith("https://how-come.vercel.app")) {
                    return false;
                }
                // Links to the public domain (howcome.in) stay inside the app.
                String inApp = toAppUrl(uri);
                if (inApp != null) {
                    view.loadUrl(inApp);
                    return true;
                }
                // External link (e.g. the PSC Thulasi confirmation portal) —
                // hand it off to the device's own browser instead of silently
                // swallowing the navigation.
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                } catch (ActivityNotFoundException e) {
                    // No browser available on this device; nothing more we can do.
                }
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        String deepLink = getDeepLink(getIntent());
        if (deepLink != null) {
            webView.loadUrl(deepLink);
        } else if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(URL);
        }
    }

    // App already running in the background and the user taps another shared
    // link (launchMode="singleTask" routes it here instead of a new window).
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String deepLink = getDeepLink(intent);
        if (deepLink != null && webView != null) {
            webView.loadUrl(deepLink);
        }
    }

    // Returns the URL to open for a tapped link, or null for a normal launch.
    private String getDeepLink(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) {
            return null;
        }
        return toAppUrl(intent.getData());
    }

    // Shared links use the public domain (https://howcome.in/papers/...), but
    // the app runs on how-come.vercel.app — where the user's login and saved
    // progress live. Open the same page on the app's own domain.
    private static String toAppUrl(Uri data) {
        if (data == null || !"https".equals(data.getScheme())) return null;
        String host = data.getHost();
        if (host == null) return null;
        if (!host.equals("how-come.vercel.app")
                && !host.equals("howcome.in")
                && !host.equals("www.howcome.in")) {
            return null;
        }
        return data.buildUpon().authority("how-come.vercel.app").build().toString();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }
}

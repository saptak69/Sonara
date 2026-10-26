package com.sonara.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.UiModeManager;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.content.res.Configuration;
import android.media.AudioManager;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    private BroadcastReceiver noisyReceiver;
    private ConnectivityManager.NetworkCallback networkCallback;

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Optimize WebView for smooth audio streaming and transitions
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            // Tell the web app it is running on a TV so it turns on remote-control mode
            // (large focus rings, D-pad navigation) straight away.
            if (isTelevision()) {
                settings.setUserAgentString(settings.getUserAgentString() + " SonaraTV");
                applyTelevisionScale(webView, settings);
            }
            // Allow continuous track transitions without requiring repeated user tap gestures
            settings.setMediaPlaybackRequiresUserGesture(false);
            // Enable storage for IndexedDB, CacheStorage & PGlite
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Ensure CookieManager preserves OAuth cookies across cross-origin redirects
            android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        watchConnectivity();

        // Handle Audio Becoming Noisy (pause playback when headphones or bluetooth disconnect)
        noisyReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().post(() -> {
                            getBridge().getWebView().evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('sonara:audio-becoming-noisy'));",
                                null
                            );
                        });
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        registerReceiver(noisyReceiver, filter);
    }

    /** Offline: prefer the web view's cached pages so the app opens instantly instead of waiting on the network. */
    private void applyCacheMode(boolean online) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().getSettings().setCacheMode(
            online ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK
        );
    }

    private void watchConnectivity() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return;
        applyCacheMode(cm.getActiveNetwork() != null);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> applyCacheMode(true));
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> applyCacheMode(cm.getActiveNetwork() != null));
            }
        };
        try {
            cm.registerDefaultNetworkCallback(networkCallback);
        } catch (Exception ignored) {
            networkCallback = null;
        }
    }

    /**
     * A TV is viewed from across the room, so lay the page out as if the screen were about
     * 1050 css px wide and scale it up to fill the real screen. Everything (text, cards,
     * focus rings) gets proportionally bigger on 1080p and 4K sets alike.
     */
    private void applyTelevisionScale(WebView webView, WebSettings settings) {
        settings.setUseWideViewPort(false);
        settings.setSupportZoom(false);
        int widthPx = getResources().getDisplayMetrics().widthPixels;
        int scalePercent = Math.max(100, Math.round(widthPx / 1050f * 100f));
        webView.setInitialScale(scalePercent);
    }

    private boolean isTelevision() {
        UiModeManager uiMode = (UiModeManager) getSystemService(Context.UI_MODE_SERVICE);
        boolean tvMode = uiMode != null && uiMode.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
        return tvMode || getPackageManager().hasSystemFeature(PackageManager.FEATURE_LEANBACK);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (networkCallback != null) {
            try {
                ((ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE)).unregisterNetworkCallback(networkCallback);
            } catch (Exception ignored) {}
        }
        if (noisyReceiver != null) {
            try {
                unregisterReceiver(noisyReceiver);
            } catch (Exception ignored) {}
        }
    }
}

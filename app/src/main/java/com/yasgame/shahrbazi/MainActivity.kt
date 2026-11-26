package com.yasgame.shahrbazi

import android.annotation.SuppressLint
import android.content.ContentValues
import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.MediaStore
import android.util.Base64
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var splashOverlay: LinearLayout
    private var lastBackPressTime = 0L

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen awake during play & drawing
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val root = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#FFF5FB"))
        }

        // Native WebView serving local assets securely over HTTPS
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#FFF5FB"))
            overScrollMode = View.OVER_SCROLL_NEVER

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = false
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
                useWideViewPort = true
                loadWithOverviewMode = true
                builtInZoomControls = false
                displayZoomControls = false
                cacheMode = WebSettings.LOAD_DEFAULT
                textZoom = 100
            }

            addJavascriptInterface(AndroidBridge(this@MainActivity), "AndroidBridge")
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(request.url)
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    splashOverlay.animate()
                        .alpha(0f)
                        .setDuration(360)
                        .withEndAction { splashOverlay.visibility = View.GONE }
                        .start()
                }
            }
        }

        // Cute Native Splash Overlay (prevents white flash on startup)
        splashOverlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundResource(R.drawable.ic_launcher_background)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            val emoji = TextView(this@MainActivity).apply {
                text = "🌸"
                textSize = 68f
                gravity = Gravity.CENTER
            }
            val title = TextView(this@MainActivity).apply {
                text = "شهرِ بازی یاس و رنگ"
                textSize = 26f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, 16, 0, 8)
            }
            val sub = TextView(this@MainActivity).apply {
                text = "✨ بسم‌الله الرحمن الرحیم • در حال آماده‌سازی باغِ بازی..."
                textSize = 14f
                setTextColor(Color.parseColor("#FFFDE7"))
                gravity = Gravity.CENTER
            }
            addView(emoji)
            addView(title)
            addView(sub)
        }

        root.addView(webView)
        root.addView(splashOverlay)
        setContentView(root)

        applyImmersiveMode(false)

        // Smart Hardware Back Button Handling
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    "(function(){ if(typeof window.onAndroidBack === 'function'){ return window.onAndroidBack(); } return 'EXIT'; })()"
                ) { result ->
                    val clean = result?.trim('"') ?: "EXIT"
                    if (clean == "HANDLED") return@evaluateJavascript

                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        val now = System.currentTimeMillis()
                        if (now - lastBackPressTime < 2200) {
                            finish()
                        } else {
                            lastBackPressTime = now
                            Toast.makeText(
                                this@MainActivity,
                                "برای خروج یک بار دیگر دکمه بازگشت را بزنید 🌸",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                }
            }
        })

        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    private fun applyImmersiveMode(immersive: Boolean) {
        WindowCompat.setDecorFitsSystemWindows(window, !immersive)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        if (immersive) {
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            controller.show(WindowInsetsCompat.Type.systemBars())
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    inner class AndroidBridge(private val ctx: Context) {

        @JavascriptInterface
        fun isAndroidApp(): Boolean = true

        @JavascriptInterface
        fun setImmersive(enabled: Boolean) {
            runOnUiThread { applyImmersiveMode(enabled) }
        }

        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(ctx, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun vibrate(durationMs: Long) {
            try {
                val ms = durationMs.coerceIn(10L, 180L)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vm.defaultVibrator.vibrate(
                        VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    val v = ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        v.vibrate(ms)
                    }
                }
            } catch (_: Exception) {
            }
        }

        @JavascriptInterface
        fun saveImageToGallery(base64DataUrl: String, fileName: String): Boolean {
            return try {
                val cleanB64 = if (base64DataUrl.contains(",")) {
                    base64DataUrl.substringAfter(",")
                } else {
                    base64DataUrl
                }
                val bytes = Base64.decode(cleanB64, Base64.DEFAULT)
                val safeName = (if (fileName.isBlank()) "yas-photo.png" else fileName)
                    .replace(Regex("[^a-zA-Z0-9._-]"), "_")
                val finalName = if (safeName.endsWith(".png")) {
                    safeName.removeSuffix(".png") + "_" + (System.currentTimeMillis() % 100000) + ".png"
                } else {
                    safeName + "_" + (System.currentTimeMillis() % 100000) + ".png"
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues().apply {
                        put(MediaStore.Images.Media.DISPLAY_NAME, finalName)
                        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                        put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ShahrBaziYas")
                        put(MediaStore.Images.Media.IS_PENDING, 1)
                    }
                    val resolver = ctx.contentResolver
                    val uri: Uri? = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                    if (uri != null) {
                        resolver.openOutputStream(uri)?.use { it.write(bytes) }
                        values.clear()
                        values.put(MediaStore.Images.Media.IS_PENDING, 0)
                        resolver.update(uri, values, null, null)
                    }
                } else {
                    val dir = File(
                        Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                        "ShahrBaziYas"
                    )
                    if (!dir.exists()) dir.mkdirs()
                    FileOutputStream(File(dir, finalName)).use { it.write(bytes) }
                }

                runOnUiThread {
                    Toast.makeText(ctx, "📸 عکس یادگاری در گالری ذخیره شد! 🌸", Toast.LENGTH_LONG).show()
                }
                true
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(ctx, "خطا در ذخیره عکس در گالری", Toast.LENGTH_SHORT).show()
                }
                false
            }
        }
    }
}

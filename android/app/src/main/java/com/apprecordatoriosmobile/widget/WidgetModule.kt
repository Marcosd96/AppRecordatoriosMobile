package com.apprecordatoriosmobile.widget

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Recibe desde JS (NativeModules.GesaccolWidget) los datos del widget, los guarda y lo
 * redibuja. El widget los lee aunque la app esté cerrada.
 */
class WidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  private val prefs
    get() = reactContext.getSharedPreferences(UpcomingWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)

  @ReactMethod
  fun setData(json: String) {
    prefs.edit().putString(UpcomingWidgetProvider.KEY_DATA, json).apply()
    UpcomingWidgetProvider.refreshAll(reactContext)
  }

  @ReactMethod
  fun clear() {
    prefs.edit().remove(UpcomingWidgetProvider.KEY_DATA).apply()
    UpcomingWidgetProvider.refreshAll(reactContext)
  }

  companion object {
    const val NAME = "GesaccolWidget"
  }
}

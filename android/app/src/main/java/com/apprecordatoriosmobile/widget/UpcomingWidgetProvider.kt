package com.apprecordatoriosmobile.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.apprecordatoriosmobile.R
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Widget "Próximos vencimientos". La app guarda los datos (ver WidgetModule y
 * src/services/widgetService.ts) y aquí se dibujan. Los textos relativos ("Hoy", "Mañana",
 * "Vencido") se calculan al dibujar, y el sistema lo redibuja cada hora, para que sigan
 * siendo correctos aunque la app no se abra.
 */
class UpcomingWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
    manager.updateAppWidget(appWidgetIds, buildViews(context))
  }

  companion object {
    const val PREFS_NAME = "gesaccol_widget"
    const val KEY_DATA = "data"

    private val ROWS = intArrayOf(R.id.row0, R.id.row1, R.id.row2, R.id.row3)
    private val TITLES = intArrayOf(R.id.row0_title, R.id.row1_title, R.id.row2_title, R.id.row3_title)
    private val SUBTITLES =
        intArrayOf(R.id.row0_subtitle, R.id.row1_subtitle, R.id.row2_subtitle, R.id.row3_subtitle)
    private val LABELS = intArrayOf(R.id.row0_label, R.id.row1_label, R.id.row2_label, R.id.row3_label)
    // La primera fila no lleva separador encima
    private val DIVIDERS = intArrayOf(0, R.id.row1_divider, R.id.row2_divider, R.id.row3_divider)

    private val LOCALE = Locale.forLanguageTag("es-CO")

    /** Redibuja todos los widgets colocados (tras recibir datos nuevos de la app) */
    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, UpcomingWidgetProvider::class.java))
      if (ids.isNotEmpty()) {
        manager.updateAppWidget(ids, buildViews(context))
      }
    }

    private fun buildViews(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.widget_upcoming)

      // Tocar el widget fuera de una fila abre la app
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
        views.setOnClickPendingIntent(
            R.id.widget_root,
            PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE),
        )
      }

      val json =
          context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_DATA, null)
      val data = json?.let { runCatching { JSONObject(it) }.getOrNull() }
      if (data == null) {
        // Sin sesión o la app aún no ha enviado datos
        showMessage(views, context.getString(R.string.widget_signed_out))
        return views
      }

      val now = System.currentTimeMillis()
      val today = startOfDay(now)

      val dueAts = data.optJSONArray("reminderDueAts")
      var overdue = 0
      for (i in 0 until (dueAts?.length() ?: 0)) {
        if (dueAts!!.getLong(i) < today) overdue++
      }
      if (overdue > 0) {
        views.setTextViewText(R.id.widget_overdue, "$overdue vencido${if (overdue == 1) "" else "s"}")
        views.setViewVisibility(R.id.widget_overdue, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_overdue, View.GONE)
      }

      val items = data.optJSONArray("items")
      val count = minOf(items?.length() ?: 0, ROWS.size)
      if (count == 0) {
        showMessage(views, context.getString(R.string.widget_empty))
        return views
      }
      views.setViewVisibility(R.id.widget_empty, View.GONE)
      views.setViewVisibility(R.id.widget_rows, View.VISIBLE)

      for (i in ROWS.indices) {
        val visibility = if (i < count) View.VISIBLE else View.GONE
        views.setViewVisibility(ROWS[i], visibility)
        if (DIVIDERS[i] != 0) views.setViewVisibility(DIVIDERS[i], visibility)
        if (i >= count) continue

        val item = items!!.getJSONObject(i)
        val dueAt = item.getLong("dueAt")
        val allDay = item.optBoolean("allDay", true)
        // Recordatorio: vencido desde el día siguiente. Tarea: atrasada en cuanto pasa su hora.
        val isOverdue = if (allDay) dueAt < today else dueAt < now

        views.setTextViewText(TITLES[i], item.optString("title"))
        views.setTextViewText(SUBTITLES[i], item.optString("subtitle"))
        views.setTextViewText(LABELS[i], if (isOverdue && !allDay) "Atrasada" else dueLabel(dueAt, allDay, today))
        views.setTextColor(
            LABELS[i],
            context.getColor(if (isOverdue) R.color.widget_overdue else R.color.widget_accent),
        )

        // Cada fila abre la app en ese elemento (enlace gesaccol://reminder/<id> o task/<id>)
        val uri = Uri.parse("gesaccol://${item.optString("kind")}/${Uri.encode(item.optString("id"))}")
        val open = Intent(Intent.ACTION_VIEW, uri).setPackage(context.packageName)
        views.setOnClickPendingIntent(
            ROWS[i],
            PendingIntent.getActivity(
                context,
                i + 1,
                open,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            ),
        )
      }
      return views
    }

    private fun showMessage(views: RemoteViews, message: String) {
      views.setTextViewText(R.id.widget_empty, message)
      views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
      views.setViewVisibility(R.id.widget_rows, View.GONE)
    }

    private fun startOfDay(millis: Long): Long =
        Calendar.getInstance()
            .apply {
              timeInMillis = millis
              set(Calendar.HOUR_OF_DAY, 0)
              set(Calendar.MINUTE, 0)
              set(Calendar.SECOND, 0)
              set(Calendar.MILLISECOND, 0)
            }
            .timeInMillis

    /** Días de calendario entre hoy y la fecha (negativo si ya pasó) */
    private fun daysFromToday(millis: Long, today: Long): Int {
      val target = Calendar.getInstance().apply { timeInMillis = startOfDay(millis) }
      val current = Calendar.getInstance().apply { timeInMillis = today }
      var days = 0
      // Contando días de calendario se evitan los errores de los cambios de horario
      while (current.before(target)) {
        current.add(Calendar.DAY_OF_YEAR, 1)
        days++
      }
      while (current.after(target)) {
        current.add(Calendar.DAY_OF_YEAR, -1)
        days--
      }
      return days
    }

    private fun dueLabel(dueAt: Long, allDay: Boolean, today: Long): String {
      val days = daysFromToday(dueAt, today)
      if (allDay) {
        return when {
          days < 0 -> "Vencido"
          days == 0 -> "Hoy"
          days == 1 -> "Mañana"
          else -> "En $days días"
        }
      }
      val time = SimpleDateFormat("HH:mm", LOCALE).format(Date(dueAt))
      return when (days) {
        0 -> "Hoy $time"
        1 -> "Mañana $time"
        else -> SimpleDateFormat("d MMM", LOCALE).format(Date(dueAt)).replace(".", "")
      }
    }
  }
}

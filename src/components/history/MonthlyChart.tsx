import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MonthSummary } from './historyStats';

// Mismos tonos en claro y oscuro: validados contra ambas superficies. La separación para
// daltonismo es justa, así que siempre van con leyenda, hueco entre segmentos y cifras.
export const ON_TIME_COLOR = '#16a34a';
export const LATE_COLOR = '#d97706';

const CHART_HEIGHT = 120;

interface MonthlyChartProps {
  isDark: boolean;
  months: MonthSummary[];
}

/**
 * Recordatorios completados por mes, apilados en "a tiempo" y "tarde". Al tocar un mes se
 * muestra su detalle (incluidas las tareas, que se miden aparte y no comparten eje).
 */
export default function MonthlyChart({ isDark, months }: MonthlyChartProps) {
  const [selectedKey, setSelectedKey] = useState(months[months.length - 1]?.key);
  const max = Math.max(1, ...months.map(m => m.remindersOnTime + m.remindersLate));
  const selected = months.find(m => m.key === selectedKey);
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const baselineColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <View>
      <View className="flex-row" style={styles.legend}>
        <LegendItem color={ON_TIME_COLOR} label="A tiempo" textClass={mutedText} />
        <LegendItem color={LATE_COLOR} label="Tarde" textClass={mutedText} />
      </View>

      <View className="flex-row items-end">
        {months.map(month => {
          const onTimeHeight = (month.remindersOnTime / max) * CHART_HEIGHT;
          const lateHeight = (month.remindersLate / max) * CHART_HEIGHT;
          const isSelected = month.key === selectedKey;
          return (
            <TouchableOpacity
              key={month.key}
              onPress={() => setSelectedKey(month.key)}
              accessibilityRole="button"
              accessibilityLabel={
                `${month.label}: ${month.remindersOnTime} a tiempo, ${month.remindersLate} tarde, ` +
                `${month.taskCompletions} tareas`
              }
              accessibilityState={{ selected: isSelected }}
              className="flex-1 items-center"
            >
              <View style={[styles.column, { height: CHART_HEIGHT }]}>
                {lateHeight > 0 && (
                  <View
                    style={[
                      styles.bar,
                      styles.topSegment,
                      { height: lateHeight, backgroundColor: LATE_COLOR },
                    ]}
                  />
                )}
                {onTimeHeight > 0 && (
                  <View
                    style={[
                      styles.bar,
                      lateHeight > 0 ? styles.bottomSegment : styles.topSegment,
                      { height: onTimeHeight, backgroundColor: ON_TIME_COLOR },
                    ]}
                  />
                )}
              </View>
              <View style={[styles.baseline, { backgroundColor: baselineColor }]} />
              <Text
                className={`text-xs mt-1.5 ${
                  isSelected
                    ? `font-bold ${isDark ? 'text-white' : 'text-gray-900'}`
                    : mutedText
                }`}
              >
                {month.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected && (
        <Text className={`text-sm mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <Text className="font-semibold">{selected.label}: </Text>
          {selected.remindersOnTime} a tiempo · {selected.remindersLate} tarde ·{' '}
          {selected.taskCompletions} tarea{selected.taskCompletions === 1 ? '' : 's'} completada
          {selected.taskCompletions === 1 ? '' : 's'}
        </Text>
      )}
    </View>
  );
}

function LegendItem({ color, label, textClass }: { color: string; label: string; textClass: string }) {
  return (
    <View className="flex-row items-center mr-4">
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text className={`text-xs ${textClass}`}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { marginBottom: 12 },
  column: { width: '60%', maxWidth: 28, justifyContent: 'flex-end' },
  bar: { width: '100%' },
  // Extremo redondeado arriba y hueco de 2 px entre segmentos apilados
  topSegment: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  bottomSegment: { marginTop: 2 },
  baseline: { height: 1, alignSelf: 'stretch' },
  swatch: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
});

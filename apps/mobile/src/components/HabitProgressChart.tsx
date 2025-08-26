import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Habit, HabitEntry } from '@habit-app/shared';
import { format, subDays, startOfDay } from 'date-fns';

interface HabitProgressChartProps {
  habit: Habit;
  entries: HabitEntry[];
  days?: number;
  type?: 'line' | 'bar';
}

const screenWidth = Dimensions.get('window').width;

export function HabitProgressChart({ 
  habit, 
  entries, 
  days = 7,
  type = 'bar' 
}: HabitProgressChartProps) {
  const chartData = React.useMemo(() => {
    const today = startOfDay(new Date());
    const labels: string[] = [];
    const data: number[] = [];
    
    // Create a map of dates to entries
    const entryMap = new Map(
      entries.map(entry => [
        format(new Date(entry.date), 'yyyy-MM-dd'),
        entry
      ])
    );
    
    // Generate data for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entryMap.get(dateStr);
      
      labels.push(format(date, 'EEE'));
      data.push(entry?.completed ? 1 : 0);
    }
    
    return { labels, data };
  }, [entries, days]);

  const completionRate = React.useMemo(() => {
    const completed = chartData.data.filter(d => d === 1).length;
    return Math.round((completed / chartData.data.length) * 100);
  }, [chartData]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  const Chart = type === 'line' ? LineChart : BarChart;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Progress</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {completionRate}% Complete
          </Text>
        </View>
      </View>

      <Chart
        data={{
          labels: chartData.labels,
          datasets: [{
            data: chartData.data,
          }],
        }}
        width={screenWidth - 32}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={chartConfig}
        bezier={type === 'line'}
        style={styles.chart}
        fromZero
        segments={1}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e5e7eb' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
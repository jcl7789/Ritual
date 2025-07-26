import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { RootState } from '../store/store';
import { StatsService, PeriodStats, TimeSeriesData, TrendData } from '../services/analytics/StatsService';

const { width: screenWidth } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#6366f1',
  },
};

type PeriodType = 'week' | 'month' | 'year' | 'all';

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { entries } = useSelector((state: RootState) => state.entries);
  
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateStats();
  }, [entries, selectedPeriod]);

  const calculateStats = async () => {
    setLoading(true);
    try {
      let filteredEntries = entries;
      let startDate = new Date();
      let endDate = new Date();

      // Determinar rango de fechas según período seleccionado
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(Math.min(...entries.map(e => new Date(e.date).getTime())));
          break;
      }

      // Calcular estadísticas del período
      const periodStats = selectedPeriod === 'all' 
        ? StatsService.calculateGeneralStats(entries)
        : StatsService.calculatePeriodStats(entries, startDate, endDate);

      // Generar datos de serie temporal
      const timeSeriesInterval = selectedPeriod === 'year' ? 'month' : 'day';
      const timeSeries = StatsService.generateTimeSeriesData(
        filteredEntries,
        timeSeriesInterval,
        startDate,
        endDate
      );

      // Calcular tendencias
      const weeklyTrend = StatsService.calculateTrends(entries, 'week');
      const monthlyTrend = StatsService.calculateTrends(entries, 'month');

      setStats(periodStats);
      setTimeSeriesData(timeSeries);
      setTrends([weeklyTrend, monthlyTrend]);
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportStats = async () => {
    try {
      const csvData = StatsService.exportStatsToCSV(entries);
      
      // En una implementación real, guardarías esto en un archivo temporal
      Alert.alert(
        t('statistics.export.title'),
        t('statistics.export.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('statistics.export.share'), 
            onPress: () => {
              // Implementar sharing del CSV
              console.log('CSV Data:', csvData);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to export statistics');
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year', 'all'] as PeriodType[]).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {t(`statistics.periods.${period}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>{t('statistics.overview.title')}</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>{t('statistics.overview.totalEntries')}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.averageSatisfaction?.toFixed(1) || '--'}
            </Text>
            <Text style={styles.statLabel}>{t('statistics.overview.avgSatisfaction')}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>{t('statistics.overview.currentStreak')}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>{t('statistics.overview.longestStreak')}</Text>
          </View>
        </View>

        {stats.mostActiveDay && (
          <View style={styles.mostActiveDay}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.mostActiveDayText}>
              {t('statistics.overview.mostActiveDay', { day: stats.mostActiveDay })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTrendsCard = () => {
    if (trends.length === 0) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('statistics.trends.title')}</Text>
        
        {trends.map((trend, index) => (
          <View key={trend.period} style={styles.trendItem}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendPeriod}>
                {t(`statistics.trends.${trend.period}`)}
              </Text>
              <View style={[
                styles.trendBadge,
                { backgroundColor: getTrendColor(trend.trend) }
              ]}>
                <Ionicons 
                  name={getTrendIcon(trend.trend)} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.trendBadgeText}>
                  {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(0)}%
                </Text>
              </View>
            </View>
            
            <Text style={styles.trendDescription}>
              {t(`statistics.trends.${trend.trend}Description`, {
                current: trend.comparison.current,
                previous: trend.comparison.previous
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderActivityChart = () => {
    if (!stats || stats.activitiesBreakdown.length === 0) return null;

    const chartData = stats.activitiesBreakdown.slice(0, 6).map((activity, index) => ({
      name: t(activity.activityType.name).substring(0, 8),
      count: activity.count,
      color: getChartColor(index),
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('statistics.activities.title')}</Text>
        
        <PieChart
          data={chartData}
          width={screenWidth - 60}
          height={200}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
        
        <View style={styles.activityList}>
          {stats.activitiesBreakdown.slice(0, 3).map((activity, index) => (
            <View key={activity.activityType.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>{activity.activityType.icon}</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>
                  {t(activity.activityType.name)}
                </Text>
                <Text style={styles.activityStats}>
                  {activity.count} entries • {activity.percentage.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.activitySatisfaction}>
                {activity.averageSatisfaction ? 
                  `★ ${activity.averageSatisfaction.toFixed(1)}` : 
                  '--'
                }
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTimeSeriesChart = () => {
    if (timeSeriesData.length === 0) return null;

    const chartData = {
      labels: timeSeriesData.map(item => {
        const date = new Date(item.date);
        return selectedPeriod === 'year' 
          ? date.toLocaleDateString('en', { month: 'short' })
          : date.getDate().toString();
      }),
      datasets: [
        {
          data: timeSeriesData.map(item => item.count),
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('statistics.timeline.title')}</Text>
        
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderPartnersCard = () => {
    if (!stats || stats.partnersBreakdown.length === 0) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('statistics.partners.title')}</Text>
        
        {stats.partnersBreakdown.slice(0, 5).map((partner, index) => (
          <View key={partner.partner} style={styles.partnerItem}>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{partner.partner}</Text>
              <Text style={styles.partnerStats}>
                {partner.count} entries • {partner.percentage.toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.partnerSatisfaction}>
              {partner.averageSatisfaction ? 
                `★ ${partner.averageSatisfaction.toFixed(1)}` : 
                '--'
              }
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return '#10b981';
      case 'decreasing': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'trending-up-outline';
      case 'decreasing': return 'trending-down-outline';
      default: return 'remove-outline';
    }
  };

  const getChartColor = (index: number) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('statistics.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('statistics.title')}</Text>
        <TouchableOpacity onPress={handleExportStats} style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {renderPeriodSelector()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOverviewCard()}
        {renderTrendsCard()}
        {renderTimeSeriesChart()}
        {renderActivityChart()}
        {renderPartnersCard()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  exportButton: {
    padding: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  mostActiveDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  mostActiveDayText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  trendItem: {
    marginBottom: 16,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  trendDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityList: {
    marginTop: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  activitySatisfaction: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  partnerStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  partnerSatisfaction: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});
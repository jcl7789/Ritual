import { Entry, ActivityType } from '../../types/Entry';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  isSameDay,
  differenceInDays,
  subDays,
  subMonths
} from 'date-fns';

export interface TimeSeriesData {
  date: string;
  count: number;
  averageSatisfaction?: number;
}

export interface ActivityStats {
  activityType: ActivityType;
  count: number;
  percentage: number;
  averageSatisfaction?: number;
  averageDuration?: number;
  lastActivity?: Date;
}

export interface PartnerStats {
  partner: string;
  count: number;
  percentage: number;
  averageSatisfaction?: number;
  activities: { [activityId: string]: number };
}

export interface PeriodStats {
  totalEntries: number;
  averageSatisfaction?: number;
  averageDuration?: number;
  mostActiveDay?: string;
  longestStreak: number;
  currentStreak: number;
  activitiesBreakdown: ActivityStats[];
  partnersBreakdown: PartnerStats[];
}

export interface TrendData {
  period: 'week' | 'month' | 'year';
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  comparison: {
    current: number;
    previous: number;
  };
}

export class StatsService {
  
  /**
   * Calcula estadísticas generales
   */
  static calculateGeneralStats(entries: Entry[]): PeriodStats {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        longestStreak: 0,
        currentStreak: 0,
        activitiesBreakdown: [],
        partnersBreakdown: []
      };
    }

    const totalEntries = entries.length;
    const entriesWithSatisfaction = entries.filter(e => e.satisfaction);
    const entriesWithDuration = entries.filter(e => e.duration);
    
    const averageSatisfaction = entriesWithSatisfaction.length > 0 
      ? entriesWithSatisfaction.reduce((sum, e) => sum + (e.satisfaction || 0), 0) / entriesWithSatisfaction.length
      : undefined;
    
    const averageDuration = entriesWithDuration.length > 0
      ? entriesWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / entriesWithDuration.length
      : undefined;

    const mostActiveDay = this.getMostActiveDay(entries);
    const { longestStreak, currentStreak } = this.calculateStreaks(entries);
    const activitiesBreakdown = this.getActivitiesBreakdown(entries);
    const partnersBreakdown = this.getPartnersBreakdown(entries);

    return {
      totalEntries,
      averageSatisfaction,
      averageDuration,
      mostActiveDay,
      longestStreak,
      currentStreak,
      activitiesBreakdown,
      partnersBreakdown
    };
  }

  /**
   * Calcula estadísticas para un período específico
   */
  static calculatePeriodStats(
    entries: Entry[], 
    startDate: Date, 
    endDate: Date
  ): PeriodStats {
    const periodEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    return this.calculateGeneralStats(periodEntries);
  }

  /**
   * Genera datos de serie temporal
   */
  static generateTimeSeriesData(
    entries: Entry[],
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): TimeSeriesData[] {
    let intervals: Date[];
    let formatString: string;

    switch (period) {
      case 'day':
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy-MM-dd';
        break;
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy-MM-dd';
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy-MM';
        break;
    }

    return intervals.map(date => {
      const periodEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        
        switch (period) {
          case 'day':
            return isSameDay(entryDate, date);
          case 'week':
            return entryDate >= startOfWeek(date) && entryDate <= endOfWeek(date);
          case 'month':
            return entryDate >= startOfMonth(date) && entryDate <= endOfMonth(date);
        }
      });

      const satisfactionEntries = periodEntries.filter(e => e.satisfaction);
      const averageSatisfaction = satisfactionEntries.length > 0
        ? satisfactionEntries.reduce((sum, e) => sum + (e.satisfaction || 0), 0) / satisfactionEntries.length
        : undefined;

      return {
        date: format(date, formatString),
        count: periodEntries.length,
        averageSatisfaction
      };
    });
  }

  /**
   * Calcula tendencias
   */
  static calculateTrends(
    entries: Entry[],
    period: 'week' | 'month' | 'year'
  ): TrendData {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case 'week':
        currentStart = startOfWeek(now);
        currentEnd = endOfWeek(now);
        previousStart = startOfWeek(subDays(now, 7));
        previousEnd = endOfWeek(subDays(now, 7));
        break;
      case 'month':
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
        break;
      case 'year':
        currentStart = startOfYear(now);
        currentEnd = endOfYear(now);
        previousStart = startOfYear(subMonths(now, 12));
        previousEnd = endOfYear(subMonths(now, 12));
        break;
    }

    const currentCount = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= currentStart && entryDate <= currentEnd;
    }).length;

    const previousCount = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= previousStart && entryDate <= previousEnd;
    }).length;

    let changePercentage = 0;
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (previousCount > 0) {
      changePercentage = ((currentCount - previousCount) / previousCount) * 100;
      
      if (changePercentage > 5) trend = 'increasing';
      else if (changePercentage < -5) trend = 'decreasing';
    } else if (currentCount > 0) {
      trend = 'increasing';
      changePercentage = 100;
    }

    return {
      period,
      trend,
      changePercentage,
      comparison: {
        current: currentCount,
        previous: previousCount
      }
    };
  }

  /**
   * Obtiene el día más activo de la semana
   */
  private static getMostActiveDay(entries: Entry[]): string | undefined {
    const dayCount: { [key: string]: number } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    entries.forEach(entry => {
      const dayOfWeek = new Date(entry.date).getDay();
      const dayName = dayNames[dayOfWeek];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });

    let mostActiveDay: string | undefined;
    let maxCount = 0;

    Object.entries(dayCount).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });

    return mostActiveDay;
  }

  /**
   * Calcula rachas de actividad
   */
  private static calculateStreaks(entries: Entry[]): { longestStreak: number; currentStreak: number } {
    if (entries.length === 0) return { longestStreak: 0, currentStreak: 0 };

    // Ordenar entradas por fecha
    const sortedEntries = entries.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Obtener días únicos con actividad
    const uniqueDays = Array.from(new Set(
      sortedEntries.map(entry => format(new Date(entry.date), 'yyyy-MM-dd'))
    )).sort();

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 1;

    // Calcular racha más larga
    for (let i = 1; i < uniqueDays.length; i++) {
      const prevDate = new Date(uniqueDays[i - 1]);
      const currDate = new Date(uniqueDays[i]);
      const dayDiff = differenceInDays(currDate, prevDate);

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calcular racha actual
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    if (uniqueDays.includes(today) || uniqueDays.includes(yesterday)) {
      let i = uniqueDays.length - 1;
      currentStreak = 1;
      
      while (i > 0) {
        const prevDate = new Date(uniqueDays[i - 1]);
        const currDate = new Date(uniqueDays[i]);
        const dayDiff = differenceInDays(currDate, prevDate);
        
        if (dayDiff === 1) {
          currentStreak++;
          i--;
        } else {
          break;
        }
      }
    }

    return { longestStreak, currentStreak };
  }

  /**
   * Obtiene desglose de actividades
   */
  private static getActivitiesBreakdown(entries: Entry[]): ActivityStats[] {
    const activityMap = new Map<string, {
      activityType: ActivityType;
      count: number;
      satisfactionSum: number;
      satisfactionCount: number;
      durationSum: number;
      durationCount: number;
      lastActivity: Date;
    }>();

    entries.forEach(entry => {
      const key = entry.activityType.id;
      const existing = activityMap.get(key);
      
      if (existing) {
        existing.count++;
        if (entry.satisfaction) {
          existing.satisfactionSum += entry.satisfaction;
          existing.satisfactionCount++;
        }
        if (entry.duration) {
          existing.durationSum += entry.duration;
          existing.durationCount++;
        }
        if (new Date(entry.date) > existing.lastActivity) {
          existing.lastActivity = new Date(entry.date);
        }
      } else {
        activityMap.set(key, {
          activityType: entry.activityType,
          count: 1,
          satisfactionSum: entry.satisfaction || 0,
          satisfactionCount: entry.satisfaction ? 1 : 0,
          durationSum: entry.duration || 0,
          durationCount: entry.duration ? 1 : 0,
          lastActivity: new Date(entry.date)
        });
      }
    });

    const totalEntries = entries.length;
    
    return Array.from(activityMap.values())
      .map(item => ({
        activityType: item.activityType,
        count: item.count,
        percentage: (item.count / totalEntries) * 100,
        averageSatisfaction: item.satisfactionCount > 0 
          ? item.satisfactionSum / item.satisfactionCount 
          : undefined,
        averageDuration: item.durationCount > 0 
          ? item.durationSum / item.durationCount 
          : undefined,
        lastActivity: item.lastActivity
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Obtiene desglose de parejas
   */
  private static getPartnersBreakdown(entries: Entry[]): PartnerStats[] {
    const partnerMap = new Map<string, {
      count: number;
      satisfactionSum: number;
      satisfactionCount: number;
      activities: { [activityId: string]: number };
    }>();

    entries.forEach(entry => {
      if (!entry.partner) return;
      
      const existing = partnerMap.get(entry.partner);
      
      if (existing) {
        existing.count++;
        if (entry.satisfaction) {
          existing.satisfactionSum += entry.satisfaction;
          existing.satisfactionCount++;
        }
        existing.activities[entry.activityType.id] = 
          (existing.activities[entry.activityType.id] || 0) + 1;
      } else {
        partnerMap.set(entry.partner, {
          count: 1,
          satisfactionSum: entry.satisfaction || 0,
          satisfactionCount: entry.satisfaction ? 1 : 0,
          activities: { [entry.activityType.id]: 1 }
        });
      }
    });

    const entriesWithPartner = entries.filter(e => e.partner).length;
    
    return Array.from(partnerMap.entries())
      .map(([partner, data]) => ({
        partner,
        count: data.count,
        percentage: (data.count / entriesWithPartner) * 100,
        averageSatisfaction: data.satisfactionCount > 0 
          ? data.satisfactionSum / data.satisfactionCount 
          : undefined,
        activities: data.activities
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Exporta estadísticas a CSV
   */
  static exportStatsToCSV(entries: Entry[]): string {
    const stats = this.calculateGeneralStats(entries);
    const timeSeriesData = this.generateTimeSeriesData(
      entries, 
      'day', 
      subDays(new Date(), 30), 
      new Date()
    );

    let csv = 'Date,Count,Average Satisfaction\n';
    timeSeriesData.forEach(item => {
      csv += `${item.date},${item.count},${item.averageSatisfaction || ''}\n`;
    });

    csv += '\n\nActivity Breakdown\n';
    csv += 'Activity,Count,Percentage,Average Satisfaction,Average Duration\n';
    stats.activitiesBreakdown.forEach(activity => {
      csv += `${activity.activityType.name},${activity.count},${activity.percentage.toFixed(1)}%,${activity.averageSatisfaction?.toFixed(1) || ''},${activity.averageDuration?.toFixed(0) || ''}\n`;
    });

    return csv;
  }

  /**
   * Calcula correlaciones entre variables
   */
  static calculateCorrelations(entries: Entry[]): {
    satisfactionVsDuration?: number;
    satisfactionVsFrequency?: number;
  } {
    const correlations: any = {};

    // Correlación satisfacción vs duración
    const entriesWithBoth = entries.filter(e => e.satisfaction && e.duration);
    if (entriesWithBoth.length > 5) {
      const satisfactionValues = entriesWithBoth.map(e => e.satisfaction!);
      const durationValues = entriesWithBoth.map(e => e.duration!);
      correlations.satisfactionVsDuration = this.calculatePearsonCorrelation(
        satisfactionValues, 
        durationValues
      );
    }

    return correlations;
  }

  /**
   * Calcula coeficiente de correlación de Pearson
   */
  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Predice tendencias futuras (simple predicción lineal)
   */
  static predictTrend(entries: Entry[], days: number = 30): {
    predictedCount: number;
    confidence: 'low' | 'medium' | 'high';
  } {
    if (entries.length < 10) {
      return { predictedCount: 0, confidence: 'low' };
    }

    const last30Days = this.generateTimeSeriesData(
      entries,
      'day',
      subDays(new Date(), 30),
      new Date()
    );

    const counts = last30Days.map(d => d.count);
    const trend = this.calculateLinearTrend(counts);
    
    const predictedCount = Math.max(0, Math.round(
      counts[counts.length - 1] + (trend * days)
    ));

    // Determinar confianza basada en consistencia de datos
    const variance = this.calculateVariance(counts);
    const confidence = variance < 1 ? 'high' : variance < 4 ? 'medium' : 'low';

    return { predictedCount, confidence };
  }

  /**
   * Calcula tendencia lineal simple
   */
  private static calculateLinearTrend(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    const xSum = (n * (n - 1)) / 2;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xxSum = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Calcula varianza
   */
  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
}
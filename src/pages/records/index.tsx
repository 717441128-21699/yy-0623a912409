import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useVehicleStore } from '@/store/vehicleStore';
import { mockAlerts, mockFeedbacks } from '@/data/mockData';
import RecordItem from '@/components/RecordItem';
import type { AlertRecord } from '@/types';

type FilterType = 'all' | 'handled' | 'pending';

const RecordsPage: React.FC = () => {
  const { alerts, feedbackRecords } = useVehicleStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const allAlerts = useMemo(() => {
    const storeAlerts = alerts.length > 0 ? alerts : mockAlerts;
    const allRecords = [...storeAlerts];
    
    mockAlerts.forEach(mockAlert => {
      const exists = allRecords.find(a => a.id === mockAlert.id);
      if (!exists) {
        allRecords.push(mockAlert);
      }
    });
    
    return allRecords.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [alerts]);

  const allFeedbacks = useMemo(() => {
    const storeFeedbacks = feedbackRecords.length > 0 ? feedbackRecords : mockFeedbacks;
    return storeFeedbacks;
  }, [feedbackRecords]);

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case 'handled':
        return allAlerts.filter(a => a.status === 'handled');
      case 'pending':
        return allAlerts.filter(a => a.status === 'pending');
      default:
        return allAlerts;
    }
  }, [filter, allAlerts]);

  const stats = useMemo(() => ({
    total: allAlerts.length,
    handled: allAlerts.filter(a => a.status === 'handled').length,
    pending: allAlerts.filter(a => a.status === 'pending').length
  }), [allAlerts]);

  const getFeedback = (alertId: string) => {
    return allFeedbacks.find(f => f.alertId === alertId);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    console.log('[RecordsPage] 筛选条件变更', newFilter);
  };

  const handleRecordClick = (alert: AlertRecord) => {
    console.log('[RecordsPage] 点击记录', alert.id);
    Taro.navigateTo({
      url: `/pages/alert-detail/index?id=${alert.id}`
    });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'handled', label: '已处理' },
    { key: 'pending', label: '待处理' }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statsCard}>
        <View className={styles.statsGrid}>
          <View className={styles.statsItem}>
            <Text className={styles.statsValue}>{stats.total}</Text>
            <Text className={styles.statsLabel}>总告警数</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={`${styles.statsValue} ${styles.statsValueSuccess}`}>
              {stats.handled}
            </Text>
            <Text className={styles.statsLabel}>已处理</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={`${styles.statsValue} ${styles.statsValueDanger}`}>
              {stats.pending}
            </Text>
            <Text className={styles.statsLabel}>待处理</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, {
              [styles.filterActive]: filter === f.key,
              [styles.filterInactive]: filter !== f.key
            })}
            onClick={() => handleFilterChange(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>处置记录</Text>
        <Text className={styles.sectionCount}>共 {filteredAlerts.length} 条</Text>
      </View>

      <View className={styles.recordList}>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <RecordItem
              key={alert.id}
              alert={alert}
              feedback={getFeedback(alert.id)}
              onClick={() => handleRecordClick(alert)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无{filter === 'handled' ? '已处理' : filter === 'pending' ? '待处理' : ''}记录</Text>
            <Text className={styles.emptySubtext}>
              {filter === 'pending' 
                ? '当前没有待处理的告警，一切正常' 
                : '处置记录将在这里显示'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RecordsPage;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import { useVehicleStore } from '@/store/vehicleStore';
import { triggerFullAlert } from '@/utils/alert';
import StatusCard from '@/components/StatusCard';
import AlertCard from '@/components/AlertCard';
import { mockAlerts } from '@/data/mockData';
import type { AlertRecord, MonitorStatus } from '@/types';

const MonitorPage: React.FC = () => {
  const {
    isBound,
    vehicleInfo,
    monitorStatus,
    alerts,
    currentAlert,
    simulateAlert,
    updateMonitorStatus,
    clearCurrentAlert,
    isInitialized
  } = useVehicleStore();

  const [displayAlerts, setDisplayAlerts] = useState<AlertRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const alertTriggeredRef = useRef<Set<string>>(new Set());
  const simulationCounterRef = useRef(0);

  useEffect(() => {
    if (alerts.length > 0) {
      setDisplayAlerts(alerts.slice(0, 10));
    } else if (isBound && isInitialized) {
      setDisplayAlerts(mockAlerts.slice(0, 5));
    }
  }, [alerts, isBound, isInitialized]);

  useEffect(() => {
    if (currentAlert && !alertTriggeredRef.current.has(currentAlert.id)) {
      alertTriggeredRef.current.add(currentAlert.id);
      console.log('[MonitorPage] 检测到新告警', currentAlert.title, currentAlert.id);
      triggerFullAlert(currentAlert.title, currentAlert.description);
    }
  }, [currentAlert]);

  useEffect(() => {
    if (!isBound || !monitorStatus) return;

    const interval = setInterval(() => {
      simulationCounterRef.current++;
      
      let newStatus: MonitorStatus = {
        ...monitorStatus,
        lastReportTime: new Date().toISOString()
      };

      const hasPendingAlert = currentAlert && currentAlert.status === 'pending';

      if (!hasPendingAlert && simulationCounterRef.current % 6 === 0) {
        const anomalyType = Math.floor(Math.random() * 4);
        
        switch (anomalyType) {
          case 0:
            console.log('[MonitorPage] 模拟主电断开异常');
            newStatus = {
              ...newStatus,
              powerStatus: 'danger',
              powerStatusText: '供电异常',
              voltage: 18.5
            };
            break;
          case 1:
            console.log('[MonitorPage] 模拟冷机停机异常');
            newStatus = {
              ...newStatus,
              compressorStatus: 'stopped'
            };
            break;
          case 2:
            console.log('[MonitorPage] 模拟温度回升异常');
            const tempRise = Math.random() * 5 + 2;
            newStatus = {
              ...newStatus,
              currentTemperature: Math.round((monitorStatus.currentTemperature + tempRise) * 10) / 10
            };
            break;
          default:
            console.log('[MonitorPage] 模拟正常波动');
            const normalTemp = monitorStatus.currentTemperature + (Math.random() - 0.5) * 0.8;
            newStatus = {
              ...newStatus,
              currentTemperature: Math.round(normalTemp * 10) / 10,
              voltage: 24 + Math.random() * 1.5,
              compressorStatus: 'running'
            };
        }
      } else if (hasPendingAlert) {
        console.log('[MonitorPage] 有待处理告警，保持当前状态');
      } else {
        const normalTemp = monitorStatus.currentTemperature + (Math.random() - 0.5) * 0.5;
        newStatus = {
          ...newStatus,
          currentTemperature: Math.round(normalTemp * 10) / 10,
          voltage: 24 + Math.random() * 1.5,
          powerStatus: 'normal',
          powerStatusText: '供电正常',
          compressorStatus: 'running'
        };
      }

      updateMonitorStatus(newStatus);
    }, 8000);

    return () => clearInterval(interval);
  }, [isBound, monitorStatus, updateMonitorStatus, currentAlert]);

  useDidShow(() => {
    console.log('[MonitorPage] 页面显示');
    if (currentAlert && !alertTriggeredRef.current.has(currentAlert.id)) {
      alertTriggeredRef.current.add(currentAlert.id);
      triggerFullAlert(currentAlert.title, currentAlert.description);
    }
  });

  usePullDownRefresh(() => {
    handleRefresh();
  });

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[MonitorPage] 手动刷新');
    
    if (isBound && monitorStatus) {
      const newStatus: MonitorStatus = {
        ...monitorStatus,
        lastReportTime: new Date().toISOString()
      };
      updateMonitorStatus(newStatus);
    }

    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  }, [isBound, monitorStatus, updateMonitorStatus]);

  const handleTestAlert = () => {
    if (!isBound) {
      Taro.showToast({ title: '请先绑定车辆', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '模拟告警测试',
      content: '将模拟触发一次随机告警，用于验证提醒功能是否正常。是否继续？',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          const alert = simulateAlert();
          console.log('[MonitorPage] 模拟告警触发', alert);
          Taro.showToast({ title: '告警已触发', icon: 'none' });
        }
      }
    });
  };

  const handleAlertClick = (alert: AlertRecord) => {
    console.log('[MonitorPage] 点击告警', alert.id);
    Taro.navigateTo({
      url: `/pages/alert-detail/index?id=${alert.id}`
    });
  };

  const handleGoBind = () => {
    Taro.switchTab({ url: '/pages/bind/index' });
  };

  const handleViewPendingAlert = () => {
    if (currentAlert) {
      Taro.navigateTo({
        url: `/pages/alert-detail/index?id=${currentAlert.id}`
      });
    }
  };

  if (!isInitialized) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ textAlign: 'center', padding: '200rpx 0' }}>
          <Text style={{ color: '#78909C', fontSize: '30rpx' }}>加载中...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!isBound) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>
            <Text className={styles.emptyIconText}>🚛</Text>
          </View>
          <Text className={styles.emptyTitle}>暂无绑定车辆</Text>
          <Text className={styles.emptyDesc}>
            请先绑定车辆信息，开启夜间守护模式，实时监控冷藏机组供电状态
          </Text>
          <Button className={styles.emptyBtn} onClick={handleGoBind}>
            立即绑定
          </Button>
        </View>
      </ScrollView>
    );
  }

  const pendingAlerts = displayAlerts.filter(a => a.status === 'pending');

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.vehicleInfoBar}>
        <View>
          <Text className={styles.vehiclePlate}>{vehicleInfo?.plateNumber}</Text>
        </View>
        <Text className={styles.vehicleCargo}>{vehicleInfo?.cargoType}</Text>
      </View>

      {currentAlert && (
        <View className={styles.pendingAlertBanner}>
          <Text className={styles.bannerTitle}>⚠️ {currentAlert.title}</Text>
          <Text className={styles.bannerDesc}>{currentAlert.description}</Text>
          <Button className={styles.bannerBtn} onClick={handleViewPendingAlert}>
            立即处理
          </Button>
        </View>
      )}

      {monitorStatus && (
        <StatusCard
          status={monitorStatus}
          hasAlert={pendingAlerts.length > 0}
        />
      )}

      <View className={styles.actionRow}>
        <Button
          className={`${styles.actionBtn} ${styles.testBtn}`}
          onClick={handleTestAlert}
        >
          模拟告警测试
        </Button>
        <Button
          className={`${styles.actionBtn} ${styles.refreshBtn}`}
          onClick={handleRefresh}
        >
          {isRefreshing ? '刷新中...' : '刷新数据'}
        </Button>
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>告警记录</Text>
        <Text className={styles.sectionCount}>共 {displayAlerts.length} 条</Text>
      </View>

      <View className={styles.alertList}>
        {displayAlerts.length > 0 ? (
          displayAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => handleAlertClick(alert)}
            />
          ))
        ) : (
          <View className={styles.emptyAlert}>
            <Text className={styles.emptyAlertText}>暂无告警记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MonitorPage;

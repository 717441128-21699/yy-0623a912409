import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import type { MonitorStatus } from '@/types';

interface StatusCardProps {
  status: MonitorStatus;
  hasAlert?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ status, hasAlert = false }) => {
  const statusClass = classnames(styles.statusBadge, {
    [styles.statusNormal]: status.powerStatus === 'normal',
    [styles.statusWarning]: status.powerStatus === 'warning',
    [styles.statusDanger]: status.powerStatus === 'danger',
    [styles.statusOffline]: status.powerStatus === 'offline'
  });

  return (
    <View className={styles.statusCard}>
      <View className={styles.statusHeader}>
        <Text className={styles.statusTitle}>供电状态</Text>
        <View className={statusClass}>
          <Text>{status.powerStatusText}</Text>
        </View>
      </View>

      <View className={styles.tempDisplay}>
        <Text className={styles.tempValue}>
          {status.currentTemperature}
          <Text className={styles.tempUnit}>℃</Text>
        </Text>
        <Text className={styles.tempTarget}>目标温度：{status.targetTemperature}℃</Text>
      </View>

      <View className={styles.infoGrid}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>压缩机</Text>
          <Text className={styles.infoValue}>
            {status.compressorStatus === 'running' ? '运行中' : '已停止'}
          </Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>电压</Text>
          <Text className={styles.infoValue}>{status.voltage}V</Text>
        </View>
      </View>

      <View className={styles.lastReport}>
        <Text>最近上报：{dayjs(status.lastReportTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
      </View>

      {hasAlert && (
        <View className={styles.alertBanner}>
          <Text className={styles.alertBannerText}>⚠️ 当前存在未处理告警，请立即处理！</Text>
        </View>
      )}
    </View>
  );
};

export default StatusCard;

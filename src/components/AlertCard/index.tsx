import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import type { AlertRecord } from '@/types';

interface AlertCardProps {
  alert: AlertRecord;
  onClick?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onClick }) => {
  const cardClass = classnames(styles.alertCard, {
    [styles.alertPending]: alert.status === 'pending',
    [styles.alertHandled]: alert.status === 'handled'
  });

  const badgeClass = classnames(styles.alertBadge, {
    [styles.badgePending]: alert.status === 'pending',
    [styles.badgeHandled]: alert.status === 'handled'
  });

  return (
    <View className={cardClass} onClick={onClick}>
      <View className={styles.alertHeader}>
        <Text className={styles.alertTitle}>{alert.title}</Text>
        <View className={badgeClass}>
          <Text>{alert.status === 'pending' ? '待处理' : '已处理'}</Text>
        </View>
      </View>

      <Text className={styles.alertDesc}>{alert.description}</Text>

      {alert.temperature !== undefined && (
        <Text className={styles.alertTemp}>当前温度：{alert.temperature}℃</Text>
      )}

      <View className={styles.alertMeta}>
        <Text className={styles.alertTime}>
          {dayjs(alert.timestamp).format('YYYY-MM-DD HH:mm')}
        </Text>
        <Text className={styles.alertPlate}>{alert.vehicleInfo.plateNumber}</Text>
      </View>
    </View>
  );
};

export default AlertCard;

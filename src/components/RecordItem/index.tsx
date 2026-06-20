import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { getPhotoPath } from '@/utils/photo';
import type { FeedbackRecord, AlertRecord } from '@/types';

interface RecordItemProps {
  alert: AlertRecord;
  feedback?: FeedbackRecord;
  onClick?: () => void;
}

const RecordItem: React.FC<RecordItemProps> = ({ alert, feedback, onClick }) => {
  if (!feedback) return null;

  return (
    <View className={styles.recordItem} onClick={onClick}>
      <View className={styles.recordHeader}>
        <Text className={styles.recordTitle}>{alert.title}</Text>
        <View className={styles.reasonBadge}>
          <Text>{feedback.reasonText}</Text>
        </View>
      </View>

      <View className={styles.recordMeta}>
        <Text className={styles.metaItem}>{alert.vehicleInfo.plateNumber}</Text>
        <Text className={styles.metaItem}>{alert.vehicleInfo.cargoType}</Text>
      </View>

      {feedback.photos.length > 0 && (
        <View className={styles.photoPreview}>
          {feedback.photos.slice(0, 3).map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image
                className={styles.photoImage}
                src={getPhotoPath(photo)}
                mode="aspectFill"
                lazyLoad
              />
            </View>
          ))}
          {feedback.photos.length > 3 && (
            <View className={styles.photoCount}>
              <Text>+{feedback.photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <Text className={styles.recordRemark}>{feedback.remark}</Text>

      <View className={styles.recordTime}>
        <Text>处置时间：{dayjs(feedback.timestamp).format('YYYY-MM-DD HH:mm')}</Text>
      </View>
    </View>
  );
};

export default RecordItem;

import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useVehicleStore } from '@/store/vehicleStore';
import { mockAlerts, mockFeedbacks } from '@/data/mockData';
import { STEP_GUIDANCE } from '@/types';
import type { AlertRecord, FeedbackRecord } from '@/types';

const AlertDetailPage: React.FC = () => {
  const router = useRouter();
  const alertId = router.params.id;
  
  const { alerts, feedbackRecords, submitFeedback } = useVehicleStore();
  const [alert, setAlert] = useState<AlertRecord | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRecord | null>(null);

  useEffect(() => {
    console.log('[AlertDetailPage] 页面加载，告警ID:', alertId);
    
    let foundAlert = alerts.find(a => a.id === alertId);
    if (!foundAlert) {
      foundAlert = mockAlerts.find(a => a.id === alertId);
    }
    
    if (foundAlert) {
      setAlert(foundAlert);
      
      let foundFeedback = feedbackRecords.find(f => f.alertId === alertId);
      if (!foundFeedback) {
        foundFeedback = mockFeedbacks.find(f => f.alertId === alertId);
      }
      setFeedback(foundFeedback || null);
    } else {
      Taro.showToast({ title: '告警不存在', icon: 'none' });
    }
  }, [alertId, alerts, feedbackRecords]);

  const handleCallDispatch = () => {
    console.log('[AlertDetailPage] 拨打调度电话');
    Taro.makePhoneCall({
      phoneNumber: '13800000000',
      success: () => console.log('[AlertDetailPage] 拨号成功'),
      fail: (err) => console.error('[AlertDetailPage] 拨号失败', err)
    });
  };

  const handleGoFeedback = () => {
    if (!alert) return;
    console.log('[AlertDetailPage] 跳转到处置回填', alert.id);
    Taro.navigateTo({
      url: `/pages/feedback/index?id=${alert.id}`
    });
  };

  const handlePreviewImage = (url: string, urls: string[]) => {
    console.log('[AlertDetailPage] 预览图片', url);
    Taro.previewImage({
      current: url,
      urls
    });
  };

  const alertTypeBadgeClass = classnames(styles.alertTypeBadge, {
    [styles.alertTypeHandled]: alert?.status === 'handled'
  });

  const statusIconClass = classnames(styles.statusIcon, {
    [styles.statusPending]: alert?.status === 'pending',
    [styles.statusHandled]: alert?.status === 'handled'
  });

  if (!alert) {
    return (
      <View className={styles.page}>
        <View style={{ textAlign: 'center', padding: '100rpx 0' }}>
          <Text style={{ color: '#78909C', fontSize: '30rpx' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.alertHeader}>
        <View className={alertTypeBadgeClass}>
          <Text>{alert.status === 'pending' ? '待处理' : '已处理'}</Text>
        </View>
        <Text className={styles.alertTitle}>{alert.title}</Text>
        <Text className={styles.alertDesc}>{alert.description}</Text>
        
        <View className={styles.alertMeta}>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>告警时间</Text>
            <Text className={styles.metaValue}>
              {dayjs(alert.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>车牌号码</Text>
            <Text className={styles.metaValue}>{alert.vehicleInfo.plateNumber}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>货品类型</Text>
            <Text className={styles.metaValue}>{alert.vehicleInfo.cargoType}</Text>
          </View>
          {alert.temperature !== undefined && (
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>当前温度</Text>
              <Text className={`${styles.metaValue} ${styles.metaValueDanger}`}>
                {alert.temperature}℃
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text className={styles.sectionTitle}>处理步骤</Text>
      <View className={styles.guidanceSection}>
        {STEP_GUIDANCE.map((step) => (
          <View key={step.step} className={styles.stepCard}>
            <View className={styles.stepHeader}>
              <View className={styles.stepNumber}>
                <Text>{step.step}</Text>
              </View>
              <Text className={styles.stepTitle}>{step.title}</Text>
            </View>
            <Text className={styles.stepDesc}>{step.description}</Text>
          </View>
        ))}
      </View>

      <View className={styles.contactSection}>
        <Text className={styles.contactTitle}>紧急联系调度</Text>
        <Text className={styles.contactPhone}>138-0000-0000</Text>
        <Button className={styles.contactBtn} onClick={handleCallDispatch}>
          立即拨打
        </Button>
      </View>

      <Text className={styles.sectionTitle}>处置回填</Text>
      <View className={styles.feedbackSection}>
        <View className={styles.feedbackCard}>
          <View className={styles.feedbackStatus}>
            <View className={statusIconClass}>
              <Text>{alert.status === 'pending' ? '!' : '✓'}</Text>
            </View>
            <Text className={styles.statusText}>
              {alert.status === 'pending' ? '尚未处置，请按上述步骤处理后回填' : '已完成处置回填'}
            </Text>
          </View>

          {feedback ? (
            <View className={styles.feedbackInfo}>
              <View className={styles.feedbackRow}>
                <Text className={styles.feedbackLabel}>处置原因</Text>
                <Text className={styles.feedbackValue}>{feedback.reasonText}</Text>
              </View>
              <View className={styles.feedbackRow}>
                <Text className={styles.feedbackLabel}>处置说明</Text>
                <Text className={styles.feedbackValue}>{feedback.remark}</Text>
              </View>
              {feedback.photos.length > 0 && (
                <View className={styles.feedbackRow}>
                  <Text className={styles.feedbackLabel}>照片凭证</Text>
                  <View className={styles.feedbackPhotos}>
                    {feedback.photos.map((photo, index) => (
                      <View
                        key={index}
                        className={styles.feedbackPhoto}
                        onClick={() => handlePreviewImage(photo, feedback.photos)}
                      >
                        <Image
                          className={styles.photoImg}
                          src={photo}
                          mode="aspectFill"
                          lazyLoad
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View className={styles.feedbackRow}>
                <Text className={styles.feedbackLabel}>处置时间</Text>
                <Text className={styles.feedbackValue}>
                  {dayjs(feedback.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </View>
            </View>
          ) : (
            alert.status === 'pending' && (
              <Button className={styles.feedbackBtn} onClick={handleGoFeedback}>
                填写处置回填
              </Button>
            )
          )}
        </View>
      </View>

      {alert.status === 'pending' && (
        <View className={styles.bottomBar}>
          <Button className={styles.primaryBtn} onClick={handleGoFeedback}>
            我已处理，填写回填
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default AlertDetailPage;

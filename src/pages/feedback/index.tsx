import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useVehicleStore } from '@/store/vehicleStore';
import { mockAlerts } from '@/data/mockData';
import { REASON_MAP } from '@/types';
import type { AlertRecord, FeedbackReason } from '@/types';

const MAX_PHOTOS = 6;

const FeedbackPage: React.FC = () => {
  const router = useRouter();
  const alertId = router.params.id;

  const getAlertById = useVehicleStore(state => state.getAlertById);
  const alerts = useVehicleStore(state => state.alerts);
  const submitFeedback = useVehicleStore(state => state.submitFeedback);

  const [selectedReason, setSelectedReason] = useState<FeedbackReason | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const alert = useMemo((): AlertRecord | null => {
    let found = getAlertById(alertId);
    if (!found) {
      found = alerts.find(a => a.id === alertId);
    }
    if (!found) {
      found = mockAlerts.find(a => a.id === alertId);
    }
    return found || null;
  }, [alertId, getAlertById, alerts]);

  useEffect(() => {
    console.log('[FeedbackPage] 页面加载，告警ID:', alertId);
    if (!alert) {
      Taro.showToast({ title: '告警不存在', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, [alertId, alert]);

  const handleReasonSelect = (reason: FeedbackReason) => {
    setSelectedReason(reason);
    console.log('[FeedbackPage] 选择原因:', reason);
  };

  const handleChooseImage = () => {
    if (photos.length >= MAX_PHOTOS) {
      Taro.showToast({ title: `最多上传${MAX_PHOTOS}张照片`, icon: 'none' });
      return;
    }

    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
        
        Taro.chooseImage({
          count: MAX_PHOTOS - photos.length,
          sourceType: sourceType as any,
          sizeType: ['compressed'],
          success: (res) => {
            const newPhotos = res.tempFilePaths;
            setPhotos(prev => [...prev, ...newPhotos]);
            console.log('[FeedbackPage] 选择照片:', newPhotos.length, '张');
          },
          fail: (err) => {
            console.error('[FeedbackPage] 选择照片失败', err);
            if (err.errMsg && !err.errMsg.includes('cancel')) {
              Taro.showToast({ title: '选择照片失败', icon: 'none' });
            }
          }
        });
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    Taro.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          setPhotos(prev => prev.filter((_, i) => i !== index));
          console.log('[FeedbackPage] 删除照片:', index);
        }
      }
    });
  };

  const handlePreviewImage = (url: string) => {
    Taro.previewImage({
      current: url,
      urls: photos
    });
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      Taro.showToast({ title: '请选择处置原因', icon: 'none' });
      return;
    }
    if (photos.length === 0) {
      Taro.showToast({ title: '请至少上传1张照片', icon: 'none' });
      return;
    }
    if (!remark.trim()) {
      Taro.showToast({ title: '请填写处置说明', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '提交确认',
      content: '确认提交处置回填？提交后将无法修改。',
      confirmColor: '#1E88E5',
      success: (res) => {
        if (res.confirm) {
          doSubmit();
        }
      }
    });
  };

  const doSubmit = () => {
    if (!alert || !selectedReason) return;

    setSubmitting(true);
    console.log('[FeedbackPage] 提交回填', {
      alertId: alert.id,
      reason: selectedReason,
      reasonText: REASON_MAP[selectedReason],
      photos: photos.length,
      remark: remark.length
    });

    setTimeout(() => {
      const feedbackRecord = submitFeedback(alert.id, {
        reason: selectedReason,
        reasonText: REASON_MAP[selectedReason],
        photos,
        remark: remark.trim()
      });

      setSubmitting(false);
      
      console.log('[FeedbackPage] 回填提交成功，跳转到告警详情', alert.id);
      
      Taro.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/alert-detail/index?id=${alert.id}`
        });
      }, 1500);
    }, 1000);
  };

  const reasons: { key: FeedbackReason; label: string }[] = [
    { key: 'power_unplug', label: '停车拔电' },
    { key: 'fuse_trip', label: '保险丝跳闸' },
    { key: 'compressor_fault', label: '冷机故障' },
    { key: 'other', label: '其他原因' }
  ];

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
    <View className={styles.page}>
      <View className={styles.alertInfoCard}>
        <Text className={styles.alertInfoTitle}>{alert.title}</Text>
        <Text className={styles.alertInfoDesc}>{alert.description}</Text>
        <View className={styles.alertInfoMeta}>
          <Text>{alert.vehicleInfo.plateNumber}</Text>
          <Text>{dayjs(alert.timestamp).format('MM-DD HH:mm')}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          处置原因<Text className={styles.required}>*</Text>
        </Text>
        <View className={styles.reasonList}>
          {reasons.map((reason) => {
            const isActive = selectedReason === reason.key;
            return (
              <View
                key={reason.key}
                className={classnames(styles.reasonItem, {
                  [styles.reasonActive]: isActive
                })}
                onClick={() => handleReasonSelect(reason.key)}
              >
                <View
                  className={classnames(styles.reasonRadio, {
                    [styles.reasonRadioActive]: isActive
                  })}
                >
                  {isActive && <View className={styles.reasonRadioInner} />}
                </View>
                <View className={styles.reasonContent}>
                  <Text className={styles.reasonTitle}>{reason.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.photoSection}>
        <Text className={styles.sectionTitle}>
          照片凭证<Text className={styles.required}>*</Text>
        </Text>
        <View className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <View
                className={styles.photoDelete}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(index);
                }}
              >
                <Text className={styles.photoDeleteText}>×</Text>
              </View>
              <Image
                className={styles.photoImage}
                src={photo}
                mode="aspectFill"
                onClick={() => handlePreviewImage(photo)}
                lazyLoad
              />
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <View className={styles.photoAdd} onClick={handleChooseImage}>
              <Text className={styles.photoAddIcon}>+</Text>
              <Text className={styles.photoAddText}>上传照片</Text>
            </View>
          )}
        </View>
        <Text className={styles.photoTip}>
          请拍摄仪表盘或冷机面板照片，最多{MAX_PHOTOS}张
        </Text>
      </View>

      <View className={styles.remarkSection}>
        <Text className={styles.sectionTitle}>
          处置说明<Text className={styles.required}>*</Text>
        </Text>
        <Input
          className={styles.remarkInput}
          type="textarea"
          placeholder="请详细描述处置过程和当前状态..."
          placeholderStyle="color: #546E7A"
          value={remark}
          onInput={(e) => setRemark(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <Text className={styles.remarkCount}>{remark.length}/500</Text>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交回填'}
        </Button>
      </View>
    </View>
  );
};

export default FeedbackPage;

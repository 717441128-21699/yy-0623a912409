import React, { useState } from 'react';
import { View, Text, Input, Picker, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useVehicleStore } from '@/store/vehicleStore';
import { CARGO_TYPES, TEMPERATURE_ZONES } from '@/types';
import type { VehicleInfo } from '@/types';

const BindPage: React.FC = () => {
  const { isBound, vehicleInfo, bindVehicle, unbindVehicle } = useVehicleStore();
  
  const [plateNumber, setPlateNumber] = useState('');
  const [cargoTypeIndex, setCargoTypeIndex] = useState<number | null>(null);
  const [tempZoneIndex, setTempZoneIndex] = useState<number | null>(null);
  const [arrivalTime, setArrivalTime] = useState('');

  const handleSubmit = () => {
    if (!plateNumber.trim()) {
      Taro.showToast({ title: '请输入车牌号', icon: 'none' });
      return;
    }
    if (cargoTypeIndex === null) {
      Taro.showToast({ title: '请选择货品类型', icon: 'none' });
      return;
    }
    if (tempZoneIndex === null) {
      Taro.showToast({ title: '请选择装车温区', icon: 'none' });
      return;
    }
    if (!arrivalTime) {
      Taro.showToast({ title: '请选择预计到站时间', icon: 'none' });
      return;
    }

    const info: Omit<VehicleInfo, 'bindTime'> = {
      plateNumber: plateNumber.toUpperCase().trim(),
      cargoType: CARGO_TYPES[cargoTypeIndex],
      temperatureZone: TEMPERATURE_ZONES[tempZoneIndex],
      estimatedArrival: arrivalTime
    };

    bindVehicle(info);
    
    console.log('[BindPage] 车辆绑定提交', info);
    
    Taro.showToast({
      title: '绑定成功',
      icon: 'success',
      duration: 2000
    });

    Taro.switchTab({ url: '/pages/monitor/index' });
  };

  const handleUnbind = () => {
    Taro.showModal({
      title: '确认解绑',
      content: '解绑后将停止监控当前车辆，确定要解绑吗？',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          unbindVehicle();
          setPlateNumber('');
          setCargoTypeIndex(null);
          setTempZoneIndex(null);
          setArrivalTime('');
          console.log('[BindPage] 车辆解绑');
          Taro.showToast({ title: '已解绑', icon: 'success' });
        }
      }
    });
  };

  const today = dayjs().format('YYYY-MM-DD');
  const maxDate = dayjs().add(7, 'day').format('YYYY-MM-DD');

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>车辆绑定</Text>
        <Text className={styles.subtitle}>录入车辆信息，开启夜间守护</Text>
      </View>

      {!isBound ? (
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.label}>
              车牌号码<Text className={styles.required}>*</Text>
            </Text>
            <Input
              className={styles.input}
              placeholder="请输入车牌号，如：京A12345"
              placeholderStyle="color: #546E7A"
              value={plateNumber}
              onInput={(e) => setPlateNumber(e.detail.value)}
              maxlength={10}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              货品类型<Text className={styles.required}>*</Text>
            </Text>
            <Picker
              mode="selector"
              range={CARGO_TYPES}
              value={cargoTypeIndex ?? 0}
              onChange={(e) => setCargoTypeIndex(Number(e.detail.value))}
            >
              <View className={styles.picker}>
                <Text
                  className={
                    cargoTypeIndex !== null ? styles.pickerText : styles.pickerPlaceholder
                  }
                >
                  {cargoTypeIndex !== null ? CARGO_TYPES[cargoTypeIndex] : '请选择货品类型'}
                </Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              装车温区<Text className={styles.required}>*</Text>
            </Text>
            <Picker
              mode="selector"
              range={TEMPERATURE_ZONES}
              value={tempZoneIndex ?? 0}
              onChange={(e) => setTempZoneIndex(Number(e.detail.value))}
            >
              <View className={styles.picker}>
                <Text
                  className={
                    tempZoneIndex !== null ? styles.pickerText : styles.pickerPlaceholder
                  }
                >
                  {tempZoneIndex !== null ? TEMPERATURE_ZONES[tempZoneIndex] : '请选择装车温区'}
                </Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              预计到站时间<Text className={styles.required}>*</Text>
            </Text>
            <Picker
              mode="multiSelector"
              range={[
                Array.from({ length: 8 }, (_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD')),
                Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
              ]}
              onChange={(e) => {
                const [dayIdx, hourIdx] = e.detail.value as number[];
                const day = dayjs().add(dayIdx, 'day').format('YYYY-MM-DD');
                const hour = hourIdx.toString().padStart(2, '0');
                setArrivalTime(`${day} ${hour}:00`);
              }}
            >
              <View className={styles.picker}>
                <Text className={arrivalTime ? styles.pickerText : styles.pickerPlaceholder}>
                  {arrivalTime || '请选择预计到站时间'}
                </Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </Picker>
          </View>
        </View>
      ) : (
        <View className={styles.boundCard}>
          <View className={styles.boundHeader}>
            <View className={styles.boundIcon}>
              <Text className={styles.boundIconText}>✓</Text>
            </View>
            <Text className={styles.boundTitle}>已绑定车辆</Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>车牌号码</Text>
            <Text className={styles.infoValue}>{vehicleInfo?.plateNumber}</Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>货品类型</Text>
            <Text className={styles.infoValue}>{vehicleInfo?.cargoType}</Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>装车温区</Text>
            <Text className={styles.infoValue}>{vehicleInfo?.temperatureZone}</Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计到站</Text>
            <Text className={styles.infoValue}>{vehicleInfo?.estimatedArrival}</Text>
          </View>

          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>绑定时间</Text>
            <Text className={styles.infoValue}>
              {vehicleInfo?.bindTime ? dayjs(vehicleInfo.bindTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        {!isBound ? (
          <Button className={styles.submitBtn} onClick={handleSubmit}>
            确认绑定
          </Button>
        ) : (
          <Button className={styles.unbindBtn} onClick={handleUnbind}>
            解绑车辆
          </Button>
        )}
      </View>
    </View>
  );
};

export default BindPage;

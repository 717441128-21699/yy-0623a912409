import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { VehicleInfo, AlertRecord, MonitorStatus, FeedbackRecord, PowerStatus, AlertType } from '@/types';
import { ALERT_TYPE_MAP } from '@/types';

const STORAGE_KEYS = {
  VEHICLE_INFO: 'nightguard_vehicle_info',
  MONITOR_STATUS: 'nightguard_monitor_status',
  ALERTS: 'nightguard_alerts',
  FEEDBACK_RECORDS: 'nightguard_feedback_records',
  IS_BOUND: 'nightguard_is_bound'
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      console.log(`[VehicleStore] 从本地存储加载 ${key}`);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`[VehicleStore] 加载 ${key} 失败`, error);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
    console.log(`[VehicleStore] 保存到本地存储 ${key}`);
  } catch (error) {
    console.error(`[VehicleStore] 保存 ${key} 失败`, error);
  }
};

const removeFromStorage = (key: string): void => {
  try {
    Taro.removeStorageSync(key);
    console.log(`[VehicleStore] 从本地存储删除 ${key}`);
  } catch (error) {
    console.error(`[VehicleStore] 删除 ${key} 失败`, error);
  }
};

interface VehicleState {
  vehicleInfo: VehicleInfo | null;
  monitorStatus: MonitorStatus | null;
  alerts: AlertRecord[];
  feedbackRecords: FeedbackRecord[];
  isBound: boolean;
  currentAlert: AlertRecord | null;
  isInitialized: boolean;

  initFromStorage: () => void;
  bindVehicle: (info: Omit<VehicleInfo, 'bindTime'>) => void;
  unbindVehicle: () => void;
  updateMonitorStatus: (status: MonitorStatus) => void;
  checkAndTriggerAlerts: (status: MonitorStatus) => void;
  triggerAlert: (type: AlertType, temperature?: number) => AlertRecord;
  dismissAlert: (alertId: string) => void;
  submitFeedback: (alertId: string, feedback: Omit<FeedbackRecord, 'alertId' | 'timestamp'>) => FeedbackRecord;
  simulateAlert: () => AlertRecord;
  clearCurrentAlert: () => void;
  getAlertById: (alertId: string) => AlertRecord | undefined;
  getFeedbackByAlertId: (alertId: string) => FeedbackRecord | undefined;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialMonitorStatus: MonitorStatus = {
  powerStatus: 'normal',
  powerStatusText: '供电正常',
  currentTemperature: -18,
  targetTemperature: -18,
  lastReportTime: new Date().toISOString(),
  compressorStatus: 'running',
  voltage: 24.5
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicleInfo: null,
  monitorStatus: null,
  alerts: [],
  feedbackRecords: [],
  isBound: false,
  currentAlert: null,
  isInitialized: false,

  initFromStorage: () => {
    const { isInitialized } = get();
    if (isInitialized) {
      console.log('[VehicleStore] 已初始化，跳过');
      return;
    }

    console.log('[VehicleStore] 从本地存储初始化数据...');
    
    const vehicleInfo = loadFromStorage<VehicleInfo | null>(STORAGE_KEYS.VEHICLE_INFO, null);
    const monitorStatus = loadFromStorage<MonitorStatus | null>(STORAGE_KEYS.MONITOR_STATUS, null);
    const alerts = loadFromStorage<AlertRecord[]>(STORAGE_KEYS.ALERTS, []);
    const feedbackRecords = loadFromStorage<FeedbackRecord[]>(STORAGE_KEYS.FEEDBACK_RECORDS, []);
    const isBound = loadFromStorage<boolean>(STORAGE_KEYS.IS_BOUND, false);

    const pendingAlert = alerts.find(a => a.status === 'pending');

    set({
      vehicleInfo,
      monitorStatus,
      alerts,
      feedbackRecords,
      isBound,
      currentAlert: pendingAlert || null,
      isInitialized: true
    });

    console.log('[VehicleStore] 初始化完成', {
      isBound,
      alertsCount: alerts.length,
      feedbackCount: feedbackRecords.length,
      hasPendingAlert: !!pendingAlert
    });
  },

  bindVehicle: (info) => {
    const bindTime = new Date().toISOString();
    const vehicleInfo = { ...info, bindTime };
    const monitorStatus = {
      ...initialMonitorStatus,
      lastReportTime: new Date().toISOString()
    };

    set({
      vehicleInfo,
      isBound: true,
      monitorStatus
    });

    saveToStorage(STORAGE_KEYS.VEHICLE_INFO, vehicleInfo);
    saveToStorage(STORAGE_KEYS.IS_BOUND, true);
    saveToStorage(STORAGE_KEYS.MONITOR_STATUS, monitorStatus);

    console.log('[VehicleStore] 车辆绑定成功', info.plateNumber);
  },

  unbindVehicle: () => {
    set({
      vehicleInfo: null,
      isBound: false,
      monitorStatus: null,
      currentAlert: null
    });

    removeFromStorage(STORAGE_KEYS.VEHICLE_INFO);
    removeFromStorage(STORAGE_KEYS.IS_BOUND);
    removeFromStorage(STORAGE_KEYS.MONITOR_STATUS);

    console.log('[VehicleStore] 车辆解绑');
  },

  updateMonitorStatus: (status) => {
    const { isBound, monitorStatus: prevMonitorStatus } = get();
    if (!isBound) {
      console.log('[VehicleStore] 未绑定车辆，忽略状态更新');
      return;
    }

    const prevTemperature = prevMonitorStatus?.currentTemperature ?? status.currentTemperature;

    set({ monitorStatus: status });
    saveToStorage(STORAGE_KEYS.MONITOR_STATUS, status);

    get().checkAndTriggerAlerts(status, prevTemperature);

    console.log('[VehicleStore] 监控状态更新', {
      powerStatus: status.powerStatus,
      temperature: status.currentTemperature,
      prevTemperature,
      compressor: status.compressorStatus
    });
  },

  checkAndTriggerAlerts: (status: MonitorStatus, prevTemperature?: number) => {
    const { isBound, currentAlert } = get();
    if (!isBound) return;

    if (currentAlert && currentAlert.status === 'pending') {
      console.log('[VehicleStore] 已有待处理告警，跳过自动检测');
      return;
    }

    const prevTemp = prevTemperature ?? status.currentTemperature;
    const tempRise = status.currentTemperature - prevTemp;
    const tempFromTarget = status.currentTemperature - status.targetTemperature;

    if (status.powerStatus === 'danger' || status.voltage < 20) {
      console.log('[VehicleStore] 检测到主电断开，自动触发告警');
      get().triggerAlert('power_disconnect');
      return;
    }

    if (status.compressorStatus === 'stopped') {
      console.log('[VehicleStore] 检测到冷机停机，自动触发告警');
      get().triggerAlert('compressor_stop');
      return;
    }

    if (tempRise > 1 || tempFromTarget > 3) {
      console.log('[VehicleStore] 检测到温度明显回升，自动触发告警', {
        current: status.currentTemperature,
        target: status.targetTemperature,
        rise: tempRise,
        fromTarget: tempFromTarget
      });
      get().triggerAlert('temperature_rise', status.currentTemperature);
      return;
    }

    console.log('[VehicleStore] 状态正常，无需告警');
  },

  triggerAlert: (type, temperature) => {
    const { vehicleInfo, alerts } = get();
    if (!vehicleInfo) {
      throw new Error('未绑定车辆');
    }

    const alertInfo = ALERT_TYPE_MAP[type];
    const alert: AlertRecord = {
      id: generateId(),
      type,
      title: alertInfo.title,
      description: alertInfo.description,
      timestamp: new Date().toISOString(),
      status: 'pending',
      temperature,
      vehicleInfo
    };

    const newAlerts = [alert, ...alerts];

    set((state) => ({
      alerts: newAlerts,
      currentAlert: alert,
      monitorStatus: {
        ...state.monitorStatus!,
        powerStatus: 'danger' as PowerStatus,
        powerStatusText: '告警中'
      }
    }));

    saveToStorage(STORAGE_KEYS.ALERTS, newAlerts);
    saveToStorage(STORAGE_KEYS.MONITOR_STATUS, {
      ...get().monitorStatus!,
      powerStatus: 'danger',
      powerStatusText: '告警中'
    });

    console.log('[VehicleStore] 触发告警', alert.title, alert.id);
    return alert;
  },

  dismissAlert: (alertId) => {
    const { alerts, monitorStatus } = get();

    const newAlerts = alerts.map((a) =>
      a.id === alertId ? { ...a, status: 'handled' } : a
    );

    const newMonitorStatus: MonitorStatus = {
      ...monitorStatus!,
      powerStatus: 'normal' as PowerStatus,
      powerStatusText: '供电正常'
    };

    set({
      alerts: newAlerts,
      currentAlert: null,
      monitorStatus: newMonitorStatus
    });

    saveToStorage(STORAGE_KEYS.ALERTS, newAlerts);
    saveToStorage(STORAGE_KEYS.MONITOR_STATUS, newMonitorStatus);

    console.log('[VehicleStore] 告警已处理', alertId);
  },

  submitFeedback: (alertId, feedback) => {
    const { feedbackRecords } = get();

    const record: FeedbackRecord = {
      alertId,
      ...feedback,
      timestamp: new Date().toISOString()
    };

    const newFeedbackRecords = [record, ...feedbackRecords];

    set({
      feedbackRecords: newFeedbackRecords
    });

    saveToStorage(STORAGE_KEYS.FEEDBACK_RECORDS, newFeedbackRecords);

    get().dismissAlert(alertId);

    console.log('[VehicleStore] 提交处置回填', alertId, '原因:', feedback.reasonText);
    return record;
  },

  simulateAlert: () => {
    const types: AlertType[] = ['power_disconnect', 'compressor_stop', 'temperature_rise'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const temperature = randomType === 'temperature_rise' ? -5 : undefined;
    
    const alert = get().triggerAlert(randomType, temperature);
    console.log('[VehicleStore] 模拟告警触发', alert.title);
    return alert;
  },

  clearCurrentAlert: () => {
    set({ currentAlert: null });
  },

  getAlertById: (alertId) => {
    const { alerts } = get();
    return alerts.find(a => a.id === alertId);
  },

  getFeedbackByAlertId: (alertId) => {
    const { feedbackRecords } = get();
    return feedbackRecords.find(f => f.alertId === alertId);
  }
}));

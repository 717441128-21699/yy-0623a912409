import { create } from 'zustand';
import type { VehicleInfo, AlertRecord, MonitorStatus, FeedbackRecord, PowerStatus, AlertType } from '@/types';
import { ALERT_TYPE_MAP } from '@/types';

interface VehicleState {
  vehicleInfo: VehicleInfo | null;
  monitorStatus: MonitorStatus | null;
  alerts: AlertRecord[];
  feedbackRecords: FeedbackRecord[];
  isBound: boolean;
  currentAlert: AlertRecord | null;

  bindVehicle: (info: Omit<VehicleInfo, 'bindTime'>) => void;
  unbindVehicle: () => void;
  updateMonitorStatus: (status: MonitorStatus) => void;
  triggerAlert: (type: AlertType, temperature?: number) => AlertRecord;
  dismissAlert: (alertId: string) => void;
  submitFeedback: (alertId: string, feedback: Omit<FeedbackRecord, 'alertId' | 'timestamp'>) => void;
  simulateAlert: () => AlertRecord;
  clearCurrentAlert: () => void;
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

  bindVehicle: (info) => {
    const bindTime = new Date().toISOString();
    set({
      vehicleInfo: { ...info, bindTime },
      isBound: true,
      monitorStatus: initialMonitorStatus
    });
    console.log('[VehicleStore] 车辆绑定成功', info.plateNumber);
  },

  unbindVehicle: () => {
    set({
      vehicleInfo: null,
      isBound: false,
      monitorStatus: null,
      currentAlert: null
    });
    console.log('[VehicleStore] 车辆解绑');
  },

  updateMonitorStatus: (status) => {
    set({ monitorStatus: status });
    console.log('[VehicleStore] 监控状态更新', status.powerStatus);
  },

  triggerAlert: (type, temperature) => {
    const { vehicleInfo } = get();
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

    set((state) => ({
      alerts: [alert, ...state.alerts],
      currentAlert: alert,
      monitorStatus: {
        ...state.monitorStatus!,
        powerStatus: 'danger' as PowerStatus,
        powerStatusText: '告警中'
      }
    }));

    console.log('[VehicleStore] 触发告警', alert.title);
    return alert;
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'handled' } : a
      ),
      currentAlert: null,
      monitorStatus: {
        ...state.monitorStatus!,
        powerStatus: 'normal' as PowerStatus,
        powerStatusText: '供电正常'
      }
    }));
    console.log('[VehicleStore] 告警已处理', alertId);
  },

  submitFeedback: (alertId, feedback) => {
    const record: FeedbackRecord = {
      alertId,
      ...feedback,
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      feedbackRecords: [record, ...state.feedbackRecords]
    }));

    get().dismissAlert(alertId);
    console.log('[VehicleStore] 提交处置回填', alertId);
  },

  simulateAlert: () => {
    const types: AlertType[] = ['power_disconnect', 'compressor_stop', 'temperature_rise'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const temperature = randomType === 'temperature_rise' ? -5 : undefined;
    return get().triggerAlert(randomType, temperature);
  },

  clearCurrentAlert: () => {
    set({ currentAlert: null });
  }
}));

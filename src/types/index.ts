export interface VehicleInfo {
  plateNumber: string;
  cargoType: string;
  temperatureZone: string;
  estimatedArrival: string;
  bindTime: string;
}

export type PowerStatus = 'normal' | 'warning' | 'danger' | 'offline';

export type AlertType = 'power_disconnect' | 'compressor_stop' | 'temperature_rise';

export interface AlertRecord {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'handled';
  temperature?: number;
  vehicleInfo: VehicleInfo;
}

export type FeedbackReason = 'power_unplug' | 'fuse_trip' | 'compressor_fault' | 'other';

export interface FeedbackRecord {
  alertId: string;
  reason: FeedbackReason;
  reasonText: string;
  photos: string[];
  remark: string;
  timestamp: string;
}

export interface MonitorStatus {
  powerStatus: PowerStatus;
  powerStatusText: string;
  currentTemperature: number;
  targetTemperature: number;
  lastReportTime: string;
  compressorStatus: 'running' | 'stopped';
  voltage: number;
}

export const CARGO_TYPES = [
  '冷冻肉类',
  '速冻食品',
  '海鲜水产',
  '新鲜果蔬',
  '医药冷链',
  '乳制品',
  '其他'
];

export const TEMPERATURE_ZONES = [
  '冷冻区 (-18℃以下)',
  '冷藏区 (0~8℃)',
  '恒温区 (15~25℃)',
  '深冻区 (-25℃以下)'
];

export const ALERT_TYPE_MAP: Record<AlertType, { title: string; description: string }> = {
  power_disconnect: {
    title: '主电断开告警',
    description: '检测到冷藏机组主电源已断开，请立即检查！'
  },
  compressor_stop: {
    title: '冷机停机告警',
    description: '检测到制冷压缩机已停止运行，请立即处理！'
  },
  temperature_rise: {
    title: '温度回升告警',
    description: '检测到货厢温度开始回升，超出安全范围！'
  }
};

export const REASON_MAP: Record<FeedbackReason, string> = {
  power_unplug: '停车拔电',
  fuse_trip: '保险丝跳闸',
  compressor_fault: '冷机故障',
  other: '其他原因'
};

export const STEP_GUIDANCE = [
  {
    step: 1,
    title: '检查插头',
    description: '下车检查冷藏机组电源插头是否松动或脱落，重新插紧并确认锁扣到位'
  },
  {
    step: 2,
    title: '启动车载电源',
    description: '如主电源异常，请切换至车载备用电源，启动独立制冷机组'
  },
  {
    step: 3,
    title: '联系调度',
    description: '如无法恢复供电，立即拨打调度电话：138-0000-0000，报备情况并等待指示'
  }
];

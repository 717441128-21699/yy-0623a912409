import type { AlertRecord, FeedbackRecord } from '@/types';

const mockVehicle = {
  plateNumber: '京A12345',
  cargoType: '冷冻肉类',
  temperatureZone: '冷冻区 (-18℃以下)',
  estimatedArrival: '2026-06-22 08:00',
  bindTime: '2026-06-21 22:30:00'
};

export const mockAlerts: AlertRecord[] = [
  {
    id: 'alert001',
    type: 'power_disconnect',
    title: '主电断开告警',
    description: '检测到冷藏机组主电源已断开，请立即检查！',
    timestamp: '2026-06-21T02:15:00.000Z',
    status: 'handled',
    vehicleInfo: mockVehicle
  },
  {
    id: 'alert002',
    type: 'temperature_rise',
    title: '温度回升告警',
    description: '检测到货厢温度开始回升，超出安全范围！',
    timestamp: '2026-06-20T23:45:00.000Z',
    status: 'handled',
    temperature: -12,
    vehicleInfo: mockVehicle
  },
  {
    id: 'alert003',
    type: 'compressor_stop',
    title: '冷机停机告警',
    description: '检测到制冷压缩机已停止运行，请立即处理！',
    timestamp: '2026-06-20T18:20:00.000Z',
    status: 'handled',
    vehicleInfo: mockVehicle
  },
  {
    id: 'alert004',
    type: 'power_disconnect',
    title: '主电断开告警',
    description: '检测到冷藏机组主电源已断开，请立即检查！',
    timestamp: '2026-06-19T03:10:00.000Z',
    status: 'handled',
    vehicleInfo: {
      ...mockVehicle,
      plateNumber: '沪B67890',
      cargoType: '海鲜水产'
    }
  },
  {
    id: 'alert005',
    type: 'temperature_rise',
    title: '温度回升告警',
    description: '检测到货厢温度开始回升，超出安全范围！',
    timestamp: '2026-06-18T01:30:00.000Z',
    status: 'handled',
    temperature: -8,
    vehicleInfo: mockVehicle
  }
];

export const mockFeedbacks: FeedbackRecord[] = [
  {
    alertId: 'alert001',
    reason: 'fuse_trip',
    reasonText: '保险丝跳闸',
    photos: [
      'https://picsum.photos/id/160/600/400',
      'https://picsum.photos/id/201/600/400'
    ],
    remark: '服务区停车休息时保险丝跳闸，已重新合闸恢复供电',
    timestamp: '2026-06-21T02:25:00.000Z'
  },
  {
    alertId: 'alert002',
    reason: 'power_unplug',
    reasonText: '停车拔电',
    photos: [
      'https://picsum.photos/id/3/600/400'
    ],
    remark: '临时停车检查时误碰电源插头，已重新插紧',
    timestamp: '2026-06-20T23:55:00.000Z'
  },
  {
    alertId: 'alert003',
    reason: 'compressor_fault',
    reasonText: '冷机故障',
    photos: [
      'https://picsum.photos/id/6/600/400',
      'https://picsum.photos/id/8/600/400'
    ],
    remark: '压缩机皮带断裂，已联系维修人员更换',
    timestamp: '2026-06-20T18:45:00.000Z'
  }
];

export const generateTemperatureHistory = () => {
  const data = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const baseTemp = -18;
    const variance = Math.sin(i / 4) * 2 + (Math.random() - 0.5) * 2;
    data.push({
      time: new Date(now - i * 3600000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      temperature: Math.round((baseTemp + variance) * 10) / 10
    });
  }
  return data;
};

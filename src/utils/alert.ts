import Taro from '@tarojs/taro';

export const triggerVibration = () => {
  try {
    Taro.vibrateLong({
      success: () => console.log('[AlertUtil] 震动触发成功'),
      fail: (err) => console.error('[AlertUtil] 震动触发失败', err)
    });
  } catch (error) {
    console.error('[AlertUtil] 震动调用异常', error);
  }
};

export const speakAlert = (text: string) => {
  try {
    const plugin = Taro.requirePlugin('WechatSI');
    if (plugin && plugin.getRecordRecognitionManager) {
      const innerAudioContext = Taro.createInnerAudioContext();
      plugin.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: text,
        success: (res: any) => {
          console.log('[AlertUtil] 语音合成成功', res);
          if (res.filename) {
            innerAudioContext.src = res.filename;
            innerAudioContext.play();
          }
        },
        fail: (err: any) => {
          console.error('[AlertUtil] 语音合成失败', err);
          Taro.showToast({ title: '请开启语音提醒', icon: 'none' });
        }
      });
    } else {
      console.log('[AlertUtil] 语音插件不可用，使用系统提示');
      Taro.showToast({ title: text, icon: 'none', duration: 3000 });
    }
  } catch (error) {
    console.error('[AlertUtil] 语音播报异常', error);
    Taro.showToast({ title: text, icon: 'none', duration: 3000 });
  }
};

export const triggerFullAlert = (title: string, description: string) => {
  console.log('[AlertUtil] 触发全量告警', title);
  
  triggerVibration();
  
  setTimeout(() => {
    speakAlert(`警告！${title}。${description}`);
  }, 500);
  
  Taro.showModal({
    title: '⚠️ ' + title,
    content: description + '\n\n请立即按照以下步骤处理：\n1. 检查插头\n2. 启动车载电源\n3. 联系调度',
    showCancel: false,
    confirmText: '我知道了',
    confirmColor: '#E53935'
  });
};

export const stopAlert = () => {
  try {
    Taro.vibrateShort({});
    console.log('[AlertUtil] 告警停止');
  } catch (error) {
    console.error('[AlertUtil] 停止告警异常', error);
  }
};

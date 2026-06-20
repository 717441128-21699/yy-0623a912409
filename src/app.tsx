import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useVehicleStore } from './store/vehicleStore';

function App(props) {
  const initFromStorage = useVehicleStore(state => state.initFromStorage);
  const isInitialized = useVehicleStore(state => state.isInitialized);

  useEffect(() => {
    console.log('[App] 应用启动，初始化数据...');
    initFromStorage();
  }, [initFromStorage]);

  useDidShow(() => {
    console.log('[App] 应用显示');
    if (!isInitialized) {
      initFromStorage();
    }
  });

  useDidHide(() => {
    console.log('[App] 应用隐藏');
  });

  return props.children;
}

export default App;

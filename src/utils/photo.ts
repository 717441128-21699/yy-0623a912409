import Taro from '@tarojs/taro';

const STORAGE_KEY = 'nightguard_saved_photos';

interface SavedPhoto {
  tempPath: string;
  savedPath: string;
  savedAt: string;
}

const loadSavedPhotos = (): Record<string, SavedPhoto> => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[PhotoUtil] 加载保存的照片映射失败', error);
  }
  return {};
};

const savePhotoMap = (map: Record<string, SavedPhoto>) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.error('[PhotoUtil] 保存照片映射失败', error);
  }
};

export const savePhotoToPermanentPath = async (tempPath: string): Promise<string> => {
  const savedPhotos = loadSavedPhotos();
  
  if (savedPhotos[tempPath]) {
    console.log('[PhotoUtil] 照片已保存过，使用已保存的路径:', savedPhotos[tempPath].savedPath);
    return savedPhotos[tempPath].savedPath;
  }

  try {
    if (process.env.TARO_ENV === 'h5') {
      console.log('[PhotoUtil] H5环境，直接使用临时路径');
      const savedPath = tempPath;
      savedPhotos[tempPath] = {
        tempPath,
        savedPath,
        savedAt: new Date().toISOString()
      };
      savePhotoMap(savedPhotos);
      return savedPath;
    }

    console.log('[PhotoUtil] 保存照片到持久化路径:', tempPath);
    
    const result = await Taro.saveFile({
      tempFilePath: tempPath
    });

    const savedPath = result.savedFilePath;
    console.log('[PhotoUtil] 照片保存成功:', savedPath);

    savedPhotos[tempPath] = {
      tempPath,
      savedPath,
      savedAt: new Date().toISOString()
    };
    savePhotoMap(savedPhotos);

    return savedPath;
  } catch (error) {
    console.error('[PhotoUtil] 保存照片失败:', error);
    
    try {
      const fs = Taro.getFileSystemManager();
      const savedPath = `${Taro.env.USER_DATA_PATH}/photo_${Date.now()}.jpg`;
      
      await new Promise<void>((resolve, reject) => {
        fs.saveFile({
          tempFilePath: tempPath,
          filePath: savedPath,
          success: () => resolve(),
          fail: reject
        });
      });

      console.log('[PhotoUtil] 使用FileSystemManager保存成功:', savedPath);
      
      savedPhotos[tempPath] = {
        tempPath,
        savedPath,
        savedAt: new Date().toISOString()
      };
      savePhotoMap(savedPhotos);

      return savedPath;
    } catch (fsError) {
      console.error('[PhotoUtil] FileSystemManager保存也失败，返回原路径:', fsError);
      return tempPath;
    }
  }
};

export const saveAllPhotos = async (tempPaths: string[]): Promise<string[]> => {
  console.log('[PhotoUtil] 批量保存照片:', tempPaths.length, '张');
  const savedPaths = await Promise.all(
    tempPaths.map(path => savePhotoToPermanentPath(path))
  );
  console.log('[PhotoUtil] 批量保存完成:', savedPaths);
  return savedPaths;
};

export const getPermanentPath = (path: string): string => {
  if (!path) return path;
  
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }

  const savedPhotos = loadSavedPhotos();
  
  if (savedPhotos[path]) {
    return savedPhotos[path].savedPath;
  }

  for (const key in savedPhotos) {
    if (savedPhotos[key].savedPath === path) {
      return path;
    }
    if (savedPhotos[key].tempPath === path) {
      return savedPhotos[key].savedPath;
    }
  }

  console.log('[PhotoUtil] 未找到持久化路径，返回原路径:', path);
  return path;
};

export const getPhotoPath = (path: string): string => {
  return getPermanentPath(path);
};

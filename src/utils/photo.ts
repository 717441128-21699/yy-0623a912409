import Taro from '@tarojs/taro';

const PHOTO_DATA_KEY = 'nightguard_photo_data';
const PHOTO_INDEX_KEY = 'nightguard_photo_index';

interface PhotoIndexItem {
  photoId: string;
  storedAt: string;
  size?: number;
}

const loadPhotoIndex = (): Record<string, PhotoIndexItem> => {
  try {
    const data = Taro.getStorageSync(PHOTO_INDEX_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[PhotoUtil] 加载照片索引失败', error);
  }
  return {};
};

const savePhotoIndex = (index: Record<string, PhotoIndexItem>) => {
  try {
    Taro.setStorageSync(PHOTO_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('[PhotoUtil] 保存照片索引失败', error);
  }
};

const generatePhotoId = (): string => {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const fetchImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
};

const savePhotoData = (photoId: string, base64Data: string): void => {
  const storageKey = `${PHOTO_DATA_KEY}_${photoId}`;
  try {
    Taro.setStorageSync(storageKey, base64Data);
  } catch (error) {
    console.error('[PhotoUtil] 保存照片数据失败', error);
    throw error;
  }
};

const getPhotoData = (photoId: string): string | null => {
  const storageKey = `${PHOTO_DATA_KEY}_${photoId}`;
  try {
    const data = Taro.getStorageSync(storageKey);
    if (data) {
      return data;
    }
  } catch (error) {
    console.error('[PhotoUtil] 读取照片数据失败', error);
  }
  return null;
};

export const savePhotoToPermanentPath = async (tempPath: string): Promise<string> => {
  console.log('[PhotoUtil] 开始保存照片:', tempPath);
  
  const photoIndex = loadPhotoIndex();
  
  if (photoIndex[tempPath]) {
    console.log('[PhotoUtil] 照片已保存过，使用已保存的ID:', photoIndex[tempPath].photoId);
    return photoIndex[tempPath].photoId;
  }

  for (const key in photoIndex) {
    if (key === tempPath || photoIndex[key].photoId === tempPath) {
      console.log('[PhotoUtil] 找到已存在的照片记录:', photoIndex[key].photoId);
      return photoIndex[key].photoId;
    }
  }

  const photoId = generatePhotoId();

  try {
    if (process.env.TARO_ENV === 'h5') {
      console.log('[PhotoUtil] H5环境，转换为Base64保存');
      
      let base64Data: string;
      
      if (tempPath.startsWith('data:')) {
        base64Data = tempPath;
      } else if (tempPath.startsWith('blob:')) {
        base64Data = await fetchImageAsBase64(tempPath);
      } else {
        try {
          base64Data = await fetchImageAsBase64(tempPath);
        } catch {
          base64Data = tempPath;
        }
      }
      
      savePhotoData(photoId, base64Data);
      
      photoIndex[tempPath] = {
        photoId,
        storedAt: new Date().toISOString(),
        size: base64Data.length
      };
      photoIndex[photoId] = {
        photoId,
        storedAt: new Date().toISOString(),
        size: base64Data.length
      };
      savePhotoIndex(photoIndex);
      
      console.log('[PhotoUtil] H5照片保存成功，ID:', photoId, '大小:', base64Data.length);
      return photoId;
    }

    console.log('[PhotoUtil] 小程序环境，使用saveFile保存');
    
    try {
      const result = await Taro.saveFile({
        tempFilePath: tempPath
      });
      
      const savedPath = result.savedFilePath;
      console.log('[PhotoUtil] 小程序照片保存成功:', savedPath);
      
      photoIndex[tempPath] = {
        photoId: savedPath,
        storedAt: new Date().toISOString()
      };
      photoIndex[savedPath] = {
        photoId: savedPath,
        storedAt: new Date().toISOString()
      };
      savePhotoIndex(photoIndex);
      
      return savedPath;
    } catch (saveError) {
      console.warn('[PhotoUtil] Taro.saveFile失败，尝试FileSystemManager:', saveError);
      
      try {
        const fs = Taro.getFileSystemManager();
        const savedPath = `${Taro.env.USER_DATA_PATH}/${photoId}.jpg`;
        
        await new Promise<void>((resolve, reject) => {
          fs.saveFile({
            tempFilePath: tempPath,
            filePath: savedPath,
            success: () => resolve(),
            fail: reject
          });
        });

        console.log('[PhotoUtil] FileSystemManager保存成功:', savedPath);
        
        photoIndex[tempPath] = {
          photoId: savedPath,
          storedAt: new Date().toISOString()
        };
        photoIndex[savedPath] = {
          photoId: savedPath,
          storedAt: new Date().toISOString()
        };
        savePhotoIndex(photoIndex);

        return savedPath;
      } catch (fsError) {
        console.error('[PhotoUtil] 所有保存方式都失败，返回原路径:', fsError);
        return tempPath;
      }
    }
  } catch (error) {
    console.error('[PhotoUtil] 保存照片异常:', error);
    return tempPath;
  }
};

export const saveAllPhotos = async (tempPaths: string[]): Promise<string[]> => {
  console.log('[PhotoUtil] 批量保存照片:', tempPaths.length, '张');
  const results: string[] = [];
  
  for (let i = 0; i < tempPaths.length; i++) {
    try {
      const savedPath = await savePhotoToPermanentPath(tempPaths[i]);
      results.push(savedPath);
    } catch (error) {
      console.error('[PhotoUtil] 保存第', i, '张照片失败:', error);
      results.push(tempPaths[i]);
    }
  }
  
  console.log('[PhotoUtil] 批量保存完成:', results);
  return results;
};

export const getPermanentPath = (path: string): string => {
  if (!path) return path;
  
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  if (path.startsWith('wxfile:') || path.startsWith('file://') || path.includes('/userdata/')) {
    return path;
  }

  const base64Data = getPhotoData(path);
  if (base64Data) {
    return base64Data;
  }

  const photoIndex = loadPhotoIndex();
  
  if (photoIndex[path]) {
    const resolvedPath = photoIndex[path].photoId;
    if (resolvedPath.startsWith('wxfile:') || resolvedPath.startsWith('file://') || resolvedPath.startsWith('data:')) {
      return resolvedPath;
    }
    const nestedBase64 = getPhotoData(resolvedPath);
    if (nestedBase64) {
      return nestedBase64;
    }
    return resolvedPath;
  }

  for (const key in photoIndex) {
    if (photoIndex[key].photoId === path) {
      if (path.startsWith('wxfile:') || path.startsWith('file://')) {
        return path;
      }
      const base64ByPath = getPhotoData(path);
      if (base64ByPath) {
        return base64ByPath;
      }
    }
  }

  console.log('[PhotoUtil] 未找到照片路径映射，返回原路径:', path);
  return path;
};

export const getPhotoPath = (path: string): string => {
  return getPermanentPath(path);
};

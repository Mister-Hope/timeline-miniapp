import { error, info, warn } from "./log";

/**
 * 显示提示文字
 *
 * @param text 提示文字
 * @param duration 提示持续时间，单位 ms，默认为 `1500`
 * @param icon 提示图标，默认为 `'none'`
 */
export const tip = (
  text: string,
  duration = 1500,
  icon: "success" | "loading" | "none" = "none"
): void => {
  wx.showToast({ icon, title: text, duration });
};

/**
 * 显示提示窗口
 *
 * @param title 提示文字
 * @param content 提示文字
 * @param confirmFunc 点击确定的回调函数
 * @param cancelFunc 点击取消的回调函数，不填则不显示取消按钮
 */
export const modal = (
  title: string,
  content: string,
  confirmFunc?: () => void,
  cancelFunc?: () => void
): void => {
  /** 显示取消按钮 */
  const showCancel = Boolean(cancelFunc);

  wx.showModal({
    title,
    content,
    showCancel,
    success: (res) => {
      if (res.confirm && confirmFunc) confirmFunc();
      else if (res.cancel && cancelFunc) cancelFunc();
    },
  });
};

/**
 * 确认操作
 *
 * @param actionText 行为文字
 * @param confirmFunc 确定回调函数
 * @param cancelFunc 取消回调函数
 */
export const confirm = (
  actionText: string,
  confirmFunc: () => void,
  cancelFunc: () => void = (): void => void 0
): void => {
  modal("确认操作", `您确定要${actionText}么?`, confirmFunc, cancelFunc);
};

/** 网络状态汇报 */
export const netReport = (): void => {
  // 获取网络信息
  wx.getNetworkType({
    success: (res) => {
      const { networkType } = res;

      switch (networkType) {
        case "2g":
        case "3g":
          tip("您的网络状态不佳");
          break;
        case "none":
        case "unknown":
          tip("您没有连接到网络");
          break;
        case "wifi":
          wx.getConnectedWifi({
            success: (info) => {
              if (info.wifi.signalStrength < 0.5)
                tip("Wifi信号不佳，网络链接失败");
            },
            fail: () => {
              tip("无法连接网络");
            },
          });
          break;
        default:
          tip("网络连接出现问题，请稍后重试");
      }

      warn("Request fail with", networkType);
    },
    fail: () => {
      tip("网络连接出现问题，请稍后重试");

      warn("Request fail and cannot get networkType");
    },
  });
};

/**
 * 上传文件到云开发存储
 *
 * @param filePath 本地缓存文件目录
 * @param cloudPath 云文件目录
 */
export const uploadCloudFile = (
  filePath: string,
  cloudPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: ({ fileID }) => {
        info(`${filePath} 成功上传至 ${fileID}`);
        // 返回文件 ID
        resolve(fileID);
      },
      fail: ({ errMsg }) => {
        error(errMsg);
        reject(errMsg);
      },
    });
  });
};

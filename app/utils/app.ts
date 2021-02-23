import { error, info, warn } from "./log";
import { tip } from "./wx";
import { GlobalData } from "../app";
import { message } from "./message";

/**
 * 根据用户设置，判断当前小程序是否应启用夜间模式
 *
 * @returns 夜间模式状态
 */
export const getDarkmode = (
  sysInfo: WechatMiniprogram.SystemInfo = wx.getSystemInfoSync()
): boolean => (sysInfo.AppPlatform ? false : sysInfo.theme === "dark");

interface LoginCloudFunctionResult {
  /** 用户的 openid */
  openid: string;
  /** 用户是否是小程序的所有者 */
  isOwner: boolean;
}

/**
 * 登录
 *
 * @param globalData 全局数据
 */
export const login = (globalData: GlobalData): void => {
  const openid = wx.getStorageSync("openid") as string | undefined;
  const isOwner = wx.getStorageSync("isOwner") as boolean | undefined;

  if (openid && typeof isOwner === "boolean") {
    info(`openid 为 ${openid}，用户${isOwner ? "是" : "不是"}所有者`);
    globalData.openid = openid;
    globalData.isOwner = isOwner;
  } else
    wx.cloud
      .callFunction({
        name: "login",
        data: {},
      })
      .then((res) => {
        const { openid, isOwner } = res.result as LoginCloudFunctionResult;

        info(`openid 为 ${openid}，用户${isOwner ? "是" : "不是"}所有者`);

        wx.setStorageSync("openid", openid);
        wx.setStorageSync("isOwner", isOwner);
        globalData.openid = openid;
        globalData.isOwner = isOwner;

        message.emit("openid", openid);
        message.emit("isOwner", isOwner);
      })
      .catch(error);
};

/** 注册全局监听 */
export const registAction = (): void => {
  // 设置内存不足警告
  wx.onMemoryWarning((res) => {
    tip("内存不足");
    warn("onMemoryWarningReceive");
    wx.reportAnalytics("memory_warning", {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      memory_warning: res && res.level ? res.level : 0,
    });
  });

  // 监听网络状态
  wx.onNetworkStatusChange((res) => {
    // 显示提示
    if (!res.isConnected) {
      tip("网络连接中断,部分小程序功能暂不可用");
      wx.setStorageSync("networkError", true);
    } else if (wx.getStorageSync("network")) {
      wx.setStorageSync("networkError", false);
      tip("网络链接恢复");
    }
  });

  // 监听用户截屏
  if (wx.getStorageSync("capture-screen") !== "never")
    wx.onUserCaptureScreen(() => {
      const status = wx.getStorageSync("capture-screen") as
        | "never"
        | "noticed"
        | undefined;

      if (status !== "never")
        wx.showModal({
          title: "善用小程序分享",
          content:
            "您可以点击右上角选择分享到好友、分享到朋友圈/空间\n您也可以点击页面右下角的分享图标，选择保存二维码分享小程序",
          showCancel: status === "noticed",
          cancelText: "不再提示",
          success: (res) => {
            if (res.confirm) wx.setStorageSync("capture-screen", "noticed");
            else if (res.cancel) {
              wx.setStorageSync("capture-screen", "never");
              if (wx.canIUse("offUserCaptureScreen")) wx.offUserCaptureScreen();
            }
          },
        });
    });
};

/**
 * 小程序启动时的运行函数
 *
 * 负责检查通知与小程序更新，注册网络、内存、截屏的监听
 *
 * @param globalData 小程序的全局数据
 */
export const startup = (globalData: GlobalData): void => {
  // 获取设备与运行环境信息
  globalData.info = wx.getSystemInfoSync();
  globalData.darkmode = getDarkmode(globalData.info);

  // listen theme change
  wx.onThemeChange(({ theme }) => {
    globalData.darkmode = theme === "dark";
  });

  wx.cloud.init({
    traceUser: true,
  });

  // 获取网络信息
  wx.getNetworkType({
    success: (res) => {
      const { networkType } = res;

      info(networkType);

      if (networkType === "none") tip("您没有连接到网络");
    },
  });

  registAction();
  login(globalData);
};

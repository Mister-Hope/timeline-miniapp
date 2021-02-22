import { owner } from "../../config";
import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    owner,
    darkmode: false,
    version: globalData.version,
  },

  onLoad() {
    this.setData({ darkmode: globalData.darkmode });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 返回 */
  back() {
    const firstPage = getCurrentPages().length === 1;

    if (firstPage) wx.reLaunch({ url: "/pages/main/main" });
    else wx.navigateBack();
  },
});

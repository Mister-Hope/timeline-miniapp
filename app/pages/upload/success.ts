Page({
  onLoad(options) {
    if (getCurrentPages().length === 1) this.home();

    this.setData({ type: options.type });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  home() {
    wx.reLaunch({ url: "/pages/main/main" });
  },
});
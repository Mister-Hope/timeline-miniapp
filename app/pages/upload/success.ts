Page({
  onLoad() {
    if (getCurrentPages().length === 1) this.home();
  },

  home() {
    wx.reLaunch({ url: "/pages/main/main" });
  },
});

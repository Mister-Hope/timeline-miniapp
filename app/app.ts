export interface GlobalData {
  /** 用户的 openid */
  openid: string;
}

App({
  globalData: {
    openid: "",
  },

  onLaunch() {
    wx.cloud.init({
      traceUser: true,
    });
  },
});

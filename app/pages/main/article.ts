import type { AppOption } from "../../app";
import type { ArticleInfo } from "../../typings";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    item: {} as ArticleInfo,
  },
  onLoad(options) {
    if (!options.id) wx.reLaunch({ url: "pages/main/main" });

    const item = globalData.items.find(
      (item) => item._id === options.id
    ) as ArticleInfo;

    if (!item) wx.reLaunch({ url: "pages/main/main" });

    // 写入基本信息
    this.setData({
      item,
      info: globalData.info,
      darkmode: globalData.darkmode,
      firstPage: getCurrentPages().length === 1,
    });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: "说说详情",
      path: `/pages/main/music?id=${this.data.item._id}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: "说说详情",
      query: `id=${this.data.item._id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: "说说详情",
      query: `id=${this.data.item._id}`,
    };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },
});

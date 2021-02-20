import type { AppOption } from "../../app";
import type { ArticleInfo } from "../../typings";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    item: {} as ArticleInfo,
    sharedText: "",
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
      shareText:
        item.text.length > 10 ? `${item.text.substring(0, 10)}...` : item.text,
      info: globalData.info,
      darkmode: globalData.darkmode,
      firstPage: getCurrentPages().length === 1,
    });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { item, sharedText } = this.data;

    return {
      title: sharedText,
      path: `/pages/main/article?id=${item._id}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { item, sharedText } = this.data;

    return {
      title: sharedText,
      query: `id=${item._id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { item, sharedText } = this.data;

    return {
      title: sharedText,
      query: `id=${item._id}`,
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

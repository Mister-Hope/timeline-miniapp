import type { AppOption } from "../../app";
import type { ArticleInfo } from "../../typings";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    article: {} as ArticleInfo,
    shareText: "",
  },
  onLoad(options) {
    if (!options.id) wx.reLaunch({ url: "pages/main/main" });

    const article = globalData.timeline.find(
      (item) => item._id === options.id
    ) as ArticleInfo;

    if (article)
      // 写入基本信息
      this.setData({
        article,
        shareText:
          article.text.length > 10
            ? `${article.text.substring(0, 10)}...`
            : article.text,
        info: globalData.info,
        darkmode: globalData.darkmode,
        firstPage: getCurrentPages().length === 1,
      });
    else wx.reLaunch({ url: "pages/main/main" });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { article, shareText } = this.data;

    return {
      title: shareText,
      path: `/pages/detail/article?id=${article._id}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { article, shareText } = this.data;

    return {
      title: shareText,
      query: `id=${article._id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { article, shareText } = this.data;

    return {
      title: shareText,
      query: `id=${article._id}`,
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

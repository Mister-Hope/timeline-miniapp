import type { AppOption } from "../../app";
import { appName } from "../../config";
import type { ItemInfo } from "../../typings";
import { getTimelineItems } from "../../utils/database";
import { error } from "../../utils/log";
import { message } from "../../utils/message";
import { confirm } from "../../utils/wx";

const { globalData } = getApp<AppOption>();

const ITEMS_PER_LOAD = 10;

Page({
  data: {
    appName,

    /** 项目列表 */
    items: [] as ItemInfo[],
    /** 选项菜单 */
    showActionsheet: false,
  },

  state: {
    timeline: [] as ItemInfo[],
  },

  onLoad() {
    // 写入基本信息
    this.setData({
      isOwner: globalData.isOwner,
      darkmode: globalData.darkmode,
      info: globalData.info,
    });

    this.setTimeline(globalData.timeline);
    message.on("items", this.setTimeline);

    if (typeof globalData.isOwner === "boolean")
      this.setOwner(globalData.isOwner);
    else message.on("isOwner", this.setOwner);

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onReachBottom() {
    const { items } = this.data;
    const { timeline } = this.state;
    const end = Math.min(items.length + ITEMS_PER_LOAD, timeline.length);

    this.setData({ items: timeline.slice(0, end) });
  },

  onPullDownRefresh() {
    getTimelineItems().then((timeline) => {
      globalData.timeline = timeline;
      globalData.musicList = timeline.filter((item) => item.type === "music");
      this.setTimeline(timeline);

      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage: () => ({ title: appName, path: "/pages/main/main" }),

  onShareTimeline: () => ({ title: appName }),

  onAddToFavorites: () => ({ title: appName }),

  onUnload() {
    message.off("items", this.setTimeline);

    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeListenerResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 设置时间线内容 */
  setTimeline(timeline: ItemInfo[]) {
    const end = Math.min(ITEMS_PER_LOAD, timeline.length);

    this.state.timeline = timeline;
    this.setData({ items: timeline.slice(0, end) });
  },

  /** 设置是否可以上传 */
  setOwner(isOwner: boolean) {
    this.setData({ isOwner });
  },

  /** 新建内容 */
  new() {
    this.setData({ showActionsheet: true });
  },

  /** 关于 */
  about() {
    wx.navigateTo({ url: `/pages/about/about?type=about` });
  },

  /** 点击选项菜单 */
  actionTap({
    detail,
  }: WechatMiniprogram.Touch<{ value: "article" | "music" }>) {
    this.setData({ showActionsheet: false });
    wx.navigateTo({ url: `/pages/about/about?type=${detail.value}` });
  },

  /** 点击取消项目 */
  actionClose() {
    this.setData({ showActionsheet: false });
  },

  /** 点击滑动按钮 */
  slideButtonTap({
    currentTarget,
    detail,
  }: WechatMiniprogram.Touch<{ data: "delete" }>) {
    if (detail.data === "delete") {
      const item = this.data.items[currentTarget.dataset.index as number];

      // 要求用户确认
      confirm(`删除该${item.type === "article" ? "说说" : "音乐"}`, () => {
        // 删除数据库记录
        wx.cloud
          .database()
          .collection("items")
          .doc(item._id)
          .remove()
          .then(() => {
            // 说说
            if (item.type === "article")
              // 删除文件
              wx.cloud
                .deleteFile({ fileList: item.photos })
                .then(() => wx.startPullDownRefresh())
                .catch(error);
            // 音乐
            else if (item.type === "music")
              wx.cloud
                .deleteFile({
                  fileList: [
                    item.musicID,
                    ...(item.coverID ? [item.coverID] : []),
                  ],
                })
                .then(() => wx.startPullDownRefresh())
                .catch(error);
          })
          .catch(error);
      });
    }
  },
});

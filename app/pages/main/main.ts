import { appName } from "../../config";
import { getTimelineItems } from "../../utils/database";
import { error } from "../../utils/log";
import { message } from "../../utils/message";
import { confirm } from "../../utils/wx";

import type { AppOption } from "../../app";
import type { ItemInfo, MusicInfo } from "../../typings";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    appName,

    /** 项目列表 */
    items: [] as ItemInfo[],
    /** 选项菜单 */
    showActionsheet: false,
  },

  onLoad() {
    // 写入基本信息
    this.setData({
      isOwner: globalData.isOwner,
      darkmode: globalData.darkmode,
      info: globalData.info,
    });

    this.setItems(globalData.timeline);
    message.on("items", this.setItems);

    if (typeof globalData.isOwner === "boolean")
      this.setOwner(globalData.isOwner);
    else message.on("isOwner", this.setOwner);

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onPullDownRefresh() {
    getTimelineItems().then((items) => {
      this.setData({ items });

      globalData.timeline = items;
      globalData.musicList = items.filter(
        (item) => item.type === "music"
      ) as MusicInfo[];

      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage: () => ({ title: appName, path: "/pages/main/main" }),

  onShareTimeline: () => ({ title: appName }),

  onAddToFavorites: () => ({ title: appName }),

  onUnload() {
    message.off("items", this.setItems);

    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 设置时间线内容 */
  setItems(items: ItemInfo[]) {
    this.setData({ items });
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

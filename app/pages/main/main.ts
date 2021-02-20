import { isAdmin } from "../../utils/identify";
import { error } from "../../utils/log";
import { message } from "../../utils/message";
import { confirm } from "../../utils/wx";

import type { AppOption } from "../../app";
import type { ItemInfo, MusicInfo } from "../../typings";

const { getItems, globalData } = getApp<AppOption>();

Page({
  data: {
    /** 项目列表 */
    items: [] as ItemInfo[],

    /** 滑动按钮 */
    slideButtons: [
      // {
      //   text: "重命名",
      //   src: "/icon/rename.svg",
      //   data: "rename",
      // },
      {
        text: "删除",
        src: "/icon/delete.svg",
        data: "delete",
      },
    ],

    /** 夜间滑动按钮 */
    slideDarkButtons: [
      // {
      //   text: "重命名",
      //   src: "/icon/rename-dark.svg",
      //   data: "rename",
      // },
      {
        text: "删除",
        src: "/icon/delete-dark.svg",
        data: "delete",
      },
    ],

    /** 选项菜单 */
    showActionsheet: false,
    /** 操作 */
    actions: [
      { text: "说说/图片", value: "article" },
      { text: "音乐", value: "music" },
    ],
  },

  onLoad() {
    // 写入基本信息
    this.setData({
      isAdmin: isAdmin(globalData.openid),

      darkmode: globalData.darkmode,
      info: globalData.info,
    });

    const setItems = (items: ItemInfo[]): void => {
      // 写入列表
      this.setData({ items });
    };

    if (globalData.items.length) setItems(globalData.items);
    else message.on<[ItemInfo[]]>("items", setItems);

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onPullDownRefresh() {
    getItems().then((items) => {
      this.setData({ items });

      globalData.items = items;
      globalData.musicList = items.filter(
        (item) => item.type === "music"
      ) as MusicInfo[];

      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: "小爽的专属音乐室",
      path: "/pages/main/main",
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return { title: "小爽的专属音乐室" };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return { title: "小爽的专属音乐室" };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 新建内容 */
  new() {
    this.setData({ showActionsheet: true });
  },

  /** 点击选项菜单 */
  actionTap({
    detail,
  }: WechatMiniprogram.Touch<{ value: "article" | "music" | "photo" }>) {
    this.setData({ showActionsheet: false });
    wx.navigateTo({ url: `/pages/upload/${detail.value}` });
  },

  /** 点击取消项目 */
  actionClose() {
    this.setData({ showActionsheet: false });
  },

  /** 点击滑动按钮 */
  slideButtonTap({
    currentTarget,
    detail,
  }: WechatMiniprogram.Touch<{ data: "rename" | "delete" }>) {
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

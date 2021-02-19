import { isAdmin as isAdminFunction } from "../../utils/identify";
import { error, info } from "../../utils/log";
import { modal, uploadCloudFile } from "../../utils/wx";

import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    darkmode: false,

    /** 正文 */
    text: "",
    /** 文字数 */
    textNumber: 0,
    /** 图片 */
    photos: [] as WechatMiniprogram.ImageFile[],
    /** 发布日期 */
    date: "",
  },

  onLoad() {
    const isAdmin = isAdminFunction(globalData.openid);

    if (isAdmin) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const currentDate = `${now.getFullYear()}-${
        month < 10 ? `0${month}` : month
      }-${date < 10 ? `0${date}` : date}`;

      // 写入基本信息
      this.setData({
        date: currentDate,

        isAdmin,

        darkmode: globalData.darkmode,
        // info: globalData.info,
        firstPage: getCurrentPages().length === 1,
      });
    }
    // 用户无权进入此页面
    else wx.reLaunch({ url: "/pages/main/main" });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 配文变更 */
  textChange({ detail }: WechatMiniprogram.TextareaInput) {
    this.setData({
      text: detail.value,
      textNumber: detail.value.length,
    });
  },

  /** 选择配图 */
  choosePhoto() {
    wx.chooseImage({
      success: ({ tempFiles }) => {
        this.setData({ photos: tempFiles });
      },
    });
  },

  /** 日期变更 */
  dateChange({ detail }: WechatMiniprogram.PickerChange) {
    this.setData({ date: detail.value as string });
  },

  /** 上传 */
  upload() {
    const { date, photos, text } = this.data;

    if (!text) modal("无法上传", "您必须输入文字内容");
    else {
      // 进行提示
      wx.showLoading({ title: "上传中" });

      const insertandUpdate = (photos: string[] = []): void => {
        const data = {
          type: "article",
          text,
          date,
          photos,
        };

        this.insetData(data)
          .then((res) => {
            info("插入说说:", res._id);

            wx.hideLoading();
            wx.redirectTo({ url: "/pages/upload/success?type=article" });
          })
          .catch(error);
      };

      if (photos.length)
        // 上传封面
        Promise.all(
          photos.map((photo) =>
            uploadCloudFile(
              photo.path,
              `cover-${globalData.openid}-${new Date().getTime()}`
            )
          )
        ).then((photos) => insertandUpdate(photos));
      // 直接上传
      else insertandUpdate();
    }
  },

  /** 插入数据 */
  insetData: (data: Record<string, unknown>) =>
    wx.cloud.database().collection("items").add({ data }),
});

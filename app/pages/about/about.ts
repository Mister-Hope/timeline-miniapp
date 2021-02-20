import { getCurrentDate } from "../../utils/date";
import { isAdmin as isAdminFunction } from "../../utils/identify";
import { error, info } from "../../utils/log";
import { modal, uploadCloudFile } from "../../utils/wx";

import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    isAdmin: false,
    type: "about",

    /** 文字 */
    text: "",
    /** 文字数 */
    textNumber: 0,
    /** 发布日期 */
    date: "",

    /** 音乐名称 */
    musicName: "",
    /** 音乐 */
    music: {} as WechatMiniprogram.ChooseFile,
    /** 封面 */
    cover: {} as WechatMiniprogram.ImageFile,
    /** 演唱者 */
    singer: "小爽",

    /** 图片 */
    photos: [] as WechatMiniprogram.ImageFile[],

    darkmode: false,
    version: globalData.version,
  },

  onLoad(options) {
    const isAdmin = isAdminFunction(globalData.openid);
    const type = options.type || "about";

    this.setData({
      isAdmin,
      type,

      date: getCurrentDate(),

      darkmode: globalData.darkmode,
      firstPage: getCurrentPages().length === 1,
    });

    // 设置导航栏标题
    if (isAdmin)
      if (type === "article") wx.setNavigationBarTitle({ title: "发表说说" });
      else if (type === "music")
        wx.setNavigationBarTitle({ title: "发表音乐" });

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 文字变更 */
  textChange({ detail }: WechatMiniprogram.TextareaInput) {
    this.setData({
      text: detail.value,
      textNumber: detail.value.length,
    });
  },

  /** 日期变更 */
  dateChange({ detail }: WechatMiniprogram.PickerChange) {
    this.setData({ date: detail.value as string });
  },

  /** 选择音乐 */
  chooseMusic() {
    // 选择文件
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      // 限制选择音乐文件
      extension: ["m4a", "aac", "mp3", "wav"],
    }).then(({ tempFiles }) => {
      const music = tempFiles[0];
      const temp = music.name.split(".");

      temp.pop();
      const musicName = temp.join(".");

      this.setData({
        music: tempFiles[0],
        musicName,
      });
    });
  },

  /** 选择配图 */
  choosePhoto() {
    wx.chooseImage({}).then(({ tempFiles }) => {
      this.setData({ photos: tempFiles });
    });
  },

  /** 音乐名称变更 */
  musicNameChange({ detail }: WechatMiniprogram.Input) {
    this.setData({ musicName: detail.value });
  },

  /** 选择封面 */
  chooseCover() {
    // 限制选择一张照片
    wx.chooseImage({ count: 1 }).then(({ tempFiles }) => {
      this.setData({ cover: tempFiles[0] });
    });
  },

  /** 歌手变更 */
  singerChange({ detail }: WechatMiniprogram.TextareaInput) {
    this.setData({ singer: detail.value });
  },

  /** 重置选择 */
  reset({ currentTarget }: WechatMiniprogram.Touch) {
    const name = currentTarget.dataset.name as string;

    if (name === "photos") this.setData({ photos: [] });
    else if (name === "cover")
      this.setData({ cover: {} as WechatMiniprogram.ImageFile });
    else if (name === "music")
      this.setData({
        music: {} as WechatMiniprogram.ChooseFile,
        musicName: "",
      });
  },

  /** 插入数据 */
  insetData: (data: Record<string, unknown>) =>
    wx.cloud.database().collection("items").add({ data }),

  /** 上传说说 */
  uploadArticle() {
    const { date, photos, text } = this.data;

    if (!text) modal("无法发表", "您必须输入文字内容");
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
            wx.setNavigationBarTitle({ title: "发表成功" });
            this.setData({ success: true });
          })
          .catch(error);
      };

      if (photos.length)
        // 上传配图
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

  /** 上传音乐 */
  uploadMusic() {
    const { cover, date, music, musicName, singer, text } = this.data;

    // 必要的校验
    if (!music.name) modal("无法发表", "您必须选择一个音乐文件");
    else if (!musicName) modal("无法发表", "您必须命名您的音乐文件");
    else if (!singer) modal("无法发表", "您必须填写演唱者");
    //可以上传
    else {
      // 进行提示
      wx.showLoading({ title: "上传中" });

      const insertandUpdate = (musicID: string, coverID = ""): void => {
        const data = {
          type: "music",
          name: musicName,
          date,
          text,
          singer,
          coverID,
          musicID,
        };

        this.insetData(data)
          .then((res) => {
            info("插入歌曲:", res._id);

            wx.hideLoading();
            wx.setNavigationBarTitle({ title: "发表成功" });
            this.setData({ success: true });
          })
          .catch(error);
      };

      // 上传音乐
      uploadCloudFile(
        music.path,
        // add current timeStamp as hash
        `music-${globalData.openid}-${new Date().getTime()}`
      ).then((musicID) => {
        if (cover)
          // 上传封面
          uploadCloudFile(
            this.data.cover.path,
            `cover-${globalData.openid}-${new Date().getTime()}`
          ).then((coverID) => insertandUpdate(musicID, coverID));
        // 直接上传
        else insertandUpdate(musicID);
      });
    }
  },

  /** 返回 */
  back() {
    wx.navigateBack();
  },

  /** 回到主页 */
  home() {
    wx.reLaunch({ url: "/pages/main/main" });
  },
});

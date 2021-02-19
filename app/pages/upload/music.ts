import { isAdmin as isAdminFunction } from "../../utils/identify";
import { error, info } from "../../utils/log";
import { modal, uploadCloudFile } from "../../utils/wx";

import type { AppOption } from "../../app";

const { globalData } = getApp<AppOption>();

Page({
  data: {
    darkmode: false,

    /** 音乐 */
    music: {} as WechatMiniprogram.ChooseFile,
    /** 音乐名称 */
    name: "",
    /** 配文 */
    text: "",
    /** 配文文字数 */
    textNumber: 0,
    /** 封面 */
    cover: {} as WechatMiniprogram.ImageFile,
    /** 发布日期 */
    date: "",
    /** 演唱者 */
    singer: "小爽",
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
  },

  /** 选择音乐 */
  chooseMusic() {
    // 选择文件
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      // 限制文件后缀
      extension: ["m4a", "aac", "mp3", "wav"],
      success: ({ tempFiles }) => {
        const music = tempFiles[0];
        const temp = music.name.split(".");

        temp.pop();
        const name = temp.join(".");

        this.setData({
          music: tempFiles[0],
          name,
        });
      },
    });
  },

  /** 名称变更 */
  nameChange({ detail }: WechatMiniprogram.Input) {
    this.setData({ name: detail.value });
  },

  /** 配文变更 */
  textChange({ detail }: WechatMiniprogram.TextareaInput) {
    this.setData({
      text: detail.value,
      textNumber: detail.value.length,
    });
  },

  /** 选择封面 */
  chooseCover() {
    wx.chooseImage({
      count: 1,
      success: ({ tempFiles }) => {
        this.setData({
          cover: tempFiles[0],
        });
      },
    });
  },

  /** 歌手变更 */
  singerChange({ detail }: WechatMiniprogram.TextareaInput) {
    this.setData({ singer: detail.value });
  },

  /** 日期变更 */
  timeChange({ detail }: WechatMiniprogram.PickerChange) {
    this.setData({ date: detail.value as string });
  },

  /** 上传 */
  upload() {
    const { cover, date, music, name, singer, text } = this.data;

    if (!music.name) modal("无法上传", "您必须选择一个音乐文件");
    else if (!name) modal("无法上传", "您必须命名您的音乐文件");
    else if (!singer) modal("无法上传", "您必须填写演唱者");
    else {
      // 进行提示
      wx.showLoading({ title: "上传中" });
      const { musicList } = globalData;

      const insertandUpdate = (musicID: string, coverID = ""): void => {
        const data = {
          name,
          date,
          text,
          singer,
          coverID,
          musicID,
        };

        this.insetData(data)
          .then((res) => {
            info("插入歌曲:", res._id);

            // 更新歌曲列表
            musicList.push({
              ...data,
              _id: res._id as string,
              _openid: globalData.openid,
            });
            globalData.musicList = musicList;
            this.setData({ musicList });
            wx.hideLoading();
            wx.redirectTo({ url: "/pages/upload/success" });
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

  /** 插入数据 */
  insetData: (data: Record<string, unknown>) =>
    wx.cloud.database().collection("music").add({ data }),
});

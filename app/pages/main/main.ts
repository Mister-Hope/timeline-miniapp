import { isAdmin } from "../../utils/identify";
import { error, info, debug, warn } from "../../utils/log";
import { message } from "../../utils/message";
import { confirm, tip } from "../../utils/wx";

import type { AppOption, MusicInfo } from "../../app";
import type { PlayMode } from "./typings";

const { globalData } = getApp<AppOption>();

/** 音频管理器 */
const manager = wx.getBackgroundAudioManager();

Page({
  data: {
    /** 播放器是否初始化 */
    inited: false,
    /** 是否可以播放 */
    canplay: false,
    /** 是否正在播放 */
    playing: false,
    /** 正在播放的歌的序列号 */
    index: 0,
    /** 当前时间 */
    currentTime: 0,
    /** 歌曲总长度 */
    totalTime: 1,
    /** 当前歌曲信息 */
    currentMusic: {} as MusicInfo,
    /** 歌曲列表 */
    musicList: [] as MusicInfo[],
    /** 播放模式 */
    mode: "列表循环" as PlayMode,

    /** 滑动按钮 */
    slideButtons: [
      // {
      //   text: "重命名",
      //   src: "/pages/main/icon/rename.svg",
      //   data: "rename",
      // },
      {
        text: "删除",
        src: "/pages/main/icon/delete.svg",
        data: "delete",
      },
    ],

    /** 夜间滑动按钮 */
    slideDarkButtons: [
      // {
      //   text: "重命名",
      //   src: "/pages/main/icon/rename-dark.svg",
      //   data: "rename",
      // },
      {
        text: "删除",
        src: "/pages/main/icon/delete-dark.svg",
        data: "delete",
      },
    ],
  },

  state: {
    interupt: false,
  },

  onLoad(option) {
    const mode = wx.getStorageSync("play-mode") as PlayMode;

    if (!mode) wx.setStorageSync("play-mode", "列表循环");

    // 写入基本信息
    this.setData({
      isAdmin: isAdmin(globalData.openid),
      playing: globalData.music.playing,
      mode: mode || "列表循环",

      info: globalData.info,
      darkmode: globalData.darkmode,
      indicatorColor: globalData.darkmode
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.15)",
      indicatorActiveColor: globalData.darkmode
        ? "rgba(255, 255, 255, 0.45)"
        : "rgba(0, 0, 0, 0.45)",
      firstPage: getCurrentPages().length === 1,
    });

    const setCurrentSongMusic = (musicList: MusicInfo[]): void => {
      if (option.index) globalData.music.index = Number(option.index);
      else if (option.fileID) {
        globalData.music.index = musicList.findIndex(
          (song) => song.fileID === option.fileID
        );
      }

      const { index } = globalData.music;

      // 写入歌曲列表与当前歌曲信息
      this.setData({
        ...(index > 0
          ? {
              inited: true,
              index,
              currentMusic: musicList[index],
            }
          : {}),
        musicList,
      });

      // 如果正在播放，设置能够播放
      if (globalData.music.playing)
        this.setData({ canplay: true, inited: true });

      message.off("musicList", setCurrentSongMusic);
    };

    if (globalData.musicList.length) setCurrentSongMusic(globalData.musicList);
    else message.on<[MusicInfo[]]>("musicList", setCurrentSongMusic);

    // 注册播放器动作
    this.managerRegister();

    if (wx.canIUse("onThemeChange")) wx.onThemeChange(this.themeChange);
  },

  onShow() {
    // 写入基本信息
    this.setData({
      playing: globalData.music.playing,
      index: globalData.music.index,
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { currentMusic } = this.data;

    return currentMusic && currentMusic.fileID
      ? {
          title: currentMusic.title,
          path: `/pages/main/main?id=${currentMusic.fileID}`,
        }
      : {
          title: "歌曲列表",
          path: "/pages/main/main",
        };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { currentMusic } = this.data;

    return currentMusic && currentMusic.fileID
      ? {
          title: currentMusic.title,
          query: `id=${currentMusic.fileID}`,
        }
      : { title: "歌曲列表" };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { currentMusic } = this.data;

    return currentMusic && currentMusic.fileID
      ? {
          title: currentMusic.title,
          query: `id=${currentMusic.fileID}`,
        }
      : { title: "歌曲列表" };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  /** 切换主题 */
  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({
      darkmode: theme === "dark",
      indicatorColor:
        theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
      indicatorActiveColor:
        theme === "dark" ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
    });
  },

  /** 上传文件 */
  upload() {
    // 选择文件
    wx.chooseMessageFile({
      count: 100,
      type: "file",
      // 限制文件后缀
      extension: ["m4a", "aac", "mp3", "wav"],
      success: ({ tempFiles }) => {
        // 进行提示
        wx.showLoading({ title: "上传中" });

        const { musicList } = globalData;
        const musicCollection = wx.cloud.database().collection("music");

        // 一次上传每个文件
        const promises = tempFiles.map<Promise<void>>(
          (tempFile) =>
            new Promise((resolve, reject) => {
              wx.cloud.uploadFile({
                // add current timeStamp as hash
                cloudPath: `${new Date().getTime()}-${globalData.openid}`,
                filePath: tempFile.path,
                // 返回文件 ID
                success: ({ fileID }) => {
                  const data = {
                    title: tempFile.name,
                    createTime: new Date(),
                    fileID,
                  };

                  // 插入数据
                  musicCollection.add({
                    data,
                    success: (res: { _id: string }) => {
                      // 更新歌曲列表
                      musicList.push({
                        ...data,
                        _id: res._id,
                        _openid: globalData.openid,
                      });
                      resolve();
                    },
                  });
                },
                fail: ({ errMsg }) => {
                  error(errMsg);
                  reject();
                },
              });
            })
        );

        Promise.all(promises).then(() => {
          globalData.musicList = musicList;
          this.setData({ musicList });
          wx.hideLoading();
        });
      },
    });
  },

  /** 点击列表项 */
  itemTap({ currentTarget }: WechatMiniprogram.Touch) {
    this.setData({ inited: true });

    this.switchSong(currentTarget.dataset.index as number);
  },

  /** 点击滑动按钮 */
  slideButtonTap({
    currentTarget,
    detail,
  }: WechatMiniprogram.Touch<{ data: "rename" | "delete" }>) {
    if (detail.data === "delete") {
      // 要求用户确认
      confirm("是否要删除该文件", () => {
        const music = this.data.musicList[
          currentTarget.dataset.index as number
        ];

        // 删除数据库记录
        wx.cloud
          .database()
          .collection("music")
          .doc(music._id)
          .remove({
            success: () => {
              // 删除文件
              wx.cloud.deleteFile({
                fileList: [music.fileID],
                success: () => {
                  // 更新歌曲列表
                  globalData.musicList.splice(
                    currentTarget.dataset.index as number,
                    1
                  );

                  this.setData({
                    musicList: globalData.musicList,
                  });
                },
                fail: error,
              });
            },
            fail: error,
          });
      });
    }
  },

  /** 注册音乐播放器 */
  managerRegister() {
    // 能够播放 100ms 后设置可以播放
    manager.onCanplay(() => {
      // 调试
      info("Canplay");
      this.setData({ canplay: true });
    });

    // 在相应动作时改变状态
    manager.onPlay(() => {
      this.setData({ playing: true });
      globalData.music.playing = true;
    });

    manager.onPause(() => {
      this.setData({ playing: false });
      globalData.music.playing = false;
    });

    manager.onTimeUpdate(() => {
      // 更新歌曲信息
      this.setData({
        currentTime: Math.round(manager.currentTime * 100) / 100,
        totalTime: Math.round(manager.duration * 100) / 100,
        canplay: true,
      });

      // 设置播放状态
      if (!globalData.music.playing) globalData.music.playing = true;
    });

    // 缓冲中
    manager.onWaiting(() => {
      warn("waiting");
      this.setData({ canplay: false });
    });

    manager.onPrev(() => {
      this.previous();
    });

    // 歌曲播放结束
    manager.onEnded(() => {
      this.end();
      debug("end");
    });

    // 歌曲播放结束
    manager.onStop(() => {
      info("用户通过浮窗中止");
      this.setData({ currentTime: 0, playing: false });
      this.state.interupt = true;
    });

    manager.onNext(() => {
      this.next();
    });

    manager.onError(({ errMsg }) => {
      tip("获取音乐出错，请稍后重试");
      error(`Manager: ${errMsg}`);
    });
  },

  /** 播放与暂停 */
  play() {
    if (this.state.interupt) {
      manager.src = this.data.currentMusic.fileID;
      this.state.interupt = false;
    } else if (this.data.playing) manager.pause();
    else manager.play();
  },

  /** 拖拽进度 */
  drag(event: WechatMiniprogram.SliderChange) {
    if (this.state.interupt) {
      manager.src = this.data.currentMusic.fileID;
      this.state.interupt = false;
    }

    if (event.type === "change") {
      manager.seek(event.detail.value / 100);

      this.setData({ currentTime: event.detail.value / 100, canplay: false });
    }
  },

  end() {
    // 结束动作
    const { index } = this.data;
    const total = this.data.musicList.length;
    let result: number | "stop";

    switch (this.data.mode) {
      case "随机播放":
        do result = Math.round(Math.random() * total - 0.5);
        while (index === result);
        break;
      case "顺序播放":
        result = index + 1 === total ? "stop" : index + 1;
        tip("播放完毕");
        break;
      case "单曲循环":
        result = index;
        break;
      case "列表循环":
      default:
        result = index + 1 === total ? 0 : index + 1;
    }

    this.switchSong(result);
  },

  /** 下一曲动作 */
  next() {
    const { index } = this.data;
    const total = this.data.musicList.length;
    let result: number | "nothing";

    if (total === 1) tip("只有一首歌曲");
    else {
      switch (this.data.mode) {
        case "随机播放":
          do result = Math.round(Math.random() * total - 0.5);
          while (index === result);
          break;
        case "顺序播放":
          if (index + 1 === total) {
            result = "nothing";
            tip("已是最后一曲");
          } else result = index + 1;
          break;
        case "单曲循环":
        case "列表循环":
        default:
          result = index + 1 === total ? 0 : index + 1;
      }

      this.switchSong(result);
    }
  },

  /** 上一曲动作 */
  previous() {
    const { index } = this.data;
    const total = this.data.musicList.length;
    let result: number | "nothing";

    if (total === 1) tip("只有一首歌曲");
    else {
      switch (this.data.mode) {
        case "随机播放":
          do result = Math.round(Math.random() * total - 0.5);
          while (index === result);
          break;
        case "顺序播放":
          if (index === 0) {
            result = "nothing";
            tip("已是第一曲");
          } else result = index - 1;
          break;
        case "单曲循环":
        case "列表循环":
        default:
          result = index === 0 ? total - 1 : index - 1;
      }
      this.switchSong(result);
    }
  },

  /** 切换歌曲 */
  switchSong(index: "stop" | "nothing" | number) {
    if (index === "stop") {
      this.setData({ playing: false, canPlay: false });

      manager.stop();
      // 正常赋值
    } else if (index !== "nothing") {
      const currentMusic = this.data.musicList[index];

      this.setData({
        currentMusic,
        index,
        playing: false,
        canPlay: false,
      });

      manager.src = currentMusic.fileID;
      manager.title = currentMusic.title;
      globalData.music.index = Number(index);
    }
  },

  /** 切换播放模式 */
  modeSwitch() {
    const modes = ["列表循环", "单曲循环", "顺序播放", "随机播放", "列表循环"];
    const mode = modes[modes.indexOf(this.data.mode) + 1] as PlayMode;

    this.setData({ mode });

    wx.setStorageSync("play-mode", mode);
    tip(`切换为${mode}模式`);
  },
});

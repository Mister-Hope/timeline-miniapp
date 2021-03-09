import { appName, defaultCover } from "../../config";
import { error } from "../../utils/log";
import { message } from "../../utils/message";
import { tip } from "../../utils/wx";

import type { AppOption } from "../../app";
import type { ItemInfo, MusicInfo } from "../../typings";

const { globalData } = getApp<AppOption>();

/** 音频管理器 */
const manager = wx.getBackgroundAudioManager();

type PlayMode = "列表循环" | "单曲循环" | "顺序播放" | "随机播放";

Page({
  data: {
    defaultCover,

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
    /** 是否展示歌曲列表 */
    showMusicList: false,
    /** 歌曲列表 */
    musicList: [] as MusicInfo[],
    /** 播放模式 */
    mode: "列表循环" as PlayMode,

    /** 弹窗配置 */
    popupConfig: {
      title: "歌曲列表",
      confirm: false,
      cancel: false,
    },
  },

  state: {
    /** 是否被系统或用户中断 */
    interupt: false,
  },

  onLoad(option) {
    const mode = wx.getStorageSync<PlayMode | undefined>("play-mode");

    if (!mode) wx.setStorageSync("play-mode", "列表循环");

    // 写入基本信息
    this.setData({
      playing: globalData.music.playing,
      mode: mode || "列表循环",

      info: globalData.info,
      darkmode: globalData.darkmode,
      firstPage: getCurrentPages().length === 1,
    });

    const setCurrentMusic = (): void => {
      const { music, musicList } = globalData;

      const index = option.id
        ? Math.max(
            musicList.findIndex((music) => music.musicID === option.id),
            0
          )
        : music.index;
      const currentMusic = musicList[index];

      // 写入列表
      this.setData({
        // 当前歌曲信息
        index,
        currentMusic,
        musicList,
      });

      // 歌曲相同且正在播放
      if (index === music.index && music.playing)
        this.setData({ canplay: true });
      // 播放新的歌曲
      else this.switchMusic(index);

      message.off("items", setCurrentMusic);
    };

    if (globalData.timeline.length) setCurrentMusic();
    else message.on<[ItemInfo[]]>("items", setCurrentMusic);

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

    return {
      title: currentMusic.name,
      path: `/pages/detail/music?id=${currentMusic.musicID}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { currentMusic } = this.data;

    return {
      title: currentMusic.name,
      query: `id=${currentMusic.musicID}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { currentMusic } = this.data;

    return {
      title: currentMusic.name,
      query: `id=${currentMusic.musicID}`,
    };
  },

  onUnload() {
    if (wx.canIUse("onThemeChange")) wx.offThemeChange(this.themeChange);
  },

  themeChange({ theme }: WechatMiniprogram.OnThemeChangeCallbackResult) {
    this.setData({ darkmode: theme === "dark" });
  },

  /** 注册音乐播放器 */
  managerRegister() {
    manager.epname = appName;

    // 能够播放 100ms 后设置可以播放
    manager.onCanplay(() => {
      // 调试
      console.info("Canplay");
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
      console.warn("waiting");
      this.setData({ canplay: false });
    });

    manager.onPrev(() => {
      this.previous();
    });

    // 歌曲播放结束
    manager.onEnded(() => {
      this.end();
      console.log("end");
    });

    // 歌曲播放结束
    manager.onStop(() => {
      console.log("用户通过浮窗中止");
      this.setData({ currentTime: 0, playing: false });
      this.state.interupt = true;
    });

    manager.onNext(() => {
      this.next();
    });

    manager.onError(({ errMsg }) => {
      tip("获取音乐出错，请稍后重试");
      error(`Manager failed with error: ${errMsg}`);
    });
  },

  loadCover(event: WechatMiniprogram.ImageLoad) {
    // 加载封面
    if (event.type === "load") this.setData({ coverLoad: true });
  },

  /** 播放与暂停 */
  play() {
    if (this.state.interupt) {
      manager.src = this.data.currentMusic.musicID;
      this.state.interupt = false;
    } else if (this.data.playing) manager.pause();
    else manager.play();
  },

  /** 拖拽进度 */
  drag(event: WechatMiniprogram.SliderChange) {
    if (this.state.interupt) {
      manager.src = this.data.currentMusic.musicID;
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

    this.switchMusic(result);
  },

  /** 下一曲动作 */
  next() {
    const { index } = this.data;
    const total = globalData.musicList.length;
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

      this.switchMusic(result);
    }
  },

  /** 上一曲动作 */
  previous() {
    const { index } = this.data;
    const total = globalData.musicList.length;
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
      this.switchMusic(result);
    }
  },

  /** 切换歌曲 */
  switchMusic(index: "stop" | "nothing" | number) {
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

      manager.src = currentMusic.musicID;
      manager.title = currentMusic.name;
      manager.singer = currentMusic.singer;
      // get temp url and set cover
      wx.cloud
        .getTempFileURL({ fileList: [currentMusic.coverID] })
        .then(({ fileList }) => {
          manager.coverImgUrl = fileList[0].tempFileURL;
        });

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

  /** 切换列表显隐 */
  list() {
    this.setData({ showMusicList: !this.data.showMusicList });
  },

  // 点击列表具体歌曲项时触发
  change({ currentTarget }: WechatMiniprogram.TouchEvent) {
    this.list();
    this.switchMusic(currentTarget.dataset.index);
  },

  back() {
    if (getCurrentPages().length === 1)
      wx.redirectTo({ url: "/pages/main/main" });
    else wx.navigateBack();
  },
});

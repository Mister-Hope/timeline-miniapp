import type { ItemInfo, MusicInfo } from "./typings.js";
import { startup } from "./utils/app.js";
import { getTimelineItems } from "./utils/database.js";
import { message } from "./utils/message.js";

export interface GlobalData {
  /** 版本号 */
  version: string;
  /** 播放器信息 */
  music: {
    /** 是否正在播放 */
    playing: boolean;
    /** 播放歌曲序号 */
    index: number;
  };
  /** 时间线项目列表 */
  timeline: ItemInfo[];
  /** 音乐列表 */
  musicList: MusicInfo[];
  /** 用户的 openid */
  openid: string;
  /** 是否是所有者 */
  isOwner: boolean | undefined;
  /** 夜间模式开启状态 */
  darkmode: boolean;
  /** 设备信息 */
  info: WechatMiniprogram.SystemInfo;
}

export interface AppOption {
  globalData: GlobalData;
}

App({
  globalData: {
    version: "2.0.0",
    isAdmin: false,
    openid: "",
    music: { playing: false, index: 0 },
    timeline: [],
    musicList: [],
  } as unknown as GlobalData,

  onLaunch() {
    startup(this.globalData);

    this.globalData.timeline = wx.getStorageSync<ItemInfo[]>("timeline");

    getTimelineItems().then((items) => {
      this.globalData.timeline = items;
      this.globalData.musicList = items.filter((item) => item.type === "music");

      message.emit("items", items);
      wx.setStorageSync("timeline", items);
    });
  },
});

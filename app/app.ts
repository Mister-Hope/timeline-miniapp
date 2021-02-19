import { startup } from "./utils/app";
import { info } from "./utils/log";
import { message } from "./utils/message";

export interface MusicInfo {
  title: string;
  createTime: Date;
  fileID: string;

  _id: string;
  _openid: string;
}

interface MusicCloudFunction {
  name: "music";
  success: (res: { result: { data: MusicInfo[]; errMsg: string } }) => void;
}

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
  /** 音乐列表 */
  musicList: MusicInfo[];
  /** 用户的 openid */
  openid: string;
  /** 夜间模式开启状态 */
  darkmode: boolean;
  /** 设备信息 */
  info: WechatMiniprogram.SystemInfo;
}

export interface AppOption {
  globalData: GlobalData;
}

App({
  globalData: ({
    version: "1.0.0",
    openid: "",
    music: { playing: false, index: -1 },
    musicList: [],
  } as unknown) as GlobalData,

  onLaunch() {
    startup(this.globalData);

    // 获取歌曲列表
    wx.cloud.callFunction(<MusicCloudFunction>{
      name: "music",
      success: ({ result }) => {
        info("歌曲列表:", result.data);

        this.globalData.musicList = result.data;
        message.emit("musicList", result.data);
      },
    });
  },
});

import { startup } from "./utils/app";
import { getItems } from "./utils/database";
import { message } from "./utils/message";

import type { ItemInfo, MusicInfo } from "./typings";

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
  /** 项目列表 */
  items: ItemInfo[];
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
  globalData: ({
    version: "2.0.0",
    isAdmin: false,
    openid: "",
    music: { playing: false, index: 0 },
    items: [],
    musicList: [],
  } as unknown) as GlobalData,

  onLaunch() {
    startup(this.globalData);

    getItems().then((items) => {
      this.globalData.items = items;
      this.globalData.musicList = items.filter(
        (item) => item.type === "music"
      ) as MusicInfo[];

      message.emit("items", items);
    });
  },
});

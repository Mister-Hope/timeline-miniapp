import { startup } from "./utils/app";
import { info } from "./utils/log";
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
  /** 夜间模式开启状态 */
  darkmode: boolean;
  /** 设备信息 */
  info: WechatMiniprogram.SystemInfo;
}

export interface AppOption {
  globalData: GlobalData;
  getItems: () => Promise<ItemInfo[]>;
}

App({
  globalData: ({
    version: "1.0.0",
    openid: "",
    music: { playing: false, index: 0 },
    items: [],
    musicList: [],
  } as unknown) as GlobalData,

  onLaunch() {
    startup(this.globalData);

    this.getItems().then((items) => {
      this.globalData.items = items;
      this.globalData.musicList = items.filter(
        (item) => item.type === "music"
      ) as MusicInfo[];

      message.emit("items", items);
    });
  },

  getItems(): Promise<ItemInfo[]> {
    // 获取项目列表
    return wx.cloud
      .callFunction({
        name: "items",
      })
      .then(({ result }) => {
        const data = (result as {
          data: ItemInfo[];
          errMsg: string;
        }).data.reverse();

        info("项目列表为:", data);

        return data;
      });
  },
});

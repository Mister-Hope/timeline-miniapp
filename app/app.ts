import { startup } from "./utils/app";
import { info } from "./utils/log";
import { message } from "./utils/message";
import { ItemInfo } from "./typings";

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
  items: ItemInfo[];
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
    music: { playing: false, index: -1 },
    items: [],
  } as unknown) as GlobalData,

  onLaunch() {
    startup(this.globalData);

    this.getItems().then((items) => {
      this.globalData.items = items;

      message.emit("items", items);
    });
  },

  getItems(): Promise<ItemInfo[]> {
    // 获取歌曲列表
    return wx.cloud
      .callFunction({
        name: "items",
      })
      .then(({ result }) => {
        const { data } = result as { data: ItemInfo[]; errMsg: string };

        info("列表为:", data);

        return data;
      });
  },
});

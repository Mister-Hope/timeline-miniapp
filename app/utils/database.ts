import { info } from "./log.js";
import type { ItemInfo } from "../typings.js";

export const getTimelineItems = (): Promise<ItemInfo[]> => {
  // 获取项目列表
  return wx.cloud.callFunction({ name: "items" }).then(({ result }) => {
    const { data } = result as {
      data: ItemInfo[];
      errMsg: string;
    };

    info("项目列表为:", data);

    return data;
  });
};

export interface SongDetail {
  /** 歌曲地址 */
  fileID: string;
  /** 标题 */
  title: string;
}

export type PlayMode = "列表循环" | "单曲循环" | "顺序播放" | "随机播放";

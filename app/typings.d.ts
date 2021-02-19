export interface MusicInfo {
  type: "music";

  /** 歌曲名称 */
  name: string;
  /** 演唱者 */
  singer: string;
  /** 日期 */
  date: string;
  /** 配文 */
  text: string;
  /** 封面 fileID */
  coverID: string;
  /** 音乐 fileID */
  musicID: string;

  _id: string;
  _openid: string;
}

export interface ArticleInfo {
  type: "article";

  /** 文字 */
  text: string;
  /** 日期 */
  date: string;
  /** 配图 fileID */
  photos: string[];

  _id: string;
  _openid: string;
}

export type ItemInfo = ArticleInfo | MusicInfo;

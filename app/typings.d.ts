interface DataBaseItem {
  _id: string;
  _openid: string;
}

export interface ArticleInfo extends DataBaseItem {
  type: "article";

  /** 文字 */
  text: string;
  /** 日期 */
  date: string;
  /** 配图 fileID */
  photos: string[];
}

export interface MusicInfo extends DataBaseItem {
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
}

export type ItemInfo = ArticleInfo | MusicInfo;

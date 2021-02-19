import { isAdmin as isAdminFunction } from "../../utils/identify";
import { error } from "../../utils/log";
import type { AppOption } from "../../app";
const { globalData } = getApp<AppOption>();

Page({
  data: {
    darkmode: false,
  },

  onLoad() {
    const isAdmin = isAdminFunction(globalData.openid);

    if (isAdmin)
      // 写入基本信息
      this.setData({
        isAdmin,

        darkmode: globalData.darkmode,
        // info: globalData.info,

        firstPage: getCurrentPages().length === 1,
      });
    // user can not access this page
    else wx.reLaunch({ url: "/pages/main/main" });
  },

  /** 上传音乐 */
  uploadMusic() {
    // 选择文件
    wx.chooseMessageFile({
      count: 100,
      type: "file",
      // 限制文件后缀
      extension: ["m4a", "aac", "mp3", "wav"],
      success: ({ tempFiles }) => {
        // 进行提示
        wx.showLoading({ title: "上传中" });

        const { musicList } = globalData;
        const musicCollection = wx.cloud.database().collection("music");

        // 一次上传每个文件
        const promises = tempFiles.map<Promise<void>>(
          (tempFile) =>
            new Promise((resolve, reject) => {
              wx.cloud.uploadFile({
                // add current timeStamp as hash
                cloudPath: `${new Date().getTime()}-${globalData.openid}`,
                filePath: tempFile.path,
                // 返回文件 ID
                success: ({ fileID }) => {
                  const data = {
                    title: tempFile.name,
                    createTime: new Date(),
                    fileID,
                  };

                  // 插入数据
                  musicCollection.add({
                    data,
                    success: (res: { _id: string }) => {
                      // 更新歌曲列表
                      musicList.push({
                        ...data,
                        _id: res._id,
                        _openid: globalData.openid,
                      });
                      resolve();
                    },
                  });
                },
                fail: ({ errMsg }) => {
                  error(errMsg);
                  reject();
                },
              });
            })
        );

        Promise.all(promises).then(() => {
          globalData.musicList = musicList;
          this.setData({ musicList });
          wx.hideLoading();
        });
      },
    });
  },
});

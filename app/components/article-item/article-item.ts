import { avatar } from "../../config.js";

Component({
  properties: {
    config: {
      type: Object,
      required: true,
    },
  },

  data: {
    avatar,
  },

  methods: {
    navigate(): void {
      wx.navigateTo({
        url: `/pages/detail/article?id=${this.data.config._id as string}`,
      });
    },

    /** 进行图片预览 */
    view({ currentTarget }: WechatMiniprogram.Touch): void {
      const photos = this.data.config.photos as string[];
      const current = photos[currentTarget.dataset.index as number];

      wx.previewImage({
        current,
        urls: photos,
      });
    },
  },
});

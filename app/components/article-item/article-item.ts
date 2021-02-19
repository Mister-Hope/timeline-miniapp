Component({
  properties: {
    config: {
      type: Object,
      required: true,
    },
  },

  methods: {
    navigate(): void {
      wx.navigateTo({
        url: `/pages/main/article?id=${this.data.config._id as string}`,
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

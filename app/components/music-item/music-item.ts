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
        url: `/pages/detail/music?id=${this.data.config.musicID as string}`,
      });
    },
  },
});

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
        url: `/pages/main/music?musicID=${this.data.config.musicID as string}`,
      });
    },
  },
});

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
        url: `/pages/detail/music?id=${this.data.config.musicID as string}`,
      });
    },
  },
});

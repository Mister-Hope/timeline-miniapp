import { avatar } from "../../config";

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

import { DYNAMIC_CURRENT_ENV, init, getWXContext } from "wx-server-sdk";

// 初始化 cloud
init({
  env: (DYNAMIC_CURRENT_ENV as unknown) as string,
});

export const main = async (): Promise<{
  openid: string | undefined;
  appid: string | undefined;
  unionid: string | undefined;
  env: string | undefined;
  // eslint-disable-next-line @typescript-eslint/require-await
}> => {
  const { APPID, ENV, OPENID, UNIONID } = getWXContext();

  return {
    openid: OPENID,
    appid: APPID,
    unionid: UNIONID,
    env: ENV,
  };
};

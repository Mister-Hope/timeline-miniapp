import cloud, {
  DYNAMIC_CURRENT_ENV,
  database,
  init,
  getWXContext,
} from "wx-server-sdk";

// 初始化 cloud
init({
  env: DYNAMIC_CURRENT_ENV as unknown as string,
});

const MAX_LIMIT = 100;

interface LoginResult {
  openid: string | undefined;
  isOwner: boolean;
}

export const main = async (): Promise<LoginResult> => {
  const { OPENID } = getWXContext();
  const collection = database().collection("admin");
  const { total } = (await collection.count()) as cloud.DB.ICountResult;

  const batchTimes = Math.ceil(total / 100);

  const tasks = new Array(batchTimes).fill(1).map(
    (_element, index) =>
      collection
        .skip(index * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get() as Promise<cloud.DB.IQueryResult>
  );

  const isOwner = (await Promise.all(tasks))
    .reduce((acc, cur) => acc.concat(cur.data), [] as cloud.DB.IDocumentData[])
    .some((item) => item.openid === OPENID);

  return {
    openid: OPENID,
    isOwner,
  };
};

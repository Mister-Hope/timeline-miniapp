import cloud, {
  DYNAMIC_CURRENT_ENV,
  database,
  init,
  getWXContext,
} from "wx-server-sdk";

// 初始化 cloud
init({
  // API 调用都保持和云函数当前所在环境一致
  env: (DYNAMIC_CURRENT_ENV as unknown) as string,
});

const db = database();

const MAX_LIMIT = 100;

interface ListResult {
  data: cloud.DB.IDocumentData[];
  errMsg: string;
}

export const main = async (): Promise<ListResult> => {
  const { OPENID } = getWXContext();

  const colection = db.collection("music").where({ _openid: OPENID });

  const countResult = (await colection.count()) as cloud.DB.ICountResult;

  const { total } = countResult;

  const batchTimes = Math.ceil(total / 100);

  const tasks = new Array(batchTimes).fill(1).map(
    (_element, index) =>
      colection
        .skip(index * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get() as Promise<cloud.DB.IQueryResult>
  );

  return (await Promise.all(tasks)).reduce((acc, cur) => ({
    data: acc.data.concat(cur.data),
    errMsg: acc.errMsg,
  }));
};

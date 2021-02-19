import cloud, { DYNAMIC_CURRENT_ENV, database, init } from "wx-server-sdk";

// 初始化 cloud
init({
  env: (DYNAMIC_CURRENT_ENV as unknown) as string,
});

const MAX_LIMIT = 100;

interface ListResult {
  data: cloud.DB.IDocumentData[];
  errMsg: string;
}

export const main = async (): Promise<ListResult> => {
  const colection = database().collection("items");

  const { total } = (await colection.count()) as cloud.DB.ICountResult;

  const batchTimes = Math.ceil(total / 100);

  const tasks = new Array(batchTimes).fill(1).map(
    (_element, index) =>
      colection
        .skip(index * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get() as Promise<cloud.DB.IQueryResult>
  );

  return (await Promise.all(tasks)).reduce(
    (acc, cur) => ({
      data: acc.data.concat(cur.data),
      errMsg: cur.errMsg,
    }),
    { data: [], errMsg: "Empty" }
  );
};

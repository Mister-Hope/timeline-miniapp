export const getCurrentDate = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();

  return `${now.getFullYear()}-${month < 10 ? `0${month}` : month}-${
    date < 10 ? `0${date}` : date
  }`;
};

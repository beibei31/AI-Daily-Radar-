export function getShanghaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric"
  }).format(date);
}

export function getShanghaiDayBounds(date = new Date()) {
  const key = getShanghaiDateKey(date);
  const start = new Date(`${key}T00:00:00+08:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    key,
    start,
    end
  };
}

export function formatShanghaiDate(date: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeZone: "Asia/Shanghai"
  }).format(new Date(date));
}

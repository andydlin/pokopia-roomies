export const intersection = <T,>(a: T[], b: T[]) => {
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
};

export const unique = <T,>(values: T[]) => [...new Set(values)];

export const sortByNumberDesc = <T,>(items: T[], getValue: (item: T) => number) =>
  [...items].sort((left, right) => getValue(right) - getValue(left));

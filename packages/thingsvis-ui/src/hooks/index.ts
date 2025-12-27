/**
 * DataSource Hook Skeletons
 * To be implemented in US1/US2/US3
 */

export const useDataSource = (id: string) => {
  return { data: null, isLoading: true, error: null };
};

export const useDataBinding = (expression: string) => {
  return { value: null };
};


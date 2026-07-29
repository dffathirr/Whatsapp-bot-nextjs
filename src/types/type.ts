export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface ApiParams<T extends object = object> {
  calledFrom?: string;
  token?: string;
  shouldFetch?: boolean;
  //   swrConfig?: SWRConfiguration;
  shouldRevalidate?: boolean;
  props?: T;
  next?: NextFetchRequestConfig | undefined;
  headers?: HeadersInit;
}

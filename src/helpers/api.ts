// export const api = async <T>({
//   url,
//   method = "GET",
//   type = "json",
//   token = "",
//   headers,
//   data,
//   next,
//   controller = "controller",
//   calledFrom = "caller",
//   customErrorMessage,
//   debug = false,
//   user,
// }: Params): Promise<Response & { parsedBody: T }> => {
//   const requestId = generateRequestId();
//   const revalidate =
//     typeof next?.revalidate === "number"
//       ? next.revalidate
//       : clientEnv.DEFAULT_NEXT_REVALIDATE;

//   //~ Initialize Timer
//   const timer = getTimer();
//   const startAll = timer.now();

//   /*
//   TODO: Add timeout for fetch request
//   todo: caller sent timeout in params, default to 8 seconds on producotion, 30 seconds on development, 0 for no timeout (DANGER!)
//   */
//   /*
//   TODO: Refresh interval integration from SWR
//   todo: need nextjs revalidate tag
//   */
//   /*
//   TODO: shouldRevalidate refactor, better readibilty
//   */

//   // Only log on server
//   const baseLog: HttpLogPayload = {
//     request_id: requestId,
//     request: {
//       method,
//       endpoint_alias: controller,
//       path: url.split("?")[0].replace(/^(https?:)?\/\/[^/]+/, ""),
//       query:
//         method === "GET"
//           ? url.includes("?")
//             ? Object.fromEntries(new URLSearchParams(url.split("?")[1]))
//             : undefined
//           : undefined,
//       body: data || {},
//     },
//     response: { duration_ms: 0, status_code: 0 },
//     user,
//     debug,
//   };

//   try {
//     const cacheKey = method + "|" + url; // bisa diperluas dengan method/body
//     const cached = getCache(cacheKey);

//     //~ Fetch Response
//     const response = await fetch(url, {
//       method,
//       headers: {
//         ...(type === "json" ? { "Content-Type": "application/json" } : {}),
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         ...headers,
//       },
//       body: type === "json" ? JSON.stringify(data) : data,
//       next: {
//         tags: [clientEnv.FETCH_TAG, ...(next?.tags ?? [])],
//         revalidate,
//       },
//     });

//     //~ Custom Parsed Body
//     let parsedBody = await parseResponse(response, type);

//     //~ If parsedBody valid and its object
//     if (parsedBody && typeof parsedBody === "object") {
//       //~ If requestId is missing (request come from server)
//       if (!parsedBody.requestId) {
//         parsedBody.requestId = requestId;
//         parsedBody.nextTag = next?.tags?.[0];
//       }
//     } else {
//       // Extract only the path after the last "/Api/"
//       const apiPathMatch = url.match(/\/Api\/.*$/);
//       const apiPath = apiPathMatch ? apiPathMatch[0] : url;
//       parsedBody = {
//         Status: response.status,
//         Message: `Cannot ${method} ${apiPath}`,
//         Data: null,
//         requestId,
//         nextTag: next?.tags?.[0],
//       };
//     }

//     //~ Get Parsed Time After Parse Response
//     const endAll = timer.now();
//     const totalTime = timer.diff(endAll, startAll).toFixed(3);

//     //~ Caching Info
//     const backendTimestamp = new Date(
//       response.headers.get("date") ?? 0,
//     ).getTime();
//     let cacheStatus: "HIT" | "MISS" = "MISS";

//     if (cached && cached.timestamp === backendTimestamp) {
//       cacheStatus = "HIT";
//     }

//     //# Only set cache when revalidate > 0, because if revalidate = 0, it means no cache, so no need to set cache
//     if (revalidate > 0) {
//       setCache(cacheKey, { status: cacheStatus, timestamp: backendTimestamp }); // refresh cache
//     }

//     //~ Log Error
//     if (!response.ok) {
//       logHttp({
//         ...baseLog,
//         err: new Error(customErrorMessage || parsedBody.Message || "API Error"),
//         response: {
//           status_code: response.status,
//           duration_ms: Number(totalTime),
//           cache: cacheStatus,
//         },
//       });

//       return Object.assign(response, { parsedBody, error: true });
//     }

//     //~ Log Success
//     logHttp({
//       ...baseLog,
//       level: "info",
//       response: {
//         status_code: response.status,
//         duration_ms: Number(totalTime),
//         cache: cacheStatus,
//       },
//     });
//     return Object.assign(response, { parsedBody });
//   } catch (error) {
//     logHttp({
//       ...baseLog,
//       err: error instanceof Error ? error : new Error("Network Error"),
//       response: {
//         status_code:
//           error instanceof ApiError ? error.cause.status || 500 : 500,
//         duration_ms: timer.diff(timer.now(), startAll),
//         cache: "MISS",
//       },
//     });

//     const errorResponse = new Response(JSON.stringify({}), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });

//     return Object.assign(errorResponse, {
//       parsedBody: {
//         Status: 500,
//         Message: "Network Error",
//         Data: null,
//         requestId,
//         nextTag: next?.tags?.[0],
//       } as T,
//       error: true,
//     });
//   }
// };

// // Helper function to parse different response types
// const parseResponse = async (response: Response, type: Params["type"]) => {
//   try {
//     return await (type === "json"
//       ? response.json()
//       : type === "blob"
//         ? response.blob()
//         : response.text());
//   } catch (error) {
//     return null;
//   }
// };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Timer interface
interface Timer {
  now(): number;
  diff(end: number, start: number): number;
}

// Server timer (nanosecond → ms)
function createServerTimer(): Timer {
  return {
    now: () => Number(process.hrtime.bigint()), // convert ke number
    diff: (end, start) => (end - start) / 1_000_000,
  };
}

// Client timer (performance.now → ms)
function createClientTimer(): Timer {
  return {
    now: () => performance.now(),
    diff: (end, start) => end - start,
  };
}

function getTimer(): Timer {
  return typeof window === "undefined"
    ? createServerTimer()
    : createClientTimer();
}

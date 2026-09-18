/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as adminAuthData from "../adminAuthData.js";
import type * as artisans from "../artisans.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as data from "../data.js";
import type * as favorites from "../favorites.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  adminAuthData: typeof adminAuthData;
  artisans: typeof artisans;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  data: typeof data;
  favorites: typeof favorites;
  files: typeof files;
  http: typeof http;
  lib: typeof lib;
  reviews: typeof reviews;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

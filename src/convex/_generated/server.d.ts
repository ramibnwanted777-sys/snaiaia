import type {
  ActionBuilder,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  HttpActionBuilder,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";

export type QueryCtx = GenericQueryCtx<any>;
export type MutationCtx = GenericMutationCtx<any>;
export type ActionCtx = GenericActionCtx<any>;

export declare const query: QueryBuilder<any, "public">;
export declare const internalQuery: QueryBuilder<any, "internal">;
export declare const mutation: MutationBuilder<any, "public">;
export declare const internalMutation: MutationBuilder<any, "internal">;
export declare const action: ActionBuilder<any, "public">;
export declare const internalAction: ActionBuilder<any, "internal">;
export declare const httpAction: HttpActionBuilder;


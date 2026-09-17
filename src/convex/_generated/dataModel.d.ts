import type { GenericId } from "convex/values";
import type { TableNamesInDataModel } from "convex/server";

export type Id<TableName extends string = string> = GenericId<TableName>;

export type Doc<TableName extends string = string> = any;

export type DataModel = any;


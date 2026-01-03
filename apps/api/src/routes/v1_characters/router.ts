import type { HonoEnv } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { V1_CHARACTERS_ROUTER_BASE_PATH } from "../../constants";
import { registerCharacterRoute } from "./$codepoint";

export const V1_CHARACTERS_ROUTER = new OpenAPIHono<HonoEnv>().basePath(V1_CHARACTERS_ROUTER_BASE_PATH);

registerCharacterRoute(V1_CHARACTERS_ROUTER);

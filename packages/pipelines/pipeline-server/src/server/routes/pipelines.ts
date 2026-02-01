import { H3 } from "h3";

const router = new H3();

router.get("/", () => ({
  pipelines: [],
}));

// router.get("/:id", (event) => { ... });
// router.post("/:id/execute", (event) => { ... });

export default router;

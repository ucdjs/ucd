import { H3 } from "h3";

const router = new H3();

router.get("/", () => ({
  message: "Hello from H3!",
  timestamp: Date.now(),
}));

export default router;

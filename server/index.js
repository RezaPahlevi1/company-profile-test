import "dotenv/config";
import app from "./src/app.js";
import { startScheduler } from "./src/utils/schedulerService.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // ✅ Start scheduler setelah server siap — async agar recovery selesai dulu
  startScheduler().catch((err) =>
    console.error("[Scheduler] Failed to start:", err.message),
  );
});

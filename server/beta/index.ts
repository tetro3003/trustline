import { DEMO, DEMO_LENDER, demoFetch, demoResolver, enableDemoSettings } from "./demo";
import { openDatabase } from "./db";
import { createBetaHttp } from "./http";
import { createBetaService } from "./service";
import { createBetaStore } from "./store";
import { createVault } from "./vault";

/** One service per server process. */
function build() {
  const store = createBetaStore(openDatabase());
  if (DEMO()) {
    enableDemoSettings();
    console.log("[beta] DEMO MODE: outside services replaced by synthetic stand-ins (server/beta/demo.ts)");
  }
  const service = createBetaService({ store, vault: createVault(), ...(DEMO() ? { fetch: demoFetch, dnsResolver: demoResolver } : {}) });
  // Demo mode: the bank officer exists from the start, so a visitor can share a report and review it straight away.
  if (DEMO() && !store.userByEmail(DEMO_LENDER.email)) service.signup({ ...DEMO_LENDER, role: "lender" });
  return { service, handle: createBetaHttp(service) };
}

const g = globalThis as unknown as { __trustlineBeta?: ReturnType<typeof build> };
export const beta = () => (g.__trustlineBeta ??= build());

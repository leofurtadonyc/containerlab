import { describe, expect, it, vi } from "vitest";

import { SERVICE_EXPLORER_SERVICE_ID_PARAM } from "../src/lib/service-explorer-navigation";
import {
  navigateToServiceDossier,
  navigateToServiceDossierForPolicy,
  readServiceDossierServiceIdFromSearch,
} from "../src/lib/service-dossier-navigation";

describe("service-dossier navigation readers", () => {
  it("reads service_id from search (same param as Service Explorer)", () => {
    expect(readServiceDossierServiceIdFromSearch(`?${SERVICE_EXPLORER_SERVICE_ID_PARAM}=color%3A100`)).toBe("color:100");
    expect(readServiceDossierServiceIdFromSearch("?")).toBeNull();
  });
});

describe("navigateToServiceDossier", () => {
  it("sets view=service-dossier and service_id", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=overview",
      search: "?view=overview",
    });

    navigateToServiceDossier({ serviceId: "color:100" });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("service-dossier");
    expect(next.searchParams.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)).toBe("color:100");

    replaceState.mockRestore();
  });

  it("clears service_id when null", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=service-dossier&service_id=color%3A100",
      search: "?view=service-dossier&service_id=color%3A100",
    });

    navigateToServiceDossier({ serviceId: null });

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("service-dossier");
    expect(next.searchParams.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)).toBeNull();

    replaceState.mockRestore();
  });

  it("navigateToServiceDossierForPolicy sets policy-prefixed service_id", () => {
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    vi.stubGlobal("location", {
      ...window.location,
      href: "http://localhost/?view=policies",
      search: "?view=policies",
    });

    navigateToServiceDossierForPolicy("PE1:static:1:100");

    const urlArg = replaceState.mock.calls[0][2] as string;
    const next = new URL(urlArg);
    expect(next.searchParams.get("view")).toBe("service-dossier");
    expect(next.searchParams.get(SERVICE_EXPLORER_SERVICE_ID_PARAM)).toBe("policy:PE1:static:1:100");

    replaceState.mockRestore();
  });
});

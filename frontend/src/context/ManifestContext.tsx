import { createContext, useContext } from "react";
import type { CourseManifest } from "@/lib/types";

const ManifestContext = createContext<CourseManifest | null>(null);

export function ManifestProvider({
  value,
  children,
}: {
  value: CourseManifest;
  children: React.ReactNode;
}) {
  return <ManifestContext.Provider value={value}>{children}</ManifestContext.Provider>;
}

export function useManifest(): CourseManifest {
  const m = useContext(ManifestContext);
  if (!m) throw new Error("useManifest: нет манифеста");
  return m;
}

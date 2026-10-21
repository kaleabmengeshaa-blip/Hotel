"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => window.location.origin;
const getServerSnapshot = () => "";

export function useBrowserOrigin() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
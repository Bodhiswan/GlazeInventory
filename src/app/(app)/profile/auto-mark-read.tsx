"use client";

import { useEffect, useRef } from "react";

import { markAllDirectMessagesReadAction } from "@/app/actions/community";

export function AutoMarkRead({ fromUserId }: { fromUserId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const fd = new FormData();
    fd.set("fromUserId", fromUserId);
    void markAllDirectMessagesReadAction(fd);
  }, [fromUserId]);
  return null;
}

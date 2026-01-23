"use client";

/**
 * Device ID 관리 훅
 * localStorage에 고유 디바이스 ID를 저장하여 중복 투표 방지
 */

import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "gr-device-id";

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}

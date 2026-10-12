"use client";

import { useEffect } from "react";
import AOS from "aos";

export default function AosProvider() {
  useEffect(() => {
    AOS.init({
      duration: 750,
      easing: "ease-out-cubic",
      offset: 80,
      once: true,
      mirror: false,
    });
  }, []);

  return null;
}

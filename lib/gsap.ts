"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(useGSAP, ScrollToPlugin, MotionPathPlugin);
gsap.config({ force3D: true, nullTargetWarn: false });
gsap.defaults({ ease: "expo.out" });
gsap.ticker.lagSmoothing(500, 33);

export { gsap, useGSAP };

/** Expo-out: fast arrival, long settle — the recap's default ease. */
export const EASE = "expo.out";
export const EASE_IN_OUT = "power3.inOut";
export const EASE_SOFT = "power3.out";

/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./audio-pulse.scss";
import React from "react";
import { useEffect, useRef } from "react";
import c from "classnames";

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
};

export default function AudioPulse({ active, volume, hover }: AudioPulseProps) {
  const bubbles = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const update = () => {
      const normalizedVolume = Math.min(Math.max(volume, 0), 1); // Normalize volume between 0 and 1
      bubbles.current.forEach((bubble) => {
        if (bubble) {
          bubble.style.transform = `scale(${1 + normalizedVolume * 0.5})`;
          bubble.style.opacity = `${0.3 + normalizedVolume * 0.7}`;
        }
      });
    };

    const animationFrame = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrame);
  }, [volume]);

  return (
    <div className={c("audioPulse", { active, hover })}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          ref={(el) => (bubbles.current[i] = el!)}
          className="bubble"
        />
      ))}
    </div>
  );
}

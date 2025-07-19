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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FunctionDeclaration, Part, Tool } from '@google/generative-ai';
import {
  MultimodalLiveAPIClientConnection,
  MultimodalLiveClient,
} from "../lib/multimodal-live-client";
import { LiveConfig } from "../multimodal-live-types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: React.Dispatch<React.SetStateAction<LiveConfig>>;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  setTools: (tools: FunctionDeclaration[]) => void;
};

export function useLiveAPI({
  url,
  apiKey,
  tools,
  voice,
  systemInstruction,
}: MultimodalLiveAPIClientConnection & { tools?: Array<Tool | { googleSearch: {} } | { codeExecution: {} }>, voice?: string | null, systemInstruction?: { parts: Part[] } }): UseLiveAPIResults {
  const client = useMemo(
    () => new MultimodalLiveClient({ url, apiKey, tools }),
    [url, apiKey, tools],
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConfig>(() => ({
    model: "models/gemini-2.0-flash-exp",
    tools: tools || [],
    generationConfig: voice ? { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } : undefined,
    systemInstruction: systemInstruction,
  }));
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, []);

  useEffect(() => {
    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio);
    };
  }, [client, config]);

  useEffect(() => {
    const handleVoiceError = () => {
      setConfig(prevConfig => ({
        ...prevConfig,
        generationConfig: {
          ...(prevConfig.generationConfig || {}),
          speechConfig: {
            ...(prevConfig.generationConfig?.speechConfig || {}),
            voiceConfig: {
              ...(prevConfig.generationConfig?.speechConfig?.voiceConfig || {}),
              prebuiltVoiceConfig: {
                voiceName: "en-US-Neural2-D", // Fallback to a safe voice
              },
            },
          },
        },
      }));
      // Reconnect to apply the new voice config
      connect();
    };

    client.on('voiceError', handleVoiceError);

    return () => {
      client.off('voiceError', handleVoiceError);
    };
  }, [client, setConfig]);

  const connect = useCallback(async () => {
    console.log(config);
    if (!config) {
      throw new Error("config has not been set");
    }
    client.disconnect();
    await client.connect(config);
    setConnected(true);
  }, [client, setConnected, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  const setTools = useCallback((newTools: FunctionDeclaration[]) => {
    setConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        tools: newTools.length > 0 ? [{ functionDeclarations: newTools }] : [],
      };
      return updatedConfig;
    });
  }, [setConfig]);

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
    setTools,
  };
}

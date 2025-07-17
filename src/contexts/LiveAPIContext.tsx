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

import { createContext, FC, ReactNode, useContext, useState } from "react";
import { useLiveAPI, UseLiveAPIResults } from "../hooks/use-live-api";
import { FunctionDeclaration, Tool } from '@google/generative-ai';

interface LiveAPIContextResults extends UseLiveAPIResults {
  sourceDocument: string | null;
  setSourceDocument: (doc: string | null) => void;
  setTools: (tools: FunctionDeclaration[]) => void;
}

const LiveAPIContext = createContext<LiveAPIContextResults | undefined>(
  undefined
);

export type LiveAPIProviderProps = {
  children: ReactNode;
  url?: string;
  apiKey: string;
  tools?: Array<Tool | { googleSearch: {} } | { codeExecution: {} }>;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  url,
  apiKey,
  children,
  tools,
}) => {
  const liveAPI = useLiveAPI({ url, apiKey, tools });
  const [sourceDocument, setSourceDocument] = useState<string | null>(null);

  return (
    <LiveAPIContext.Provider
      value={{ ...liveAPI, sourceDocument, setSourceDocument, setTools: liveAPI.setTools }}
    >
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error("useLiveAPIContext must be used wihin a LiveAPIProvider");
  }
  return context;
};

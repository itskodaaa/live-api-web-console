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

import { useEffect, useRef, useState, useMemo } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { QuizTool, declaration as quizToolDeclaration } from './components/quiz-tool/QuizTool';
import { declaration as graphToolDeclaration } from './components/altair/graph-tool';
import { Part } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error('set REACT_APP_GEMINI_API_KEY in .env');
}

const host = 'generativelanguage.googleapis.com';
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function AppContent() {
  const { setSourceDocument, sourceDocument, setConfig, client, connect } = useLiveAPIContext();
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [activeTool, setActiveTool] = useState<'quiz' | 'graph' | null>(null);

  useEffect(() => {
    const onToolCall = (toolCall: any) => {
      const quizFc = toolCall.functionCalls.find((fc: { name: string; }) => fc.name === quizToolDeclaration.name);
      const graphFc = toolCall.functionCalls.find((fc: { name: string; }) => fc.name === graphToolDeclaration.name);

      if (quizFc) {
        setActiveTool('quiz');
      } else if (graphFc) {
        setActiveTool('graph');
      } else {
        setActiveTool(null);
      }
    };

    client.on('toolcall', onToolCall);
    return () => {
      client.off('toolcall', onToolCall);
    };
  }, [client]);

  const systemInstructionParts = useMemo(() => {
    const parts: Part[] = [];
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get('name');

    let greeting = "You are Vozia, an interactive AI tutor speaking with the user.";
    if (userName) {
      greeting = `You are Vozia, an interactive AI tutor speaking with ${userName}. Always address ${userName} by their name in your responses.`;
    }
    parts.push({ text: `${greeting} Your persona is friendly, encouraging, patient, and knowledgeable, with a slightly enthusiastic tone. Do not be overly formal. Your primary goal is to help the user learn. Start by asking if the user is studying for something specific (like a test) or just wants to understand the topic better, so you can adjust your style. Keep your spoken responses relatively concise unless asked for more detail. Ask questions frequently to check the user's understanding and keep the session interactive. If the user interrupts, stop speaking immediately and listen. After explaining a concept or answering a question, offer a brief quiz question to reinforce learning. Then ask the user if they have more questions on that topic. When the user indicates they are satisfied with the current topic, ask if they want to discuss another topic or end the session. If they want to end, remind them to use the 'End Session' button.` });

    if (sourceDocument) {
      parts.push({ text: `A document has been provided via URL. You MUST use this document as your primary source of information for teaching, answering questions, generating quizzes, and creating graphs. DO NOT ask the user for content or to upload a document if a document has already been provided.` });
    }

    parts.push({ text: "You have access to several tools to assist the user. You should proactively use these tools when appropriate, without being explicitly asked. " +
      "1. `create_quiz`: This tool generates quizzes. When the user asks for a quiz, or if you determine that a quiz would be beneficial based on the conversation or provided document, you MUST call the `create_quiz` tool with the quiz data. Always offer a quiz question after explaining a concept or answering a question to reinforce learning. The quiz data should be an array of objects, each containing a 'question', 'answers' (an array of strings), and 'correct_answer_index' (the zero-based index of the correct answer). " +
      "2. `googleSearch`: Use this tool when you need to find information on the internet to answer a user's question or to gather more context. " +
      "3. `display_graph`: This tool displays a graph visualization. When the user asks to visualize data, create charts, or display graphs, you MUST call the `display_graph` tool with a Vega-Lite or Vega JSON specification. You should generate a relevant graph based on the conversation or provided data." });
    return parts;
  }, [sourceDocument]);

  useEffect(() => {
    setConfig(prevConfig => ({
      ...prevConfig,
      systemInstruction: { parts: systemInstructionParts },
    }));
  }, [systemInstructionParts, setConfig]);

  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoStart = urlParams.get('autoStart');
    if (autoStart === 'true' && !hasAutoStarted) {
      connect().then(() => {
        client.send({ text: 'Hello!' });
      });
      setHasAutoStarted(true);
    }
  }, [connect, client, hasAutoStarted]);

  return (
    <div className='App'>
      <div className='streaming-console'>
        {/* <SidePanel /> */}
        <main>
          <div className={cn('main-app-area', {
            'quiz-active': activeTool === 'quiz',
            'graph-active': activeTool === 'graph',
          })}>
            {/* APP goes here */}
            <Altair className={cn({ 'hidden': activeTool && activeTool !== 'graph' })} />
            <QuizTool className={cn({ 'hidden': activeTool && activeTool !== 'quiz' })} />
            <video
              className={cn('stream', {
                hidden: !videoRef.current || !videoStream,
              })}
              ref={videoRef}
              autoPlay
              playsInline
            />
          </div>

          <ControlTray
            videoRef={videoRef}
            supportsVideo={false}
            onVideoStreamChange={setVideoStream}
            enableEditingSettings={true}>
            {/* put your own buttons here */}
          </ControlTray>
        </main>
      </div>
    </div>
  );
}

function getVoiceFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('voice');
}

function App() {
  const urlVoice = getVoiceFromUrl();

  return (
    <LiveAPIProvider
      url={uri}
      apiKey={API_KEY}
      tools={[{ functionDeclarations: [quizToolDeclaration, graphToolDeclaration] }, { googleSearch: {} }]}
      voice={urlVoice}
    >
      <AppContent />
    </LiveAPIProvider>
  );
}

export default App;

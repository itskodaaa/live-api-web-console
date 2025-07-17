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

import { useEffect, useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { QuizTool, declaration as quizToolDeclaration } from './components/quiz-tool/QuizTool';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== 'string') {
  throw new Error('set REACT_APP_GEMINI_API_KEY in .env');
}

const host = 'generativelanguage.googleapis.com';
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function AppContent() {
  const { setSourceDocument } = useLiveAPIContext();
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fileUrl = urlParams.get('fileUrl');

    if (fileUrl) {
      fetch(fileUrl)
        .then((response) => response.text())
        .then((data) => {
          setSourceDocument(data);
        })
        .catch((error) => console.error('Error fetching file:', error));
    }
  }, [setSourceDocument]);

  return (
    <div className='App'>
      <div className='streaming-console'>
        {/* <SidePanel /> */}
        <main>
          <div className='main-app-area'>
            {/* APP goes here */}
            <Altair />
            <QuizTool />
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

function App() {
  return (
    <LiveAPIProvider url={uri} apiKey={API_KEY} tools={[{ functionDeclarations: [quizToolDeclaration] }, { googleSearch: {} }]}>
      <AppContent />
    </LiveAPIProvider>
  );
}

export default App;

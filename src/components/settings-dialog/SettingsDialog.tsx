import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FunctionDeclaration, FunctionDeclarationsTool, Tool } from '@google/generative-ai';
import './settings-dialog.scss';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { LiveConfig } from '../../multimodal-live-types';
import VoiceSelector from './VoiceSelector';
import ResponseModalitySelector from './ResponseModalitySelector';

const SettingsDialog = () => {
  const [name, setName] = useState('User');
  const [open, setOpen] = useState(true);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { config, setConfig, connected } = useLiveAPIContext();
  const functionDeclarations: FunctionDeclaration[] = useMemo(() => {
    if (!Array.isArray(config.tools)) {
      return [];
    }
    return (config.tools as Tool[])
      .filter((t: Tool): t is FunctionDeclarationsTool =>
        Array.isArray((t as any).functionDeclarations)
      )
      .map(t => t.functionDeclarations)
      .filter(fc => !!fc)
      .flat();
  }, [config]);

  const updateFunctionDescription = useCallback(
    (editedFdName: string, newDescription: string) => {
      const newConfig: LiveConfig = {
        ...config,
        tools:
          config.tools?.map(tool => {
            const fdTool = tool as FunctionDeclarationsTool;
            if (!Array.isArray(fdTool.functionDeclarations)) {
              return tool;
            }
            return {
              ...tool,
              functionDeclarations: fdTool.functionDeclarations.map(fd =>
                fd.name === editedFdName ? { ...fd, description: newDescription } : fd
              ),
            };
          }) || [],
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  const systemInstruction = useMemo(() => {
    let instructionText = `You are Vozia, an interactive AI tutor speaking with ${name}. Your persona is friendly, encouraging, patient, and knowledgeable, with a slightly enthusiastic tone. Do not be overly formal.
        Your primary goal is to help ${name} learn. Start by asking if ${name} is studying for something specific (like a test) or just wants to understand the topic better, so you can adjust your style. `;

    if (documentContent) {
      instructionText += `You have been provided with the following document content for context use to as the base of your teaching:
---
${documentContent}
---
Base your answers primarily on this text content and explicitly mention you are using the provided material. If no relevant information is found in the document, use your general knowledge. `;
    } else {
      instructionText += `If context from a document ${name} provided is available, base your answers primarily on that context and explicitly mention you are using the provided material. If no context is available or relevant, use your general knowledge. `;
    }

    instructionText += `Keep your spoken responses relatively concise unless asked for more detail. Ask questions frequently to check ${name}'s understanding and keep the session interactive.
        If ${name} interrupts, stop speaking immediately and listen.
        After explaining a concept or answering a question, offer a brief quiz question to reinforce learning. Then ask ${name} if they have more questions on that topic.
        When ${name} indicates they are satisfied with the current topic, ask if they want to discuss another topic or end the session. If they want to end, remind them to use the 'End Session' button.`;

    return instructionText;
  }, [name, documentContent]);

  useEffect(() => {
    const newConfig: LiveConfig = {
      ...config,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    };
    setConfig(newConfig);
  }, [systemInstruction, config, setConfig]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();

      reader.onload = e => {
        const content = e.target?.result as string | null;
        setDocumentContent(content);
      };

      reader.onerror = e => {
        console.error('Error reading file:', e);
        setDocumentContent(null);
        setSelectedFileName(null);
      };

      reader.readAsText(file);
    } else {
      setDocumentContent(null);
      setSelectedFileName(null);
    }
  }, []);

  return (
    <div className='settings-dialog'>
      <dialog className='dialog' open={open} style={{ display: open ? 'block' : 'none' }}>
        <div className={`dialog-container ${connected ? 'disabled' : ''}`}>
          <div className='dialog-header'>
            <h3>Settings</h3>
          </div>

          {connected && (
            <div className='connected-indicator'>
              <p>
                These settings can only be applied before connecting and will override other
                settings.
              </p>
            </div>
          )}

          <div className='name-input select-group'>
            <label htmlFor='name'>Your Name</label>
            <input
              id='name'
              type='text'
              className='name'
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={connected}
            />
          </div>

          <div className='mode-selectors'>
            {/* <ResponseModalitySelector /> */}
            <VoiceSelector />
          </div>

          <div className='document-input select-group'>
            <label htmlFor='document-upload'>Lecture Document</label>
            <input
              id='document-upload'
              type='file'
              accept='*/*'
              onChange={handleFileChange}
              disabled={connected}
              style={{ display: 'none' }}
            />
            <label htmlFor='document-upload' className='file-label'>
              {selectedFileName ? selectedFileName : 'Select File'}
            </label>
            {selectedFileName && !connected && (
              <button
                className='clear-file-button small'
                onClick={() => {
                  setDocumentContent(null);
                  setSelectedFileName(null);
                }}>
                Clear
              </button>
            )}
          </div>
          <button className='button' style={{ padding: '10px' }} onClick={() => setOpen(false)}>
            START SESSION
          </button>
          <p>click on the Play icon and greet the Ai to proceed with your session</p>
        </div>
      </dialog>
    </div>
  );
};

export default SettingsDialog;

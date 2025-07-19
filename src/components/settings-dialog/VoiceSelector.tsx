import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { LiveConfig, LiveGenerationConfig } from "../../multimodal-live-types";

const voiceOptions = [
  { value: "Puck", label: "Puck" },
  { value: "Charon", label: "Charon" },
  { value: "Kore", label: "Kore" },
  { value: "Fenrir", label: "Fenrir" },
  { value: "Aoede", label: "Aoede" },
];

function getVoiceFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('voice');
}

export default function VoiceSelector() {
  const { config, setConfig } = useLiveAPIContext();
  const urlVoice = getVoiceFromUrl();

  const getVoiceName = () =>
    config.generationConfig?.speechConfig?.voiceConfig?.prebuiltVoiceConfig
      ?.voiceName || "Zephyr";

  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(() => ({
    value: getVoiceName(),
    label: getVoiceName(),
  }));

  useEffect(() => {
    setSelectedOption({ value: getVoiceName(), label: getVoiceName() });
  }, [config.generationConfig?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName, urlVoice]);

  const updateConfig = useCallback(
    (voiceName: string) => {
      setConfig((prevConfig: LiveConfig): LiveConfig => {
        const newGenerationConfig: Partial<LiveGenerationConfig> = {
          ...(prevConfig.generationConfig || {}),
          responseModalities: prevConfig.generationConfig?.responseModalities || "text", // Ensure required property is present
          speechConfig: {
            ...(prevConfig.generationConfig?.speechConfig || {}),
            voiceConfig: {
              ...(prevConfig.generationConfig?.speechConfig?.voiceConfig || {}),
              prebuiltVoiceConfig: {
                ...(prevConfig.generationConfig?.speechConfig?.voiceConfig?.prebuiltVoiceConfig || {}),
                voiceName: voiceName,
              },
            },
          },
        };

        return {
          ...prevConfig,
          generationConfig: newGenerationConfig,
        };
      });
    },
    [setConfig]
  );

  return (
    <div className="select-group">
      <label htmlFor="voice-selector">Voice</label>
      <Select
        id="voice-selector"
        className="react-select"
        classNamePrefix="react-select"
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            background: "var(--Neutral-15)",
            color: "var(--Neutral-90)",
            minHeight: "33px",
            maxHeight: "33px",
            border: 0,
          }),
          option: (styles, { isFocused, isSelected }) => ({
            ...styles,
            backgroundColor: isFocused
              ? "var(--Neutral-30)"
              : isSelected
              ? "var(--Neutral-20)"
              : undefined,
          }),
        }}
        value={selectedOption}
        defaultValue={selectedOption}
        options={voiceOptions}
        onChange={(e) => {
          setSelectedOption(e);
          if (e) {
            updateConfig(e.value);
          }
        }}
        isDisabled={!!urlVoice}
      />
    </div>
  );
}

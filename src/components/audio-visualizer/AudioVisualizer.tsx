import React, { memo } from 'react';
import './audio-visualizer.scss';

interface AudioVisualizerProps {
  volume: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume }) => {
  const normalizedVolume = Math.min(Math.max(volume, 0), 1); // Normalize volume between 0 and 1

  return (
    <div className="audio-visualizer">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="bubble"
          style={{
            transform: `scale(${1 + normalizedVolume * 0.5})`,
            opacity: `${0.3 + normalizedVolume * 0.7}`,
          }}
        ></div>
      ))}
    </div>
  );
};

export default memo(AudioVisualizer);
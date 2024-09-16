import * as React from 'react';

import {ControlPosition} from '@vis.gl/react-google-maps';

export type ControlPanelProps = {
  position: ControlPosition;
  onControlPositionChange: (position: ControlPosition) => void;
};

function ControlPanel({position, onControlPositionChange}: ControlPanelProps) {
  const positionOptions: {key: string; value: ControlPosition}[] = [];

  for (const [p, v] of Object.entries(ControlPosition)) {
    positionOptions.push({key: p, value: v as ControlPosition});
  }

  return (
    <div className="control-panel">
      <p>controoooooool</p>
    </div>
  );
}

export default React.memo(ControlPanel);
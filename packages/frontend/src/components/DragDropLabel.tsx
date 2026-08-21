import { useState } from 'react';

interface Label {
  id: string;
  text: string;
  correctZoneId?: string;
}

interface DropZone {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface DragDropLabelProps {
  imageUrl: string;
  labels: Label[];
  zones: DropZone[];
  onComplete: (placedLabels: Record<string, string>) => void;
  onNext: () => void;
}

export const DragDropLabel: React.FC<DragDropLabelProps> = ({
  imageUrl,
  labels,
  zones,
  onComplete,
  onNext,
}) => {
  const [placedLabels, setPlacedLabels] = useState<Record<string, string>>({});
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleDragStart = (e: React.DragEvent, labelId: string) => {
    setDraggingLabel(labelId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnZone = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    if (draggingLabel) {
      setPlacedLabels({
        ...placedLabels,
        [draggingLabel]: zoneId,
      });

      // Check if all labels are placed
      if (Object.keys(placedLabels).length + 1 === labels.length) {
        setIsComplete(true);
        onComplete(placedLabels);
      }

      setDraggingLabel(null);
    }
  };

  const handleReset = () => {
    setPlacedLabels({});
    setIsComplete(false);
    setDraggingLabel(null);
  };

  const getLabelForZone = (zoneId: string) => {
    return Object.entries(placedLabels).find(([_, zone]) => zone === zoneId)?.[0];
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Drag and drop the labels onto their correct positions on the diagram.
        </p>
      </div>

      {/* Image Container with Drop Zones */}
      <div className="relative inline-block w-full bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt="Diagram"
          className="w-full h-auto display-block"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Drop Zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, zone.id)}
            className="absolute border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center bg-green-50 hover:bg-green-100 transition"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: '120px',
              height: '60px',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {getLabelForZone(zone.id) ? (
              <span className="text-xs font-semibold text-green-800 text-center px-2">
                {labels.find((l) => l.id === getLabelForZone(zone.id))?.text}
              </span>
            ) : (
              <span className="text-xs text-gray-500 text-center">{zone.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Draggable Labels */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Labels:</p>
        <div className="flex flex-wrap gap-3">
          {labels
            .filter((label) => !Object.keys(placedLabels).includes(label.id))
            .map((label) => (
              <div
                key={label.id}
                draggable
                onDragStart={(e) => handleDragStart(e, label.id)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg cursor-move transition shadow-md"
              >
                {label.text}
              </div>
            ))}
        </div>
      </div>

      {/* Placed Labels */}
      {Object.keys(placedLabels).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Placed: {Object.keys(placedLabels).length}/{labels.length}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${(Object.keys(placedLabels).length / labels.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Feedback */}
      {isComplete && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
          <p className="font-semibold">✓ Great job!</p>
          <p className="text-sm">You've correctly labeled the diagram.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 text-gray-700 hover:text-gray-900 font-semibold py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
        >
          Reset
        </button>
        {isComplete && (
          <button
            onClick={onNext}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

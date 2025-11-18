import React from "react";

export default function AudioPlayer({ 
  audioRef, 
  audioUrl, 
  onPlay,
  onPause,
  onDownload 
}) {
  return (
    <div className="mt-4">
      <label className="font-semibold">Generated Audio</label>
      <div className="mt-2">
        {audioUrl ? (
          <>
            <audio
              ref={audioRef}
              controls
              src={audioUrl}
              style={{ width: "100%" }}
              onPlay={onPlay}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={onPlay}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Play
              </button>
              <button
                onClick={onPause}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Pause
              </button>
            </div>
            <button
              onClick={onDownload}
              className="w-full mt-3 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition"
            >
              Download MP3
            </button>
          </>
        ) : (
          <div className="p-3 border rounded bg-gray-50">No audio yet</div>
        )}
      </div>
    </div>
  );
}

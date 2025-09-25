import { useCallback, useRef, useState } from 'react';
import { parseStatcastCsv, getRequiredColumns } from '../engine/parseCsv';
import { useViewerStore } from '../state/useStore';

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setData = useViewerStore((s) => s.setData);
  const setError = useViewerStore((s) => s.setError);
  const [isHover, setHover] = useState(false);
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return;
      const file = files[0];
      try {
        const result = await parseStatcastCsv(file);
        setData(result);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'CSVの読み込みに失敗しました');
      }
    },
    [setData, setError]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setHover(false);
      await handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(event.target.files);
    },
    [handleFiles]
  );

  const required = getRequiredColumns().join(', ');

  return (
    <section className="dropzone">
      <label
        htmlFor="csv-input"
        className={`dropzone__label ${isHover ? 'dropzone__label--hover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id="csv-input"
          type="file"
          accept=".csv"
          hidden
          onChange={onChange}
        />
        <p className="dropzone__headline">CSVをドラッグ&ドロップ、またはクリックして選択</p>
        <p className="dropzone__sub">必須列: {required}</p>
      </label>
    </section>
  );
}

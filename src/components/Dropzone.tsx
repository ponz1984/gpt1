import { useCallback, useRef, useState } from 'react';
import { parseCsvFile } from '../engine/parseCsv';
import { useStore } from '../state/useStore';
import styles from './Dropzone.module.css';

export const Dropzone = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadFromRows = useStore((state) => state.loadFromRows);
  const setError = useStore((state) => state.setError);
  const [isDragging, setIsDragging] = useState(false);

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return;
      const file = files[0];
      if (!file.name.endsWith('.csv')) {
        setError('CSVファイルを選択してください。');
        return;
      }
      try {
        const rows = await parseCsvFile(file);
        loadFromRows(rows);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'CSVの解析に失敗しました。');
      }
    },
    [loadFromRows, setError]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      onFiles(event.dataTransfer.files);
    },
    [onFiles]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFiles(event.target.files);
    },
    [onFiles]
  );

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept=".csv"
        onChange={handleChange}
      />
      <span>ここにCSVをドロップ、またはクリックして選択</span>
    </div>
  );
};

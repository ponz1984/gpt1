import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { useStore } from '../state/useStore';

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadFromCsv = useStore((state) => state.loadFromCsv);
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);
  const [isDragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('CSVファイルを選択してください。');
        return;
      }
      try {
        const text = await file.text();
        loadFromCsv(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ファイル読み込みに失敗しました。');
      }
    },
    [loadFromCsv, setError]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
  }, []);

  const triggerSelect = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const loadSample = useCallback(async () => {
    try {
      const response = await fetch('/fixtures/sample_statcast.csv');
      const text = await response.text();
      loadFromCsv(text);
    } catch (err) {
      setError('サンプルCSVの読み込みに失敗しました。');
    }
  }, [loadFromCsv, setError]);

  return (
    <div className={`dropzone${isDragging ? ' dragging' : ''}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
      />
      <div className="dropzone-content">
        <p>Statcast形式のCSVをここにドラッグ＆ドロップ（またはクリックして選択）</p>
        <div className="dropzone-actions">
          <button type="button" onClick={triggerSelect} className="control-button">
            ファイルを選択
          </button>
          <button type="button" onClick={loadSample} className="control-button ghost">
            サンプルCSVを読み込む
          </button>
        </div>
        <p className="dropzone-note">※ game_date, game_pk, at_bat_number, pitch_number など指定列が必要です。</p>
        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}

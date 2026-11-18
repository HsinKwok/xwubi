import { useRef, useState } from 'react';
import { Icon } from '../../components/icons';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

interface MediaUploadDropProps {
  canWrite: boolean;
  uploading: boolean;
  onFiles: (files: FileList | File[]) => void;
}

/** 拖拽/点选上传区域，拖拽态由组件自身维护 */
export function MediaUploadDrop({ canWrite, uploading, onFiles }: MediaUploadDropProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={['xw-media-drop', dragging ? 'is-dragging' : '', canWrite ? '' : 'is-disabled']
        .filter(Boolean)
        .join(' ')}
      onDragOver={(event) => {
        if (!canWrite) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (canWrite) onFiles(event.dataTransfer.files);
      }}
    >
      <span className="xw-media-drop__icon">
        <Icon name="image" size={22} />
      </span>
      <div className="xw-media-drop__text">
        <p className="xw-media-drop__title">
          {canWrite ? '拖拽图片到这里上传' : '当前角色只能浏览与复制图片地址'}
        </p>
        <p className="xw-media-drop__hint">
          {uploading ? '正在上传，请稍候…' : '也可以点击右侧按钮选择文件，支持多选'}
        </p>
      </div>
      {canWrite && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) onFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            className="xw-btn xw-btn--primary xw-btn--sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? '上传中…' : '选择图片'}
          </button>
        </>
      )}
    </div>
  );
}

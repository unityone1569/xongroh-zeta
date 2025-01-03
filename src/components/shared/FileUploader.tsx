import { useCallback, useState, useEffect } from 'react';
import { FileWithPath, useDropzone } from 'react-dropzone';
import { convertFileToUrl } from '@/lib/utils/utils';
import { Button } from '../ui/button';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

const getValidVideoUrl = (url: string | string[]): string => {
  if (typeof url === 'string' && url.length > 0) {
    return url;
  }
  if (Array.isArray(url) && url.length > 0) {
    return url[0];
  }
  return '';
};

type FileUploaderProps = {
  fieldChange: (files: File[]) => void;
  docUrl: string;
};

type SingleFileUploaderProps = {
  fieldChange: (file: File) => void; // Update to single File type
  docUrl: string;
};

const MAX_FILE_SIZE = 650 * 1024 * 1024; // 650MB
const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUploader = ({ fieldChange, docUrl }: FileUploaderProps) => {
  const [_file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState<string>(docUrl);
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [error, setError] = useState<string>(''); // Add this line

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      setError(''); // Clear any previous errors
      // Check if there are any files
      if (!acceptedFiles || acceptedFiles.length === 0) {
        return;
      }

      const selectedFile = acceptedFiles[0];

      // Check file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert('File is too large. Maximum size is 650 MB.');
        return;
      }

      setFile(acceptedFiles);
      fieldChange(acceptedFiles);
      const url = convertFileToUrl(selectedFile);
      setFileUrl(url);

      const type = selectedFile.type;
      if (type.startsWith('image/')) setMediaType('image');
      if (type.startsWith('audio/')) setMediaType('audio');
      if (type.startsWith('video/')) setMediaType('video');
    },
    [fieldChange]
  );

  useEffect(() => {
    if (docUrl) {
      getMediaTypeFromUrl(docUrl).then(setMediaType);
    }
  }, [docUrl]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/gif': ['.gif'],
      'audio/*': ['.mp3', '.wav', '.aac'],
      'video/*': ['.mp4', '.mov'],
    },
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 650 MB.');
      } else {
        setError(rejection.errors[0]?.message || 'Invalid file type');
      }
    },
  });

  const renderPreview = () => {
    switch (mediaType) {
      case 'image':
        return (
          <img src={fileUrl} alt="preview" className="file_uploader-img" />
        );
      case 'audio':
        return (
          <div className="w-full p-5">
            <AudioPlayer audioUrl={fileUrl} />
          </div>
        );
      case 'video':
        return (
          <div className="w-full p-5 h-60 md:h-96">
            <VideoPlayer videoUrl={getValidVideoUrl(fileUrl)} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      {...getRootProps()}
      className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer"
    >
      <input {...getInputProps()} className="cursor-pointer" />

      {fileUrl?.length > 0 ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            {renderPreview()}
          </div>
          {error && <p className="text-red text-sm mb-4">{error}</p>}
          <p className="file_uploader-label">Click or drag media to replace</p>
        </>
      ) : (
        <div className="file_uploader-box">
          <img
            src="/assets/icons/file-upload.svg"
            width={56}
            alt="file upload"
          />
          <h3 className="base-medium text-light-2 mb-2 mt-6">
            Drag media here
          </h3>
          <p className="text-light-4 small-regular mb-6">
            Images, Audio, Videos (max: 650 MB)
          </p>
          {error && <p className="text-red text-sm mb-4">{error}</p>}
          <Button type="button" className="shad-button_dark_4">
            Select from files
          </Button>
        </div>
      )}
    </div>
  );
};

const SingleFileUploader = ({
  fieldChange,
  docUrl,
}: SingleFileUploaderProps) => {
  const [_file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>(docUrl);
  const [error, setError] = useState<string>(''); // Add this line

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setError('');
      if (!acceptedFiles || acceptedFiles.length === 0) {
        return;
      }
      const selectedFile = acceptedFiles[0];

      // Check file size
      if (selectedFile.size > MAX_SINGLE_FILE_SIZE) {
        alert('File is too large. Maximum size is 10MB.');
        return;
      }

      setFile(selectedFile);
      fieldChange(selectedFile);
      setFileUrl(convertFileToUrl(selectedFile));
    },
    [fieldChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/gif': ['.gif'],
    },
    maxSize: MAX_SINGLE_FILE_SIZE, // Add maxSize option
    onDropRejected: (fileRejections) => {
      // Handle rejected files
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else {
        setError(rejection.errors[0]?.message || 'Invalid file type');
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer"
    >
      <input {...getInputProps()} className="cursor-pointer" />

      {fileUrl?.length && fileUrl?.length > 0 ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            <img src={fileUrl} alt="image" className="file_uploader-img" />
          </div>
          {error && <p className="text-red text-sm mb-4">{error}</p>}
          <p className="file_uploader-label">Click or drag media to replace</p>
        </>
      ) : (
        <div className="file_uploader-box ">
          <img
            src="/assets/icons/file-upload.svg"
            width={56}
            alt="file upload"
          />

          <h3 className="base-medium text-light-2 mb-2 mt-6">
            Drag media here
          </h3>
          <p className="text-light-4 small-regular mb-6">Images</p>
          {error && <p className="text-red text-sm mb-4">{error}</p>}
          <Button type="button" className="shad-button_dark_4">
            Select from files
          </Button>
        </div>
      )}
    </div>
  );
};

export { FileUploader, SingleFileUploader };

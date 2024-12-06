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

const FileUploader = ({ fieldChange, docUrl }: FileUploaderProps) => {
  const [_file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState<string>(docUrl);
  const [mediaType, setMediaType] = useState<string>('unknown');

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      setFile(acceptedFiles);
      fieldChange(acceptedFiles);
      const url = convertFileToUrl(acceptedFiles[0]);
      setFileUrl(url);
      
      const type = acceptedFiles[0].type;
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
      'image/*': ['.png', '.jpeg', '.jpg', '.gif'],
      'audio/*': ['.mp3', '.wav', '.aac'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
  });

  const renderPreview = () => {
    switch (mediaType) {
      case 'image':
        return (
          <img 
            src={fileUrl} 
            alt="preview" 
            className="file_uploader-img" 
          />
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
            Images, Audio, Videos
          </p>
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
  const [_file, setFile] = useState<File | null>(null); // Store a single file
  const [fileUrl, setFileUrl] = useState<string>(docUrl);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const selectedFile = acceptedFiles[0]; // Only take the first file
      setFile(selectedFile);
      fieldChange(selectedFile);
      setFileUrl(convertFileToUrl(selectedFile));
    },
    [fieldChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpeg', '.jpg', '.gif'],
      'audio/*': ['.mp3', '.wav', '.aac'],
      'video/*': ['.mp4', '.webm', '.mov'],
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
          <p className="text-light-4 small-regular mb-6">
            Images, Audio, Videos{' '}
          </p>

          <Button type="button" className="shad-button_dark_4">
            Select from files
          </Button>
        </div>
      )}
    </div>
  );
};

export { FileUploader, SingleFileUploader };

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

export function formatDateString(dateString: string = '') {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', options);

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formattedDate} at ${time}`;
}

//
export const multiFormatDateString = (timestamp: string = ''): string => {
  const timestampNum = Math.round(new Date(timestamp).getTime() / 1000);
  const date: Date = new Date(timestampNum * 1000);
  const now: Date = new Date();

  const diff: number = now.getTime() - date.getTime();
  const diffInSeconds: number = diff / 1000;
  const diffInMinutes: number = diffInSeconds / 60;
  const diffInHours: number = diffInMinutes / 60;
  const diffInDays: number = diffInHours / 24;

  switch (true) {
    case Math.floor(diffInDays) >= 30:
      return formatDateString(timestamp);
    case Math.floor(diffInDays) === 1:
      return `${Math.floor(diffInDays)} day ago`;
    case Math.floor(diffInDays) > 1 && diffInDays < 30:
      return `${Math.floor(diffInDays)} days ago`;
    case Math.floor(diffInHours) >= 1:
      return `${Math.floor(diffInHours)} hrs ago`;
    case Math.floor(diffInMinutes) >= 1:
      return `${Math.floor(diffInMinutes)} mins ago`;
    default:
      return 'Just now';
  }
};

export const multiFormatDateStringNoTime = (timestamp: string = ''): string => {
  const timestampNum = Math.round(new Date(timestamp).getTime() / 1000);
  const date: Date = new Date(timestampNum * 1000);
  const now: Date = new Date();

  const diff: number = now.getTime() - date.getTime();
  const diffInSeconds: number = diff / 1000;
  const diffInMinutes: number = diffInSeconds / 60;
  const diffInHours: number = diffInMinutes / 60;
  const diffInDays: number = diffInHours / 24;

  switch (true) {
    case Math.floor(diffInDays) >= 30:
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      return new Date(timestamp).toLocaleDateString('en-US', options);
    case Math.floor(diffInDays) === 1:
      return `${Math.floor(diffInDays)} day ago`;
    case Math.floor(diffInDays) > 1 && diffInDays < 30:
      return `${Math.floor(diffInDays)} days ago`;
    case Math.floor(diffInHours) >= 1:
      return `${Math.floor(diffInHours)} hrs ago`;
    case Math.floor(diffInMinutes) >= 1:
      return `${Math.floor(diffInMinutes)} mins ago`;
    default:
      return 'Just now';
  }
};

export const checkIsLiked = (likeList: string[], userId: string) => {
  return likeList.includes(userId);
};

export const updateMetaTags = (
  title: string,
  description: string,
  imageUrl: string,
  pageUrl: string
) => {
  // Open Graph
  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute('content', title);
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute('content', description);
  document
    .querySelector('meta[property="og:image"]')
    ?.setAttribute('content', imageUrl);
  document
    .querySelector('meta[property="og:url"]')
    ?.setAttribute('content', pageUrl);

  // Twitter
  document
    .querySelector('meta[name="twitter:title"]')
    ?.setAttribute('content', title);
  document
    .querySelector('meta[name="twitter:description"]')
    ?.setAttribute('content', description);
  document
    .querySelector('meta[name="twitter:image"]')
    ?.setAttribute('content', imageUrl);
};

export const formatShareDescription = (content: string | undefined): string => {
  if (!content) return 'Check out this creation on Xongroh!';

  // Split content into lines and take first 2
  const lines = content.split('\n').slice(0, 2);

  // Limit each line to 60 characters
  const truncatedLines = lines.map((line) =>
    line.length > 60 ? line.substring(0, 57) + '...' : line
  );

  return `Check out this creation on Xongroh!\n\n${truncatedLines.join(
    '\n'
  )}\n`;
};

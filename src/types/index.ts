export interface IContextType {
  user: IUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  checkAuthUser: () => Promise<boolean>;
  checkEmailVerification: () => Promise<boolean>;
  setUser: (user: IUser) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type INewCreation = {
  authorId: string;
  content: string;
  file: File[];
  tags?: string;
};
export type INewProject = {
  authorId: string;
  title: string;
  description: string;
  file: File[];
  links?: string | string[];
  tags?: string;
};

export type IUpdateCreation = {
  creationId: string;
  content: string;
  mediaId: string;
  mediaUrl: URL;
  file: File[];
  tags?: string;
};

export type IUpdateProject = {
  projectId: string;
  title: string;
  description: string;
  mediaId: string;
  mediaUrl: URL;
  file: File[];
  links?: string | string[];
  tags?: string;
};

export type IUser = {
  id: string;
  accountId: string;
  name: string;
  hometown: string;
  profession: string;
  username: string;
  email: string;
  dpUrl: string;
  coverUrl: string;
  bio: string;
};

export type INewUser = {
  name: string;
  hometown: string;
  email: string;
  password: string;
};

export type IUpdateUser = {
  userId: string;
  name?: string;
  username?: string;
  hometown?: string;
  profession?: string;
  bio?: string;
  about?: string;
  dpUrl?: URL;
  dpId?: string;
  coverUrl?: URL;
  coverId?: string;
  dpFile?: File;
  coverFile?: File;
};

export interface Conversation {
  participants: string[];
  participantsKey: string;
  lastMsgId?: string;
  isDeleted: string[];
}

export interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  conversationId: string;
  isDeleted: string[];
  isRead: boolean;
}

export interface EncryptedMessage extends Message {
  content: string; // Base64 encrypted content
}

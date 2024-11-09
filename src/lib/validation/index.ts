import { z } from 'zod';

export const SignUpFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(30, { message: 'Name must be at most 30 characters.' }),
  hometown: z
    .string()
    .min(2, { message: 'Hometown must be at least 2 characters.' })
    .max(30, { message: 'Hometown must be at most 30 characters.' }),
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
});

export const SignInValidation = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
});

export const PostValidation = z.object({
  content: z.string().min(5).max(5000),
  file: z.custom<File[]>(),
  tags: z.string(),
});

export const ProjectValidation = z.object({
  title: z.string().min(5).max(250),
  description: z.string().min(5).max(63206),
  file: z.array(
    z
      .instanceof(File)
      .refine(
        (file) =>
          [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/heif',
            'video/mp4',
            'video/mov',
            'video/avi',
            'video/wmv',
            'video/webm',
            'audio/mpeg',
            'audio/mp3',
            'audio/aac',
            'audio/wav',
            'audio/ogg',
            'audio/m4a',
          ].includes(file.type),
        { message: 'File must be a valid image, audio, or video format' }
      )
  ),
  links: z
    .union([
      z.array(z.string().url()).optional(), // Allow an empty array or an array of URLs
      z.string().url(), // Or a single URL string
    ])
    .optional(),

  tags: z.string(),
});

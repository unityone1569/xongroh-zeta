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
  content: z.string().min(5).max(63206),
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
  tags: z.string(),
});

export const ProjectValidation = z.object({
  title: z.string().min(5).max(250),
  description: z.string().min(5).max(9000),
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
    .string()
    .transform((str) => (str ? str.split(',').map((link) => link.trim()) : [])) // Convert non-empty input to array, otherwise empty array
    .refine(
      (arr) =>
        arr.every(
          (link) =>
            link === '' ||
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/\S*)?$/.test(link)
        ),
      {
        message:
          'Each link must be a valid URL, starting with http:// or https://',
      }
    )
    .optional(),

  tags: z.string(),
});

export const ProfileValidation = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(65)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  profession: z.string().max(65).optional(),
  hometown: z.string().max(65).optional(),
  bio: z.string().max(150).optional(),
  about: z.string().max(251).optional(),
  dpFile: z
    .instanceof(File)
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ].includes(file.type),
      { message: 'Invalid image type' }
    )
    .optional(),
  coverFile: z
    .instanceof(File)
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ].includes(file.type),
      { message: 'Invalid image type' }
    )
    .optional(),
});

export const ResetPasswordValidation = z.object({
  email: z.string().email(),
});

export const NewPasswordValidation = z.object({
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
});

import { z } from 'zod';

// Allowlist of legitimate email domains
const allowedEmailDomains = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'protonmail.com',
  'gmx.com',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
  'mail.com',
  // Add more domains as needed
];

export const SignUpFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(30, { message: 'Name should not exceed 30 characters.' }),
  hometown: z
    .string()
    .min(2, { message: 'Hometown must be at least 2 characters.' })
    .max(30, { message: 'Hometown should not exceed 30 characters.' }),
  email: z
    .string()
    .email({ message: 'Invalid email address.' })
    .refine(
      (email) => {
        const domain = email.split('@')[1];
        return allowedEmailDomains.includes(domain);
      },
      { message: 'Email must be from a valid provider (e.g., Gmail, Yahoo).' }
    ),
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
  file: z.array(z.instanceof(File)),
  tags: z.string(),
});

export const ProjectValidation = z.object({
  title: z.string().min(5).max(250),
  description: z.string().min(5).max(9000),
  file: z.array(z.instanceof(File)),
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
    .min(1, { message: 'Username should be at least 1 character.' })
    .max(64, { message: 'Username should not exceed 64 characters.' })
    .regex(
      /^(?!\.)(?!.*\.\.)(?!.*\.$)(?!.*\.\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/,
      { message: 'Invalid username format.' }
    )
    .optional(),
  profession: z.string().max(65).optional(),
  hometown: z.string().max(65).optional(),
  bio: z
    .string()
    .max(150, { message: 'Bio should not exceed 150 characters.' })
    .optional(),
  about: z
    .string()
    .max(350, { message: 'About should not exceed 350 characters.' })
    .optional(),
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

// Add type to validation schema
export const DiscussionValidation = z.object({
  content: z.string().min(1),
  file: z.array(z.any()),
  tags: z.string(),
  type: z.enum(['Discussion', 'Help', 'Collab']),
});

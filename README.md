# Xongroh - Creator Social Marketplace

## Overview

Xongroh is a social marketplace platform designed specifically for creators to showcase their work, build portfolios, and connect with other creators.

## Core Features

### User Management

- Email-based registration and authentication
- Profile creation and customization with:
  - Profile picture and cover image
  - Bio and about sections
  - Hometown and profession details
- Email verification system
- Password reset functionality

### Projects

- Create portfolio projects with:
  - Title and description
  - Media attachments (images, video, audio)
  - External links
  - Tags for categorization
- Edit and delete project capabilities
- Project statistics tracking (likes, views)
- Project sharing functionality

### Social Features

- Follow/Support other creators
- Like and save projects
- Comment and feedback system with:
  - Threaded replies
  - Rich text formatting
- Direct messaging with:
  - End-to-end encrypted messages
  - Read receipts
  - Media sharing

### Content Management

- Media upload support for:
  - Images
  - Videos
  - Audio files
- Content moderation capabilities
- Content reporting system

## Technical Specifications

### Frontend

- Built with React + TypeScript
- Uses TanStack Query for data fetching
- Tailwind CSS for styling
- Form handling with React Hook Form + Zod validation

### Backend (Appwrite)

- Authentication services
- Database collections for:
  - Users/Creators
  - Projects
  - Comments/Feedback
  - Messages
  - Notifications
- Storage buckets for media files
- Functions for permission management

### Security Features

- End-to-end encrypted messaging
- Secure file storage
- Role-based access control
- Email verification
- Password recovery system

## Deployment

- Web-based platform
- Progressive Web App (PWA) capabilities
- Responsive design for mobile and desktop

This project demonstrates a modern full-stack application with robust social features focused on creator empowerment and portfolio showcasing.

Project Overview
Develop a real-time messaging application similar to Slack, enabling seamless communication and collaboration for teams. The MVP will support user authentication, real-time messaging, channel organization, file sharing, threaded conversations, and administrative controls using Spring Boot, React, Postgres, and Clerk for authentication. The application features a unique Unix-terminal inspired interface that provides a familiar environment for developers while maintaining modern usability.

User Roles & Core Workflows

Admin
Mute users to prevent message sending in channels.
Admin
Delete users' messages to maintain content quality.
Admin
Delete user-created channels to manage workspace structure.
Regular User
Authenticate securely to access the messaging platform.
Regular User
Send and receive real-time messages within channels.
Regular User
Create, join, and organize channels and direct messages.
Regular User
Share and search for files within channels.
Regular User
Participate in threaded conversations for organized discussions.
Regular User
React to messages with emojis for quick feedback.
Technical Foundation

Data Models

User
id (UUID), username (String), email (String), role (Enum: ADMIN, USER), created_at (Timestamp)
Relationships: One-to-Many with Message, One-to-Many with Channel (as creator)
Channel
id (UUID), name (String), is_direct_message (Boolean), created_by (UUID referencing User), created_at (Timestamp)
Relationships: Many-to-Many with User through ChannelMembership, One-to-Many with Message
ChannelMembership
id (UUID), user_id (UUID referencing User), channel_id (UUID referencing Channel), joined_at (Timestamp)
Relationships: Many-to-One with User, Many-to-One with Channel
Message
id (UUID), content (Text), created_by (UUID referencing User), channel_id (UUID referencing Channel), parent_message_id (UUID referencing Message, nullable), created_at (Timestamp)
Relationships: Many-to-One with User, Many-to-One with Channel, Self-referential Many-to-One for threading
Reaction
id (UUID), emoji (String), user_id (UUID referencing User), message_id (UUID referencing Message), created_at (Timestamp)
Relationships: Many-to-One with User, Many-to-One with Message
File
id (UUID), file_url (String), uploaded_by (UUID referencing User), channel_id (UUID referencing Channel), filename (String), uploaded_at (Timestamp)
Relationships: Many-to-One with User, Many-to-One with Channel
API Endpoints

User Routes
GET /api/users (Admin)
GET /api/users/{id} (Admin, Self)
PUT /api/users/{id} (Admin, Self)
DELETE /api/users/{id} (Admin)
Channel Routes
GET /api/channels (Authenticated)
POST /api/channels (Authenticated)
GET /api/channels/{id} (Channel Members)
PUT /api/channels/{id} (Creator, Admin)
DELETE /api/channels/{id} (Creator, Admin)
Channel Membership Routes
GET /api/channels/{id}/members (Channel Members)
POST /api/channels/{id}/members (Creator, Admin)
DELETE /api/channels/{id}/members/{userId} (Creator, Admin)
Message Routes
GET /api/channels/{channelId}/messages (Channel Members)
POST /api/channels/{channelId}/messages (Channel Members)
DELETE /api/messages/{id} (Creator, Admin)
Reaction Routes
POST /api/messages/{messageId}/reactions (Authenticated)
DELETE /api/messages/{messageId}/reactions/{reactionId} (Reaction Owner)
File Routes
GET /api/channels/{channelId}/files (Channel Members)
POST /api/channels/{channelId}/files (Channel Members)
DELETE /api/files/{id} (Uploader, Admin)
Admin Routes
POST /api/admin/mute/{userId} (Admin)
POST /api/admin/unmute/{userId} (Admin)
DELETE /api/admin/messages/{id} (Admin)
DELETE /api/admin/channels/{id} (Admin)
Key Components

Authentication Pages
LoginPage, RegisterPage
Main Application Layout
AppLayout with Sidebar, Header, MainContent
ChannelList, UserList, SearchBar, UserProfile
ChannelView with MessageList, MessageInput, ThreadView
NotificationsPanel
Admin Dashboard
AdminPanel with UserManagement, ChannelManagement, ModerationTools
UserList, ChannelList, MessageModeration
Common Components
Modal, Notification, FileUploader, ReactionButton, MessageItem
MVP Launch Requirements

Implement user authentication and role-based authorization using Clerk and Spring Security.
Develop API endpoints for user management, channel operations, messaging, reactions, and file sharing.
Design and build the React frontend with core components including Sidebar, ChannelView, and AdminDashboard.
Set up WebSocket connections for real-time messaging and notifications.
Ensure secure file upload and retrieval with proper access controls.
Enable admins to mute users, delete messages, and delete channels through the admin interface.
Implement real-time updates for messages, reactions, and channel changes.
Conduct thorough testing of authentication flows, permissions, and real-time features.
Deploy the application with a scalable Postgres database and robust backend infrastructure.

Design System & Interface Guidelines

Color Palette
- Primary Green (#6edb71): Used for active elements, prompts, and success states
- Content Blue (#b8cceb): Main text content
- Secondary Gray-Blue (#9ba8b9): Secondary text and inactive elements
- Warning Red (#db6e7a): Destructive actions and warnings
- Accent Blue (#6e8adb): Special elements and highlights
- Terminal Black (#1a1b1e): Background
- Terminal Gray (#2a2b2e): Secondary background and hover states

Terminal-Like Interface Elements
- Command Prompts: Each major section starts with "$ command" (e.g., "$ ls ./channels/")
- Action Buttons: Enclosed in square brackets (e.g., [enter], [esc], [mkdir])
- Navigation: Uses Unix-like commands (cd, ls, mkdir, touch, rm)
- Input Fields: Styled as terminal inputs with command context
- Destructive Actions: Require explicit command confirmation (e.g., rm -rf)

Command Patterns
- Channel Navigation: "$ ls ./channels/" for listing channels
- User Information: "$ whoami => username" in navbar
- Channel Creation: "$ cd ./channels/" followed by "$ touch channel_name"
- Channel Deletion: "$ rm -rf channel_name" with confirmation
- Error Messages: Unix-style (e.g., "touch: cannot create channel 'name': File exists")

Interactive Elements
- Buttons: Use square brackets with hover states
- Inputs: Terminal-style with focused border in primary green
- Modals: Terminal window styling with command sequence context
- Confirmations: Require exact command retyping for destructive actions

Channel Organization
- Channels are treated as files/directories in a Unix-like system
- Hierarchical navigation using cd and ls commands
- Direct messages treated as private channels

Additional UI/UX Requirements
- Implement consistent Unix-like command patterns across all interactions
- Maintain terminal-inspired design system while ensuring modern usability
- Design error messages and confirmations following Unix conventions
- Create smooth transitions and hover states that enhance the terminal aesthetic
- Ensure all interactive elements follow the square bracket convention
- Implement command-based navigation patterns
- Design modals to show command context and history
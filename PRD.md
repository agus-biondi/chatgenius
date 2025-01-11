# ChatGenius: Terminal-Style Real-Time Messaging Platform

## Project Overview
ChatGenius is a real-time messaging platform that combines the familiarity of Unix-like terminal commands with modern real-time messaging capabilities. The application emphasizes modularity, extensibility, and test-driven development to ensure robust feature development without compromising existing functionality.

## Core Features

### Authentication & Security
- Secure user authentication through Clerk integration
- Role-based access control (Admin, Regular User)
- Session management and token-based security
- Real-time session tracking for presence management

### User Management
- User profile management with status text
- Automatic presence tracking (Online, Offline, Away)
- Activity-based status updates
- User search and discovery
- User preferences and settings

### Channel System
- Public and private channels
- Direct messaging between users
- Channel creation and deletion
- Channel membership management
- Channel search functionality
- Channel-specific permissions

### Messaging System
- Real-time message delivery
- Message threading
- Message reactions with emojis
- File attachments
- Message search across accessible channels
- Message editing and deletion
- Message history and pagination

### Terminal-Style Interface
- Unix-like command structure
- Channel navigation: `ls ./channels`
- User listing: `ls ./users`
- Channel creation: `mkdir #channel-name`
- Direct message: `dm @username`
- Message search: `grep "search term" ./channels/#general`
- File operations: `cat`, `touch`, `rm`

## Technical Architecture

### Data Models

#### User
```typescript
interface User {
    id: UUID;
    username: string;
    email: string;
    role: Role;
    status: {
        text: string;
        presence: PresenceStatus;
        lastActive: DateTime;
    };
    preferences: UserPreferences;
    createdAt: DateTime;
}
```

#### Channel
```typescript
interface Channel {
    id: UUID;
    name: string;
    type: ChannelType;
    createdBy: UUID;
    metadata: {
        description: string;
        isArchived: boolean;
        permissions: ChannelPermissions;
    };
    createdAt: DateTime;
}
```

#### Message
```typescript
interface Message {
    id: UUID;
    content: string;
    channelId: UUID;
    userId: UUID;
    parentId?: UUID;
    metadata: {
        edited: boolean;
        editedAt?: DateTime;
        attachments: Attachment[];
    };
    createdAt: DateTime;
}
```

#### Reaction
```typescript
interface Reaction {
    id: UUID;
    messageId: UUID;
    userId: UUID;
    emoji: string;
    createdAt: DateTime;
}
```

### API Structure

#### Core Modules
Each module is independent and follows clean architecture principles:
- Authentication Module
- User Management Module
- Channel Management Module
- Messaging Module
- Search Module
- File Management Module
- Presence Module

#### Module Structure
Each module contains:
- Controllers (REST endpoints)
- Services (Business logic)
- Repositories (Data access)
- DTOs (Data transfer objects)
- Domain Models
- Unit Tests
- Integration Tests

### Real-Time Architecture

#### Event System
```typescript
interface Event<T> {
    type: EventType;
    payload: T;
    metadata: {
        timestamp: DateTime;
        userId: UUID;
        correlationId: UUID;
    };
}
```

#### Event Types
- USER_PRESENCE_CHANGED
- MESSAGE_CREATED
- MESSAGE_UPDATED
- MESSAGE_DELETED
- REACTION_ADDED
- REACTION_REMOVED
- CHANNEL_CREATED
- CHANNEL_UPDATED
- CHANNEL_DELETED
- USER_TYPING

### Testing Strategy

#### Test Levels
1. Unit Tests
   - Service layer logic
   - Domain model behavior
   - Utility functions

2. Integration Tests
   - API endpoints
   - Database operations
   - Event handling

3. End-to-End Tests
   - User workflows
   - Real-time functionality
   - UI interactions

#### Test Coverage Requirements
- Minimum 85% code coverage
- 100% coverage for critical paths
- All public APIs must be tested
- Real-time events must have integration tests

## UI/UX Guidelines

### Terminal Style
- Dark theme with high contrast
- Monospace fonts
- Command-line prompts
- Square bracket buttons
- Unix-like error messages

### Command Patterns
```bash
# Channel Operations
ls ./channels                 # List all channels
cd ./channels/#general       # Enter channel
mkdir #new-channel          # Create channel
rm -rf #channel-name        # Delete channel

# User Operations
ls ./users                  # List all users
whoami                      # Current user info
status "Away for lunch"     # Set status
dm @username               # Start DM

# Message Operations
grep "search" ./channels    # Search messages
cat message-id             # View message details
react message-id :emoji:   # Add reaction
```

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Command auto-completion
- Command history

## Development Principles

### Modularity
- Independent feature modules
- Clear module boundaries
- Dependency injection
- Interface-based design

### Extensibility
- Plugin architecture
- Event-driven design
- Feature flags
- Configuration management

### Code Quality
- TDD approach
- Clean architecture
- SOLID principles
- Code review process
- Automated testing

### Performance
- Message pagination
- Lazy loading
- Caching strategy
- Real-time optimizations

## Security Requirements

### Authentication
- Clerk integration
- JWT token management
- Session handling
- CSRF protection

### Authorization
- Role-based access
- Resource-level permissions
- Rate limiting
- Input validation

### Data Protection
- Data encryption
- Secure file storage
- PII handling
- Audit logging

## Deployment Strategy

### Infrastructure
- Containerized deployment
- PostgreSQL database
- Redis for caching
- S3 for file storage

### Monitoring
- Application metrics
- Error tracking
- Performance monitoring
- User analytics

### Scalability
- Horizontal scaling
- Load balancing
- Database sharding
- Caching strategy
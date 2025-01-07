# ChatGenius API Documentation

## Base URL
All endpoints are prefixed with `/api`

## Authentication
All endpoints require the `X-User-ID` header.

## Common Headers
All endpoints require:
- `X-User-ID`: String - User's unique identifier (required)

## Endpoints

### Channels

#### Create Channel
```http
POST /api/channels
```
**Headers**:
- `X-User-ID`: Creator's user ID
**Request Body**:
```json
{
    "name": "string",
    "isDirectMessage": false,
    "memberIds": ["string"]
}
```
**Response**: `201 Created`
```json
{
    "id": "uuid",
    "name": "string",
    "isDirectMessage": false,
    "createdById": "string",
    "createdByUsername": "string",
    "createdAt": "datetime",
    "members": [
        {
            "userId": "string",
            "username": "string",
            "joinedAt": "datetime"
        }
    ],
    "messageCount": "number",
    "fileCount": "number"
}
```

#### Create or Get Direct Message Channel
```http
POST /api/channels/dm/{otherUserId}
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "id": "uuid",
    "name": "string",
    "isDirectMessage": true,
    "createdById": "string",
    "createdByUsername": "string",
    "createdAt": "datetime",
    "members": [
        {
            "userId": "string",
            "username": "string",
            "joinedAt": "datetime"
        }
    ],
    "messageCount": "number",
    "fileCount": "number"
}
```

#### Get Channel
```http
GET /api/channels/{channelId}
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "id": "uuid",
    "name": "string",
    "isDirectMessage": false,
    "createdById": "string",
    "createdByUsername": "string",
    "createdAt": "datetime",
    "members": [
        {
            "userId": "string",
            "username": "string",
            "joinedAt": "datetime"
        }
    ],
    "messageCount": "number",
    "fileCount": "number"
}
```

#### Get User Channels
```http
GET /api/channels?search=optional&page=0&size=20
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "content": [
        {
            "id": "uuid",
            "name": "string",
            "isDirectMessage": false,
            "createdById": "string",
            "createdByUsername": "string",
            "createdAt": "datetime",
            "members": [
                {
                    "userId": "string",
                    "username": "string",
                    "joinedAt": "datetime"
                }
            ],
            "messageCount": "number",
            "fileCount": "number"
        }
    ],
    "totalPages": "number",
    "totalElements": "number"
}
```

#### Add Member
```http
POST /api/channels/{channelId}/members/{memberId}
```
**Headers**:
- `X-User-ID`: User ID with permission
**Response**: `200 OK`

#### Remove Member
```http
DELETE /api/channels/{channelId}/members/{memberId}
```
**Headers**:
- `X-User-ID`: User ID with permission
**Response**: `200 OK`

#### Delete Channel
```http
DELETE /api/channels/{channelId}
```
**Headers**:
- `X-User-ID`: User ID with permission
**Response**: `204 No Content`

### Messages

#### Create Message
```http
POST /api/messages
```
**Headers**:
- `X-User-ID`: Creator's user ID
**Request Body**:
```json
{
    "channelId": "uuid",
    "content": "string",
    "parentMessageId": "uuid"
}
```
**Response**: `200 OK`
```json
{
    "id": "uuid",
    "content": "string",
    "channelId": "uuid",
    "createdById": "string",
    "createdByUsername": "string",
    "createdAt": "datetime",
    "parentMessageId": "uuid",
    "replyCount": "number",
    "reactions": []
}
```

#### Get Channel Messages
```http
GET /api/messages/channel/{channelId}?page=0&size=20
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "content": [
        {
            "id": "uuid",
            "content": "string",
            "channelId": "uuid",
            "createdById": "string",
            "createdByUsername": "string",
            "createdAt": "datetime",
            "parentMessageId": "uuid",
            "replyCount": "number",
            "reactions": []
        }
    ],
    "totalPages": "number",
    "totalElements": "number"
}
```

#### Get Thread Messages
```http
GET /api/messages/thread/{parentMessageId}?page=0&size=20
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "content": [
        {
            "id": "uuid",
            "content": "string",
            "channelId": "uuid",
            "createdById": "string",
            "createdByUsername": "string",
            "createdAt": "datetime",
            "parentMessageId": "uuid",
            "replyCount": "number",
            "reactions": []
        }
    ],
    "totalPages": "number",
    "totalElements": "number"
}
```

#### Update Message
```http
PUT /api/messages/{messageId}
```
**Headers**:
- `X-User-ID`: Message creator's user ID
**Request Body**:
```json
{
    "channelId": "uuid",
    "content": "string",
    "parentMessageId": "uuid"
}
```
**Response**: `200 OK`
```json
{
    "id": "uuid",
    "content": "string",
    "channelId": "uuid",
    "createdById": "string",
    "createdByUsername": "string",
    "createdAt": "datetime",
    "parentMessageId": "uuid",
    "replyCount": "number",
    "reactions": []
}
```

#### Delete Message
```http
DELETE /api/messages/{messageId}
```
**Headers**:
- `X-User-ID`: Message creator's user ID
**Response**: `204 No Content`

#### Search Messages
```http
GET /api/messages/search?channelId=uuid&query=string&page=0&size=20
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "content": [
        {
            "id": "uuid",
            "content": "string",
            "channelId": "uuid",
            "createdById": "string",
            "createdByUsername": "string",
            "createdAt": "datetime",
            "parentMessageId": "uuid",
            "replyCount": "number",
            "reactions": []
        }
    ],
    "totalPages": "number",
    "totalElements": "number"
}
```

### Reactions

#### Add Reaction
```http
POST /api/messages/{messageId}/reactions
```
**Headers**:
- `X-User-ID`: User ID
**Request Body**:
```json
{
    "emoji": "string"
}
```
**Response**: `200 OK`
```json
{
    "id": "uuid",
    "emoji": "string",
    "userId": "string",
    "username": "string",
    "createdAt": "datetime"
}
```

#### Remove Reaction
```http
DELETE /api/messages/{messageId}/reactions/{reactionId}
```
**Headers**:
- `X-User-ID`: Reaction creator's user ID
**Response**: `204 No Content`

#### Get Message Reactions
```http
GET /api/messages/{messageId}/reactions
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
[
    {
        "id": "uuid",
        "emoji": "string",
        "userId": "string",
        "username": "string",
        "createdAt": "datetime"
    }
]
```

### Files

#### Upload File
```http
POST /api/files
```
**Headers**:
- `X-User-ID`: Uploader's user ID
**Content-Type**: `multipart/form-data`
**Form Data**:
- `file`: File to upload
- `channelId`: UUID of the channel
**Response**: `200 OK`
```json
{
    "id": "uuid",
    "filename": "string",
    "fileUrl": "string",
    "uploadedById": "string",
    "uploadedByUsername": "string",
    "channelId": "uuid",
    "uploadedAt": "datetime"
}
```

#### Get Channel Files
```http
GET /api/files/channel/{channelId}?page=0&size=20
```
**Headers**:
- `X-User-ID`: User ID
**Response**: `200 OK`
```json
{
    "content": [
        {
            "id": "uuid",
            "filename": "string",
            "fileUrl": "string",
            "uploadedById": "string",
            "uploadedByUsername": "string",
            "channelId": "uuid",
            "uploadedAt": "datetime"
        }
    ],
    "totalPages": "number",
    "totalElements": "number"
}
```

#### Delete File
```http
DELETE /api/files/{fileId}
```
**Headers**:
- `X-User-ID`: File uploader's user ID
**Response**: `204 No Content` 
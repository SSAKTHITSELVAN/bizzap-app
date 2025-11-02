# ⭐ Expo Router v3 root
├── (app)/                    # ⭐ Main app section (protected routes)
│   ├── _layout.js           # ⭐ Main app layout (with navbar)
│   ├── dashboard/           # ⭐ Tab group for main sections
│   │   ├── _layout.js       # ⭐ Tab navigator
│   │   └── index.js          # → /index page
│   ├── search/              # ⭐ Search section
│   │   ├── _layout.js       # ⭐ Search layout
│   │   └── index.js         # → /search
│   ├── Lead/              # ⭐ Lead section
│   │   ├── _layout.js       # ⭐ Lead layout
│   │   └── index.js         # → /lead
│   │   └── subscriprition.js# → /subscriprition
│   ├── bizzapai/              # ⭐ bizzapai section
│   │   ├── _layout.js       # ⭐ bizzapai layout
│   │   └── index.js         # → /bizzapai
│   │   └── create-post.tsx  # →/create posts manually
│   ├── profile/             # ⭐ Profile section  
│   │   ├── _layout.js       # ⭐ Profile layout
│   │   ├── accounts-center.tsx     # → /profile
│   │   ├── index.js           # → /settings screen
│   │   ├── my_lead.js         # → /lead management
│   │   └── saved.js           # → /profile/company
│   │   └── payment_history.js # → /payment history
│   └── chat/                # ⭐ Chat section
│       ├── _layout.js       # ⭐ Chat layout
│       └── index.js         # → /list my chats
│       └── [companyId].tsx  # → /particular chat
├── (auth)/                  # ⭐ Auth section (no navbar)
│   ├── _layout.js           # ⭐ Auth layout (no navbar)
│   ├── login.js             # → /login
│   └── registration.js      # → /registration
├── _layout.js               # ⭐ Root layout (handles auth state)
└── index.js                 # → / (splash/redirect)

============================
"

│   └── chat/                # ⭐ Chat section
│       ├── _layout.js       # ⭐ Chat layout
│       └── index.js         # → /list my chats
│       └── [companyId].tsx  # → /particular chat

"

==============================

The the working UI, for chat application like the instagam like UI.

"Curl

curl -X 'GET' \
  'http://localhost:3000/followers/followers' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY'

Request URL

http://localhost:3000/followers/followers

Server response

CodeDetails200

Response body

Download

{
  "statusCode": 200,
  "status": "success",
  "message": "Followers retrieved successfully",
  "data": [
    {
      "id": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
      "phoneNumber": "+919361802549",
      "gstNumber": "22AAAXX0000A1Z5",
      "companyName": "kkkkk",
      "logo": "company-logos/086cbecf-2153-4570-b400-c68a0c3aaf6b.jpg",
      "address": "gggggggggggggggg",
      "description": "ggggggggggggggg",
      "category": "rrrrrrrrrrrr",
      "referralCode": "2BCD448F",
      "leadQuota": 10,
      "consumedLeads": 0,
      "postingQuota": 30,
      "postedLeads": 1,
      "currentTier": "FREEMIUM",
      "hasVerifiedBadge": false,
      "isDeleted": false,
      "followersCount": 1,
      "createdAt": "2025-10-29T08:18:29.036Z",
      "lastLoginDate": null,
      "updatedAt": "2025-10-29T09:32:02.531Z",
      "userName": "llllllllll",
      "userPhoto": "user-photos/e35c33a4-2ae6-46da-a2cc-cc7fe2216760.png",
      "coverImage": "cover-images/be2124a3-9fdb-471f-89f6-e2c4283b726e.jpg",
      "registeredAddress": null,
      "about": null,
      "operationalAddress": null
    }
  ],
  "errors": null
}"
=========> to start new chats show all their followers to start.only.
==========================
for chat management
===========
Curl

curl -X 'GET' \
  'http://localhost:3000/chat/conversations' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY'
Request URL
http://localhost:3000/chat/conversations
Server response
Code	Details
200	
Response body
Download
{
  "statusCode": 200,
  "status": "success",
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "partnerId": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
      "partner": {
        "id": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
        "companyName": "kkkkk",
        "phoneNumber": "+919361802549",
        "logo": "company-logos/086cbecf-2153-4570-b400-c68a0c3aaf6b.jpg"
      },
      "lastMessage": "Hello, I saw your lead and would like to discuss it further.",
      "lastMessageAt": "2025-10-31T04:43:14.562Z",
      "messageCount": 1,
      "unreadCount": 0
    }
  ],
  "errors": null
}
=====================
Curl

curl -X 'GET' \
  'http://localhost:3000/chat/history/e1368be2-5176-4bbd-9245-28fc93d6fb9b' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY'
Request URL
http://localhost:3000/chat/history/e1368be2-5176-4bbd-9245-28fc93d6fb9b
Server response
Code	Details
200	
Response body
Download
{
  "statusCode": 200,
  "status": "success",
  "message": "Chat history retrieved successfully",
  "data": [
    {
      "id": "367c989d-1999-43cc-b8af-32b2f6054ad1",
      "senderId": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
      "receiverId": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
      "message": "Hello, I saw your lead and would like to discuss it further.",
      "messageType": "text",
      "fileName": "document.pdf",
      "fileUrl": null,
      "fileSize": null,
      "mimeType": null,
      "thumbnailUrl": null,
      "isEdited": false,
      "isDeleted": false,
      "isRead": false,
      "createdAt": "2025-10-31T04:43:14.562Z",
      "updatedAt": "2025-10-31T04:43:14.562Z",
      "sender": {
        "id": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
        "phoneNumber": "+919876543210",
        "gstNumber": "22AAAAA0000A1Z5",
        "companyName": "1 // Tech Solutions Pvt Ltd -",
        "logo": "https://example.com/logo.png",
        "address": "123 Business Street, Tech City, State 123456",
        "description": "Leading provider of technology solutions",
        "category": null,
        "referralCode": "2B04170D",
        "leadQuota": 10,
        "consumedLeads": 0,
        "postingQuota": 30,
        "postedLeads": 0,
        "currentTier": "FREEMIUM",
        "hasVerifiedBadge": false,
        "isDeleted": false,
        "followersCount": 1,
        "createdAt": "2025-10-28T03:57:30.255Z",
        "lastLoginDate": null,
        "updatedAt": "2025-10-29T09:52:29.867Z",
        "userName": "John Doe",
        "userPhoto": "https://example.com/user.jpg",
        "coverImage": null,
        "registeredAddress": null,
        "about": null,
        "operationalAddress": null
      },
      "receiver": {
        "id": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
        "phoneNumber": "+919361802549",
        "gstNumber": "22AAAXX0000A1Z5",
        "companyName": "kkkkk",
        "logo": "company-logos/086cbecf-2153-4570-b400-c68a0c3aaf6b.jpg",
        "address": "gggggggggggggggg",
        "description": "ggggggggggggggg",
        "category": "rrrrrrrrrrrr",
        "referralCode": "2BCD448F",
        "leadQuota": 10,
        "consumedLeads": 0,
        "postingQuota": 30,
        "postedLeads": 1,
        "currentTier": "FREEMIUM",
        "hasVerifiedBadge": false,
        "isDeleted": false,
        "followersCount": 1,
        "createdAt": "2025-10-29T08:18:29.036Z",
        "lastLoginDate": null,
        "updatedAt": "2025-10-29T09:32:02.531Z",
        "userName": "llllllllll",
        "userPhoto": "user-photos/e35c33a4-2ae6-46da-a2cc-cc7fe2216760.png",
        "coverImage": "cover-images/be2124a3-9fdb-471f-89f6-e2c4283b726e.jpg",
        "registeredAddress": null,
        "about": null,
        "operationalAddress": null
      }
    }
  ],
  "errors": null
}
======================
Curl

curl -X 'PATCH' \
  'http://localhost:3000/chat/message/367c989d-1999-43cc-b8af-32b2f6054ad1' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY' \
  -H 'Content-Type: application/json' \
  -d '{
  "message": "Hello, I saw your lead and would like to discuss the requirements.++++++++"
}'
Request URL
http://localhost:3000/chat/message/367c989d-1999-43cc-b8af-32b2f6054ad1
Server response
Code	Details
200	
Response body
Download
{
  "statusCode": 200,
  "status": "success",
  "message": "Message updated successfully",
  "data": {
    "id": "367c989d-1999-43cc-b8af-32b2f6054ad1",
    "senderId": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
    "receiverId": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
    "message": "Hello, I saw your lead and would like to discuss the requirements.++++++++",
    "messageType": "text",
    "fileName": "document.pdf",
    "fileUrl": null,
    "fileSize": null,
    "mimeType": null,
    "thumbnailUrl": null,
    "isEdited": true,
    "isDeleted": false,
    "isRead": false,
    "createdAt": "2025-10-31T04:43:14.562Z",
    "updatedAt": "2025-10-31T05:07:52.785Z",
    "sender": {
      "id": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
      "phoneNumber": "+919876543210",
      "gstNumber": "22AAAAA0000A1Z5",
      "companyName": "1 // Tech Solutions Pvt Ltd -",
      "logo": "https://example.com/logo.png",
      "address": "123 Business Street, Tech City, State 123456",
      "description": "Leading provider of technology solutions",
      "category": null,
      "referralCode": "2B04170D",
      "leadQuota": 10,
      "consumedLeads": 0,
      "postingQuota": 30,
      "postedLeads": 0,
      "currentTier": "FREEMIUM",
      "hasVerifiedBadge": false,
      "isDeleted": false,
      "followersCount": 1,
      "createdAt": "2025-10-28T03:57:30.255Z",
      "lastLoginDate": null,
      "updatedAt": "2025-10-29T09:52:29.867Z",
      "userName": "John Doe",
      "userPhoto": "https://example.com/user.jpg",
      "coverImage": null,
      "registeredAddress": null,
      "about": null,
      "operationalAddress": null
    },
    "receiver": {
      "id": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
      "phoneNumber": "+919361802549",
      "gstNumber": "22AAAXX0000A1Z5",
      "companyName": "kkkkk",
      "logo": "company-logos/086cbecf-2153-4570-b400-c68a0c3aaf6b.jpg",
      "address": "gggggggggggggggg",
      "description": "ggggggggggggggg",
      "category": "rrrrrrrrrrrr",
      "referralCode": "2BCD448F",
      "leadQuota": 10,
      "consumedLeads": 0,
      "postingQuota": 30,
      "postedLeads": 1,
      "currentTier": "FREEMIUM",
      "hasVerifiedBadge": false,
      "isDeleted": false,
      "followersCount": 1,
      "createdAt": "2025-10-29T08:18:29.036Z",
      "lastLoginDate": null,
      "updatedAt": "2025-10-29T09:32:02.531Z",
      "userName": "llllllllll",
      "userPhoto": "user-photos/e35c33a4-2ae6-46da-a2cc-cc7fe2216760.png",
      "coverImage": "cover-images/be2124a3-9fdb-471f-89f6-e2c4283b726e.jpg",
      "registeredAddress": null,
      "about": null,
      "operationalAddress": null
    }
  },
  "errors": null
}
=========================
Curl

curl -X 'POST' \
  'http://localhost:3000/chat/send' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY' \
  -H 'Content-Type: application/json' \
  -d '{
  "receiverId": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
  "message": "Hello, I saw your lead and would like to discuss it further.",
  "messageType": "text",
  "fileName": "document.pdf"
}'
Request URL
http://localhost:3000/chat/send
Server response
Code	Details
201	
Response body
Download
{
  "statusCode": 201,
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "id": "367c989d-1999-43cc-b8af-32b2f6054ad1",
    "senderId": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
    "receiverId": "e1368be2-5176-4bbd-9245-28fc93d6fb9b",
    "message": "Hello, I saw your lead and would like to discuss it further.",
    "messageType": "text",
    "fileName": "document.pdf",
    "fileUrl": null,
    "fileSize": null,
    "mimeType": null,
    "thumbnailUrl": null,
    "isEdited": false,
    "isDeleted": false,
    "isRead": false,
    "createdAt": "2025-10-31T04:43:14.562Z",
    "updatedAt": "2025-10-31T04:43:14.562Z"
  },
  "errors": null
}


Request body

multipart/form-data

File upload with optional message

file *

string($binary)

receiverId *

string($uuid)

UUID of the company receiving the file

message

string

Optional text message to accompany the file

Send empty value

ExecuteClear

Responses

Curl

curl -X 'POST' \
  'http://localhost:3000/chat/send-file' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@blueprint.jpg;type=image/jpeg' \
  -F 'receiverId=beb171c7-5ce5-46bd-bd53-1db2af01ce57' \
  -F 'message=about the multi media message'

Request URL

http://localhost:3000/chat/send-file

Server response

CodeDetails201

Response body

Download

{
  "statusCode": 201,
  "status": "success",
  "message": "File sent successfully",
  "data": {
    "id": "9d6c3631-5f55-4279-90e4-305819355a3d",
    "senderId": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
    "receiverId": "beb171c7-5ce5-46bd-bd53-1db2af01ce57",
    "message": "about the multi media message",
    "messageType": "image",
    "fileName": "blueprint.jpg",
    "fileUrl": "chat-files/8a6f920f-6f01-4da6-b37c-66e774d5c795.jpg",
    "fileSize": 42377,
    "mimeType": "image/jpeg",
    "thumbnailUrl": null,
    "isEdited": false,
    "isDeleted": false,
    "isRead": false,
    "createdAt": "2025-10-31T05:10:26.335Z",
    "updatedAt": "2025-10-31T05:10:26.335Z"
  },
  "errors": null
}
===============================
Curl

curl -X 'GET' \
  'http://localhost:3000/chat/unread-count' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY'
Request URL
http://localhost:3000/chat/unread-count
Server response
Code	Details
200	
Response body
Download
{
  "statusCode": 200,
  "status": "success",
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 1
  },
  "errors": null
}
==================================
Curl

curl -X 'DELETE' \
  'http://localhost:3000/chat/message/367c989d-1999-43cc-b8af-32b2f6054ad1' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJiZWIxNzFjNy01Y2U1LTQ2YmQtYmQ1My0xZGIyYWYwMWNlNTciLCJwaG9uZU51bWJlciI6Iis5MTk4NzY1NDMyMTAiLCJpYXQiOjE3NjE4ODM2MDgsImV4cCI6MTc2NDQ3NTYwOH0.tGY9JtaksA8x0kURkljBi8IAddO_KogQt0e56PsVPPY'
Request URL
http://localhost:3000/chat/message/367c989d-1999-43cc-b8af-32b2f6054ad1
Server response
Code	Details
200	
Response body
Download
{
  "statusCode": 200,
  "status": "success",
  "message": "Message deleted successfully",
  "data": {
    "message": "Message deleted successfully",
    "data": null
  },
  "errors": null
}
===============================
Use this endpoints to create the working chat like instagram with avaiable option, that must work well.
=============================
the layout for navbar is static to add the bottom padding to avoid the content overwriting.



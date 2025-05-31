# Conditions

Duration: 1 day

Acceptance criteria:

After work is completed, the solution should be deployed to the cloud with IaC

Provide link to public github repo with a solution

Solution should be buildable after git clone in 1-2 commands

Solution should be runnable with docker compose up from the root of the cloned repo after build is OK with `docker compose up`

There should be IaC tool the deploys/destroys solution to the cloud (cloud provided to participants) in 1-2 commands

All additional build & run instructions should be in ReadMe.MD in the root project folder.

New user should be able to register and use app after application is launched

# The task

In May 2025 Skype was shutdown. There are many alternatives, but Skype was very good for team chatting. Let’s create privately deployable Skype-like chatting tool (Yes we aware of existence of RocketChat, but we need a task for contest).

Functionality

User self-registration, just enter username and password (twice) and you are registered. All users are stored in RDBMS. No IDP or email verification in scope of this contest.

User has list of contacts, added by user name. On add contact should accept connection. I.e. when you add person to address book it is mutual. User can remove contact from address book

User can chat with his/her contacts, Chat history is persistent and searchable across all chats and groups

User can create group chats, up to 300 participants. Group chat history is also persistent and searchable. User can exit group chat. Owner can delete group chat and edit participant list

Chat message delivery should be reliable. If user set message and it reached server, it should be delivered to all counterparties.

Chat messages should be persistent, should not disappear if server (all servers) goes down.

UI is standard chat UI with chat list on the left and chat messages on the right.

User can send text messages with bold and italic font style and images.

User can post images (including group chats)



# Advanced features

Users can leave emotions for chat messages

Users can view contact info if contact is in his/her address book OR they are participants of the same chat.

Tool for performance tests

Persistent URL structure. Application should understand URLs pointing to user chats and group chats



# Nonfunctional requirements and implementation tips

Up to 500-1000 simultaneously connected users

Up to 50 messages per second (including group messages)

Images should be stored in cloud blob storage.

Advanced feature: Try to use websocket when it is possible. When websocket are not possible (e.g. user is behind some proxy – use regular pooling)

Message DB should be persistent with transactional integrity. To simplify things – use PostgreSQL as a message storage unless you believe you have better solution (do not use cloud only storages like DynamoDB).

Solution should cover both backend and frontend parts. Frontend implementation could be based on technology of your choice, could be SPA or server pages.

Because we have to compare and assess solutions, on backend use one of the common production grade runtimes (Java/.Net/Node+TS ..)

Do not overcomplicate deployment, deploying docker image to Fargate (or even EC2) is OK. Try to keep solution cloud agnostic (remember it should be runnable on local machine)

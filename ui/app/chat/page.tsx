export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  DAHack AI Chat
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chats
            </h2>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  General
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Welcome to the chat!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h3 className="text-lg font-medium mb-2">
                Welcome to DAHack AI Chat!
              </h3>
              <p>Registration successful. Start chatting with your team.</p>
            </div>
          </div>

          {/* Message input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

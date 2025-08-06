(function () {
  // 配置选项
  const script = document.currentScript;
  const config = {
    botName: script.getAttribute('data-name') || 'Corinna AI',
    initialMessage: script.getAttribute('data-message') || 'Hi there! How can I help you today?',
    primaryColor: script.getAttribute('data-color') || '#fb923c',
    position: script.getAttribute('data-position') || 'bottom-right',
    apiEndpoint: script.getAttribute('data-api') || '/api/chatbot'
  };

  // 创建样式
  const style = document.createElement('style');
  style.textContent = `
    .alis-chatbot-container * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .alis-chatbot-container {
      position: fixed;
      z-index: 9999;
      bottom: 20px;
      ${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
    }
    .alis-chat-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: none;
    }
    .alis-chat-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    .alis-chat-window {
      position: absolute;
      bottom: 80px;
      ${config.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
      width: 350px;
      height: 500px;
      max-height: 80vh;
      background: white;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .alis-chat-header {
      padding: 15px;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .alis-chat-title {
      font-weight: 500;
      margin: 0;
    }
    .alis-chat-controls {
      display: flex;
      gap: 10px;
    }
    .alis-chat-control {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .alis-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .alis-message {
      margin-bottom: 15px;
      max-width: 80%;
      padding: 10px 15px;
      border-radius: 15px;
      word-break: break-word;
    }
    .alis-message-bot {
      align-self: flex-start;
      background-color: ${config.primaryColor};
      color: white;
    }
    .alis-message-user {
      align-self: flex-end;
      background-color: #f1f5f9;
      color: #1e293b;
    }
    .alis-chat-form {
      display: flex;
      padding: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .alis-chat-input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #e2e8f0;
      border-right: none;
      border-radius: 4px 0 0 4px;
      outline: none;
    }
    .alis-chat-input:focus {
      border-color: ${config.primaryColor};
    }
    .alis-chat-send {
      padding: 10px 15px;
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
    }
    .alis-chat-minimized {
      height: 60px !important;
    }
  `;
  document.head.appendChild(style);

  // 创建DOM结构
  const container = document.createElement('div');
  container.className = 'alis-chatbot-container';

  // 聊天按钮
  const chatButton = document.createElement('button');
  chatButton.className = 'alis-chat-button';
  chatButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  chatButton.setAttribute('aria-label', 'Open chat');
  chatButton.setAttribute('title', 'Open chat');

  // 聊天窗口
  const chatWindow = document.createElement('div');
  chatWindow.className = 'alis-chat-window';
  chatWindow.style.display = 'none';

  // 聊天窗口头部
  const chatHeader = document.createElement('div');
  chatHeader.className = 'alis-chat-header';

  const chatTitle = document.createElement('h3');
  chatTitle.className = 'alis-chat-title';
  chatTitle.textContent = config.botName;

  const chatControls = document.createElement('div');
  chatControls.className = 'alis-chat-controls';

  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'alis-chat-control alis-minimize-button';
  minimizeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
  minimizeButton.setAttribute('aria-label', 'Minimize chat');
  minimizeButton.setAttribute('title', 'Minimize chat');

  const closeButton = document.createElement('button');
  closeButton.className = 'alis-chat-control alis-close-button';
  closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeButton.setAttribute('aria-label', 'Close chat');
  closeButton.setAttribute('title', 'Close chat');

  chatControls.appendChild(minimizeButton);
  chatControls.appendChild(closeButton);

  chatHeader.appendChild(chatTitle);
  chatHeader.appendChild(chatControls);

  // 聊天消息区域
  const chatMessages = document.createElement('div');
  chatMessages.className = 'alis-chat-messages';

  // 初始消息
  const initialMessageElement = document.createElement('div');
  initialMessageElement.className = 'alis-message alis-message-bot';
  initialMessageElement.textContent = config.initialMessage;
  chatMessages.appendChild(initialMessageElement);

  // 聊天输入区域
  const chatForm = document.createElement('div');
  chatForm.className = 'alis-chat-form';

  const chatInput = document.createElement('input');
  chatInput.className = 'alis-chat-input';
  chatInput.type = 'text';
  chatInput.placeholder = '输入消息...';

  const chatSend = document.createElement('button');
  chatSend.className = 'alis-chat-send';
  chatSend.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
  chatSend.setAttribute('aria-label', 'Send message');
  chatSend.setAttribute('title', 'Send message');

  chatForm.appendChild(chatInput);
  chatForm.appendChild(chatSend);

  // 组装聊天窗口
  chatWindow.appendChild(chatHeader);
  chatWindow.appendChild(chatMessages);
  chatWindow.appendChild(chatForm);

  // 添加到容器
  container.appendChild(chatButton);
  container.appendChild(chatWindow);

  // 添加到文档
  document.body.appendChild(container);

  // 事件处理
  let isOpen = false;
  let isMinimized = false;

  chatButton.addEventListener('click', () => {
    isOpen = true;
    chatWindow.style.display = 'flex';
    chatButton.style.display = 'none';
  });

  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = false;
    chatWindow.style.display = 'none';
    chatButton.style.display = 'flex';
  });

  minimizeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    isMinimized = !isMinimized;

    if (isMinimized) {
      chatWindow.classList.add('alis-chat-minimized');
      chatMessages.style.display = 'none';
      chatForm.style.display = 'none';
      minimizeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 15 12 8 19 15"></polyline></svg>';
    } else {
      chatWindow.classList.remove('alis-chat-minimized');
      chatMessages.style.display = 'flex';
      chatForm.style.display = 'flex';
      minimizeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    }
  });

  chatHeader.addEventListener('click', (e) => {
    if (e.target !== minimizeButton && e.target !== closeButton) {
      minimizeButton.click();
    }
  });

  // 发送消息功能
  chatForm.addEventListener('submit', handleSendMessage);
  chatSend.addEventListener('click', handleSendMessage);

  function handleSendMessage(e) {
    e.preventDefault();

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // 添加用户消息
    addMessage(userMessage, 'user');
    chatInput.value = '';

    // 发送到API并获取响应
    sendToAPI(userMessage)
      .then(response => {
        addMessage(response, 'bot');
      })
      .catch(error => {
        console.error('Error sending message:', error);
        addMessage('Sorry, I\'m having trouble connecting right now. Please try again later.', 'bot');
      });
  }

  function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `alis-message alis-message-${sender}`;
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendToAPI(message) {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();
    return data.message || "Sorry, I couldn't process your request.";
  }

  // 允许按回车键发送消息
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      chatSend.click();
    }
  });
})(); 
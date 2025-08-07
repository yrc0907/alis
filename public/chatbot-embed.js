(function () {
  'use strict';

  // 配置选项
  const script = document.currentScript;
  const config = {
    botName: script.getAttribute('data-name') || 'Corinna AI',
    initialMessage: script.getAttribute('data-message') || 'Hi there! How can I help you today?',
    primaryColor: script.getAttribute('data-color') || '#fb923c',
    position: script.getAttribute('data-position') || 'bottom-right',
    // 允许指定完整的API URL
    apiUrl: script.getAttribute('data-api-url'),
    // 网站特定配置
    websiteId: script.getAttribute('data-website-id'),
    apiKey: script.getAttribute('data-api-key'),
    // 提取脚本的来源域名，用于构建API URL
    scriptOrigin: (function () {
      // 获取脚本的src属性
      const scriptSrc = script.src;
      // 解析URL获取源
      try {
        const url = new URL(scriptSrc);
        return url.origin;
      } catch (e) {
        return '';
      }
    })()
  };

  // 确定API端点的完整URL
  const apiEndpoint = config.apiUrl || `${config.scriptOrigin}/api/website-chatbot`;

  // 客服通知API端点
  const customerServiceEndpoint = `${config.apiUrl ? new URL(config.apiUrl).origin : config.scriptOrigin}/api/customer-service`;

  // WebSocket连接
  let socket = null;

  // 聊天会话ID
  let sessionId = localStorage.getItem('alis_chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('alis_chat_session_id', sessionId);
  }

  let chatMessages; // 声明全局变量，用于在不同函数间共享
  let chatWindow; // 声明全局变量，用于在不同函数间共享

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    /* 聊天窗口样式 */
    .alis-chatbot-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      position: fixed;
      bottom: 20px;
      ${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      z-index: 9999;
      display: flex;
      flex-direction: column;
      transition: all 0.3s;
      pointer-events: auto;
    }
    
    /* 预约按钮样式 */
    .alis-chat-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s;
      align-self: ${config.position === 'bottom-left' ? 'flex-start' : 'flex-end'};
      border: none;
      padding: 0;
      margin: 0;
      outline: none;
      position: relative;
      z-index: 10000;
    }
    
    .alis-chat-btn:hover {
      transform: scale(1.05);
    }
    
    /* 确保按钮在点击前可见 */
    .alis-chat-btn svg {
      width: 24px;
      height: 24px;
      pointer-events: none;
    }
    
    .alis-chat-btn path {
      stroke: white;
      stroke-width: 2px;
    }
    
    /* 聊天窗口样式 */
    .alis-chat-window {
      width: 350px;
      height: 500px;
      border-radius: 10px;
      background-color: white;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      display: none;
    }
    
    .alis-chat-header {
      padding: 15px;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .alis-chat-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    
    .alis-chat-controls {
      display: flex;
      gap: 8px;
    }
    
    .alis-chat-control {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
    }
    
    /* 客服按钮样式 */
    .alis-customer-service-btn {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-right: 8px;
      transition: all 0.2s;
    }
    
    .alis-customer-service-btn:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    .alis-customer-service-icon {
      width: 14px;
      height: 14px;
      fill: white;
    }
    
    .alis-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .alis-message {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 18px;
      word-break: break-word;
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 14px;
    }
    
    .alis-message-user {
      background-color: ${config.primaryColor};
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 5px;
    }
    
    .alis-message-bot {
      background-color: #f0f0f0;
      color: #333;
      align-self: flex-start;
      border-bottom-left-radius: 5px;
    }
    
    .alis-chat-input {
      padding: 12px 15px;
      border-top: 1px solid #eee;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .alis-chat-input input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
    }
    
    .alis-chat-input input:focus {
      border-color: ${config.primaryColor};
      box-shadow: 0 0 0 1px ${config.primaryColor}25;
    }
    
    .alis-chat-send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    
    .alis-chat-send svg {
      width: 18px;
      height: 18px;
    }
    
    .alis-chat-send:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    /* 预约按钮 */
    .alis-appointment-btn {
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      margin-top: 10px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      display: inline-block;
      font-weight: 500;
    }
    
    .alis-appointment-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    /* 内嵌预约表单样式 - 终极零边距版 */
    .alis-embedded-appointment-form {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      margin-top: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .alis-embedded-appointment-form .alis-appointment-form-body {
      padding: 0;
    }
    
    .alis-embedded-appointment-form .alis-form-input {
      width: 100%;
      padding: 7px 10px; /* 进一步减少垂直内边距 */
      border: 1px solid #d1d5db;
      border-radius: 5px;
      font-size: 13px;
      margin-bottom: 5px; /* 进一步减少外边距 */
      box-sizing: border-box;
      background-color: #ffffff;
      transition: border-color 0.1s, box-shadow 0.1s;
    }
    
    .alis-embedded-appointment-form .alis-form-input::placeholder {
      color: #9ca3af;
    }
    
    .alis-embedded-appointment-form .alis-form-input:focus {
      border-color: ${config.primaryColor};
      outline: none;
      box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.2);
    }
    
    .alis-embedded-appointment-form textarea.alis-form-input {
      height: 32px; /* 单行高度 */
      min-height: 32px;
      resize: vertical;
      padding-top: 6px;
    }
    
    .alis-embedded-appointment-form .alis-appointment-form-footer {
      margin-top: 5px; /* 进一步减少外边距 */
    }
    
    .alis-embedded-appointment-form .alis-appointment-submit-btn {
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 5px;
      padding: 7px 16px; /* 进一步减少垂直内边距 */
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      width: 100%;
    }
    
    .alis-embedded-appointment-form .alis-appointment-submit-btn:hover {
      opacity: 0.9;
    }
    
    .alis-embedded-appointment-form .alis-appointment-submit-btn:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
      opacity: 0.8;
    }
    
    .alis-appointment-success {
      text-align: center;
      padding: 20px;
      background-color: #f9fafb;
    }
    
    .alis-appointment-success .alis-success-icon {
      font-size: 32px;
      color: #10b981;
      margin-bottom: 12px;
    }
    
    .alis-appointment-success p {
      margin: 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.5;
    }
    .alis-appointment-success p:first-of-type {
      font-weight: 500;
      font-size: 15px;
      margin-bottom: 4px;
    }
    
    /* 加载指示器样式 */
    .alis-typing {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      background-color: #f0f0f0;
      border-radius: 18px;
      align-self: flex-start;
      border-bottom-left-radius: 5px;
      margin-top: 5px;
    }
    
    .alis-typing-dots {
      display: flex;
      gap: 3px;
    }
    
    .alis-typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #888;
      animation: typing-dot 1.4s infinite ease-in-out both;
    }
    
    .alis-typing-dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    .alis-typing-dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    
    @keyframes typing-dot {
      0%, 80%, 100% { transform: scale(0.7); }
      40% { transform: scale(1); }
    }
  `;

  // 确保样式被添加到文档中
  try {
    document.head.appendChild(style);
    console.log('Chatbot styles added to document head');
  } catch (e) {
    console.error('Failed to add styles to head:', e);
    // 备用方案：添加到body
    document.body && document.body.appendChild(style);
    console.log('Chatbot styles added to document body as fallback');
  }

  // 初始化聊天窗口
  function initChatbot() {
    try {
      console.log('Starting chatbot initialization...');
      // 重置历史加载标记
      window.alisHistoryLoaded = false;

      // 移除任何现有的聊天机器人容器
      const existingContainer = document.querySelector('.alis-chatbot-container');
      if (existingContainer) {
        existingContainer.remove();
        console.log('Removed existing chatbot container');
      }

      // 创建容器
      const container = document.createElement('div');
      container.className = 'alis-chatbot-container';

      // 确保在DOM准备好时添加元素
      if (document.body) {
        document.body.appendChild(container);
        console.log('Chatbot container created and added to DOM');
      } else {
        console.error('Body element not found, cannot add chatbot container');
        // 如果document.body不存在，等待DOM加载完成
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(container);
          console.log('Chatbot container added after DOM content loaded');
        });
        return;
      }

      // 添加按钮
      const button = document.createElement('button');
      button.className = 'alis-chat-btn';
      button.setAttribute('aria-label', '打开聊天');
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      container.appendChild(button);
      console.log('Chat button created and added to container');

      // 添加聊天窗口
      chatWindow = document.createElement('div');
      chatWindow.className = 'alis-chat-window';
      chatWindow.innerHTML = chatWindowHTML;
      container.appendChild(chatWindow);
      console.log('Chat window created and added to container');

      // 获取重要元素
      chatMessages = chatWindow.querySelector('.alis-chat-messages'); // 设置全局变量
      const chatInput = chatWindow.querySelector('.alis-chat-input-field');
      const chatSend = chatWindow.querySelector('.alis-chat-send');
      const chatMinimize = chatWindow.querySelector('.alis-chat-minimize');
      const chatClose = chatWindow.querySelector('.alis-chat-close');
      const customerServiceBtn = chatWindow.querySelector('.alis-customer-service-btn');

      // 添加事件监听
      button.addEventListener('click', () => {
        chatWindow.style.display = 'flex';
        setTimeout(() => {
          chatWindow.classList.add('open');
        }, 10);
        button.style.display = 'none';

        // 检查是否为首次打开
        const isFirstOpen = localStorage.getItem('alis_chat_first_open') !== 'false';
        if (isFirstOpen) {
          // 显示欢迎消息
          addMessage(config.initialMessage, 'bot');
          localStorage.setItem('alis_chat_first_open', 'false');
        } else {
          // 如果不是首次打开，加载历史消息
          loadChatHistory();
        }

        // 滚动到底部
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
          // 聚焦输入框
          chatInput.focus();
        }, 300);
      });

      // 添加人工客服按钮事件
      if (customerServiceBtn) {
        customerServiceBtn.addEventListener('click', () => {
          // 显示正在连接客服的消息
          addMessage("正在为您连接人工客服，请稍候...", 'bot');

          // 请求人工客服
          requestCustomerService("用户点击了人工客服按钮");
        });
      } else {
        console.warn('Customer service button not found in the DOM');
      }

      chatMinimize.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        setTimeout(() => {
          chatWindow.style.display = 'none';
          button.style.display = 'flex';
        }, 300);
      });

      chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        setTimeout(() => {
          chatWindow.style.display = 'none';
          button.style.display = 'flex';
        }, 300);
      });

      // 处理消息发送
      function handleSendMessage(e) {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // 添加用户消息
        addMessage(message, 'user');

        // 清空输入
        chatInput.value = '';

        // 检查是否用户请求人工客服
        if (checkForHumanSupportRequest(message)) {
          // 显示正在连接客服的消息
          addMessage("正在为您连接人工客服，请稍候...", 'bot');

          // 请求人工客服
          requestCustomerService("用户消息请求人工客服: " + message);
          return;
        }

        // 如果已经在人工客服模式且Socket连接已建立
        if (socket && socket.connected) {
          // 通过Socket发送消息
          socket.emit('chat_message', {
            chatSessionId: sessionId,
            sessionId: sessionId,
            content: message,
            role: 'user'
          });

          // 添加"正在等待回复"指示器
          const loadingId = 'loading-' + Date.now();
          addMessage('<div class="alis-typing-indicator"><span></span><span></span><span></span></div>', 'bot', loadingId, true, false);
        } else {
          // 添加"正在思考"消息
          const loadingId = 'loading-' + Date.now();
          addMessage('<div class="alis-typing-indicator"><span></span><span></span><span></span></div>', 'bot', loadingId, true, false); // 不保存到本地

          // 发送到API
          sendToAPI(message, loadingId);
        }
      }

      // 检查是否请求人工客服
      function checkForHumanSupportRequest(message) {
        const keywords = [
          '人工', '客服', '真人', '人工客服', '客服人员',
          '转人工', '转接人工', '人工服务', '转接客服',
          '联系客服', '真人客服', '请联系客服', '请转人工',
          'human', 'agent', 'representative', 'customer service'
        ];

        const lowerMessage = message.toLowerCase();
        return keywords.some(keyword => lowerMessage.includes(keyword));
      }

      chatSend.addEventListener('click', handleSendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSendMessage(e);
        }
      });

      // 显示聊天按钮
      button.style.display = 'flex';
      console.log('Chat button display set to flex, should be visible now');

      // 确保聊天按钮在顶层显示
      container.style.zIndex = '9999';
      button.style.zIndex = '10000';

      // 强制显示按钮的内联样式
      button.style.width = '60px';
      button.style.height = '60px';
      button.style.borderRadius = '50%';
      button.style.backgroundColor = config.primaryColor;
      button.style.color = 'white';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.position = 'relative';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';

      console.log('Chatbot initialization complete');
      return { chatWindow, chatMessages, chatInput };
    } catch (error) {
      console.error('Error initializing chatbot:', error);
    }
  }

  // 修改loadChatHistory函数，确保不会重复显示消息
  async function loadChatHistory() {
    try {
      // 标记，防止重复加载
      if (window.alisHistoryLoaded) {
        console.log('历史记录已加载，跳过重复加载');
        return;
      }

      // 构建历史消息API端点
      const historyEndpoint = `${apiEndpoint}/history?sessionId=${sessionId}`;
      console.log('加载历史消息:', historyEndpoint);

      // 显示加载指示器
      const loadingId = 'loading-history-' + Date.now();
      addMessage('<div class="alis-typing-indicator"><span></span><span></span><span></span></div>', 'bot', loadingId, true, false); // 不保存到本地

      // 获取历史消息
      const response = await fetch(historyEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });

      // 移除加载指示器
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }

      // 清除现有消息
      chatMessages.innerHTML = '';

      if (response.ok) {
        // 处理响应
        const data = await response.json();

        // 显示历史消息
        if (data.messages && data.messages.length > 0) {
          console.log(`从服务器加载了 ${data.messages.length} 条历史消息`);

          data.messages.forEach(msg => {
            addMessage(msg.content, msg.role, null, false, false); // 不滚动到底部，不保存到本地
          });

          // 全部加载完成后滚动到底部
          chatMessages.scrollTop = chatMessages.scrollHeight;
          window.alisHistoryLoaded = true; // 标记历史已加载
          return; // 成功从服务器加载，不需要使用本地存储
        }
      }

      // 如果服务器API请求失败或没有消息，尝试从本地存储加载
      console.log('尝试从本地存储加载历史消息');
      loadLocalChatHistory();

    } catch (error) {
      console.error('从服务器加载历史消息失败:', error);
      // 尝试从本地存储加载
      loadLocalChatHistory();
    }
  }

  // 从本地存储加载聊天记录的函数
  function loadLocalChatHistory() {
    try {
      // 标记，防止重复加载
      if (window.alisHistoryLoaded) {
        console.log('历史记录已加载，跳过本地加载');
        return;
      }

      // 从localStorage获取消息
      const localMessages = JSON.parse(localStorage.getItem(`alis_chat_messages_${sessionId}`) || '[]');

      // 清除现有消息
      chatMessages.innerHTML = '';

      if (localMessages.length > 0) {
        console.log(`从本地存储加载了 ${localMessages.length} 条历史消息`);

        // 显示本地存储的历史消息
        localMessages.forEach(msg => {
          // 跳过加载指示器消息和内部指令消息
          if (!msg.content.includes('alis-typing-indicator') && !msg.content.includes('<APPOINTMENT_FORM:')) {
            addMessage(msg.content, msg.role, null, false, false); // 不滚动到底部，不保存到本地
          }
        });

        // 全部加载完成后滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
        window.alisHistoryLoaded = true; // 标记历史已加载
      } else {
        console.log('本地存储中没有历史消息');
        // 如果没有历史消息，显示初始欢迎消息
        addMessage(config.initialMessage, 'bot', null, true, true);
      }
    } catch (error) {
      console.error('从本地存储加载历史消息失败:', error);
      // 显示初始欢迎消息
      addMessage(config.initialMessage, 'bot', null, true, true);
    }
  }

  // 添加消息
  function addMessage(text, sender, id, autoScroll = true, saveLocal = true) {
    if (!chatMessages) {
      console.error('聊天消息容器未初始化');
      return;
    }

    // 检查重复消息 (防止消息重复显示)
    if (id && document.getElementById(id)) {
      console.log('跳过重复消息ID:', id);
      return;
    }

    // 对于系统消息，检查最近5条消息是否有相同内容，避免重复
    if (sender === 'system') {
      const messages = chatMessages.querySelectorAll('.alis-message');
      let lastFiveMessages = [];
      for (let i = Math.max(0, messages.length - 5); i < messages.length; i++) {
        lastFiveMessages.push(messages[i].textContent);
      }

      if (lastFiveMessages.includes(text)) {
        console.log('跳过重复的系统消息:', text);
        return;
      }
    }

    const messageElement = createMessageElement(text, sender, id);
    chatMessages.appendChild(messageElement);

    // 自动滚动到底部（除非指定不滚动）
    if (autoScroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 如果是机器人消息，处理特殊指令
    if (sender === 'bot') {
      // 检测预约表单指令 <APPOINTMENT_FORM:websiteId>
      const appointmentFormMatch = text.match(/<APPOINTMENT_FORM:([^>]+)>/);
      if (appointmentFormMatch) {
        console.log('检测到预约表单指令，网站ID:', appointmentFormMatch[1]);
        const websiteId = appointmentFormMatch[1];

        // 移除指令文本
        messageElement.innerHTML = text.replace(/<APPOINTMENT_FORM:[^>]+>/g, '');

        // 延迟一下再渲染表单，确保DOM已更新
        setTimeout(() => {
          renderAppointmentForm(messageElement, websiteId);
        }, 100);
      }
    }

    // 在本地存储中保存最新消息，以便在页面刷新后显示
    if (saveLocal) {
      saveChatMessage(text, sender);
    }
  }

  // 修改saveChatMessage函数，确保不保存加载指示器消息
  function saveChatMessage(text, sender) {
    try {
      // 不保存加载指示器消息
      if (text.includes('alis-typing-indicator')) {
        return;
      }

      // 从localStorage获取现有消息
      let messages = JSON.parse(localStorage.getItem(`alis_chat_messages_${sessionId}`) || '[]');

      // 添加新消息
      messages.push({
        content: text,
        role: sender,
        timestamp: new Date().toISOString()
      });

      // 限制存储的消息数量（最多保存最近的50条）
      if (messages.length > 50) {
        messages = messages.slice(messages.length - 50);
      }

      // 保存回localStorage
      localStorage.setItem(`alis_chat_messages_${sessionId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('保存消息到本地存储失败:', error);
    }
  }

  // 在消息元素中直接渲染预约表单
  function renderAppointmentForm(messageElement, websiteId) {
    console.log('直接渲染预约表单，网站ID:', websiteId);

    // 创建唯一ID
    const uniqueId = 'appointment-' + Date.now();

    // 创建预约表单容器
    const formContainer = document.createElement('div');
    formContainer.className = 'alis-embedded-appointment-form';
    formContainer.id = uniqueId;

    // 预约表单HTML - 移除页眉
    formContainer.innerHTML = `
      <div class="alis-appointment-form-body">
        <input type="text" id="${uniqueId}-name" placeholder="您的姓名" class="alis-form-input">
        <input type="email" id="${uniqueId}-email" placeholder="电子邮箱 *" required class="alis-form-input">
        <input type="tel" id="${uniqueId}-phone" placeholder="联系电话 *" required class="alis-form-input">
        <input type="datetime-local" id="${uniqueId}-date" required class="alis-form-input">
        <textarea id="${uniqueId}-notes" placeholder="备注信息（可选）" class="alis-form-input" rows="1"></textarea>
        <div class="alis-appointment-form-footer">
          <button type="button" class="alis-appointment-submit-btn" data-website-id="${websiteId}" data-form-id="${uniqueId}">提交预约</button>
        </div>
      </div>
    `;

    // 添加表单到消息元素
    messageElement.appendChild(formContainer);

    // 设置日期时间最小值为当前时间
    const dateInput = document.getElementById(`${uniqueId}-date`);
    if (dateInput) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      dateInput.min = now.toISOString().slice(0, 16);

      // 默认设置为当前时间后1小时
      const defaultTime = new Date(now);
      defaultTime.setHours(defaultTime.getHours() + 1);
      dateInput.value = defaultTime.toISOString().slice(0, 16);
    }

    // 添加提交按钮事件
    const submitBtn = formContainer.querySelector('.alis-appointment-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitEmbeddedAppointment);
    }
  }

  // 提交内嵌预约表单
  async function submitEmbeddedAppointment(event) {
    const submitBtn = event.target;
    const formId = submitBtn.getAttribute('data-form-id');
    const websiteId = submitBtn.getAttribute('data-website-id');

    if (!formId) {
      console.error('找不到表单ID');
      return;
    }

    if (!websiteId) {
      console.error('无法获取网站ID，提交按钮缺少data-website-id属性');
      alert('提交失败：缺少网站标识');
      return;
    }

    // 获取表单数据
    const name = document.getElementById(`${formId}-name`)?.value || '';
    const email = document.getElementById(`${formId}-email`)?.value;
    const phone = document.getElementById(`${formId}-phone`)?.value;
    const date = document.getElementById(`${formId}-date`)?.value;
    const notes = document.getElementById(`${formId}-notes`)?.value || '';

    // 验证必填字段
    if (!email || !phone || !date) {
      alert('请填写必填字段：电子邮箱、联系电话和预约日期');
      return;
    }

    console.log('提交预约信息到网站ID:', websiteId);

    try {
      // 禁用提交按钮并显示加载状态
      submitBtn.disabled = true;
      submitBtn.innerHTML = '提交中...';

      // 构建API端点
      const baseUrl = new URL(apiEndpoint).origin;
      const appointmentEndpoint = `${baseUrl}/api/appointments`;
      console.log('发送预约请求到:', appointmentEndpoint);

      // 发送预约请求
      const response = await fetch(appointmentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify({
          name,
          email,
          phone,
          date,
          notes,
          subject: '网站聊天预约',
          websiteId,
          chatSessionId: sessionId
        })
      });

      // 检查响应
      console.log('预约响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('预约提交错误:', errorText);
        throw new Error(`预约提交失败 (${response.status}): ${errorText}`);
      }

      // 获取表单容器
      const formContainer = document.getElementById(formId);
      if (!formContainer) {
        throw new Error('找不到表单容器');
      }

      // 隐藏表单并显示成功消息
      formContainer.innerHTML = `
        <div class="alis-appointment-success">
          <div class="alis-success-icon">✓</div>
          <p>您的预约已成功提交！</p>
          <p>我们的团队会尽快与您联系确认。</p>
        </div>
      `;

    } catch (error) {
      console.error('预约提交错误:', error);
      alert(`预约提交失败: ${error.message || '请稍后再试'}`);

      // 恢复提交按钮状态
      submitBtn.disabled = false;
      submitBtn.innerHTML = '提交预约';
    }
  }

  // 辅助函数：获取元素中所有文本节点
  function getAllTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    return textNodes;
  }

  // 创建消息元素
  function createMessageElement(text, sender, id) {
    const messageElement = document.createElement('div');
    messageElement.className = `alis-message alis-message-${sender}`;
    if (id) {
      messageElement.id = id;
    }
    messageElement.innerHTML = text;
    return messageElement;
  }

  // 修改聊天窗口HTML，添加加载指示器样式
  const chatWindowHTML = `
    <div class="alis-chat-header">
      <h3 class="alis-chat-title">${config.botName}</h3>
      <div class="alis-chat-controls">
        <button class="alis-customer-service-btn" aria-label="人工客服">
          <svg class="alis-customer-service-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 10V8A8 8 0 0 0 4 8v2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v-9a6 6 0 1 1 12 0v9h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zM9 21h6v-2H9v2z"/>
          </svg>
          人工客服
        </button>
        <button class="alis-chat-control alis-chat-minimize" aria-label="最小化">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="alis-chat-control alis-chat-close" aria-label="关闭">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="alis-chat-messages"></div>
    <div class="alis-chat-input">
      <input type="text" class="alis-chat-input-field" placeholder="输入消息..." aria-label="输入消息">
      <button class="alis-chat-send" aria-label="发送">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 8L1 15L3 8L1 1L15 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  // 添加打字动画样式
  style.textContent += `
    .alis-typing-indicator {
      display: flex;
      align-items: center;
      height: 17px;
    }
    .alis-typing-indicator span {
      display: block;
      width: 7px;
      height: 7px;
      background-color: #999;
      border-radius: 50%;
      margin: 0 2px;
      animation: typing-bounce 1.4s infinite ease-in-out both;
    }
    .alis-typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }
    .alis-typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes typing-bounce {
      0%, 80%, 100% { transform: scale(0.6); }
      40% { transform: scale(1); }
    }
  `;

  // 创建和显示预约表单
  function showAppointmentForm() {
    // 移除任何已存在的表单
    const existingForm = document.getElementById('alis-appointment-form-container');
    if (existingForm) {
      existingForm.remove();
    }

    console.log('显示预约表单');

    // 获取预约按钮的websiteId
    const appointmentBtn = event.target; // 使用事件对象获取被点击的按钮
    if (!appointmentBtn || !appointmentBtn.getAttribute('data-website-id')) {
      console.error('无法获取网站ID，预约按钮缺少data-website-id属性');
      return;
    }

    const websiteId = appointmentBtn.getAttribute('data-website-id');
    console.log('预约网站ID:', websiteId);

    // 创建预约表单容器
    const formContainer = document.createElement('div');
    formContainer.id = 'alis-appointment-form-container';
    formContainer.className = 'alis-appointment-form-container';

    // 预约表单HTML
    formContainer.innerHTML = `
      <div class="alis-appointment-form">
        <div class="alis-appointment-form-header">
          <h3>预约咨询</h3>
          <button class="alis-appointment-close-btn">&times;</button>
        </div>
        <div class="alis-appointment-form-body">
          <div class="alis-form-group">
            <label for="alis-appointment-name">您的姓名</label>
            <input type="text" id="alis-appointment-name" placeholder="请输入您的姓名">
          </div>
          <div class="alis-form-group">
            <label for="alis-appointment-email">电子邮箱 *</label>
            <input type="email" id="alis-appointment-email" placeholder="请输入您的电子邮箱" required>
          </div>
          <div class="alis-form-group">
            <label for="alis-appointment-phone">联系电话 *</label>
            <input type="tel" id="alis-appointment-phone" placeholder="请输入您的联系电话" required>
          </div>
          <div class="alis-form-group">
            <label for="alis-appointment-date">预约日期时间 *</label>
            <input type="datetime-local" id="alis-appointment-date" required>
          </div>
          <div class="alis-form-group">
            <label for="alis-appointment-notes">备注信息</label>
            <textarea id="alis-appointment-notes" placeholder="请输入您的需求或问题"></textarea>
          </div>
        </div>
        <div class="alis-appointment-form-footer">
          <button type="button" class="alis-appointment-cancel-btn">取消</button>
          <button type="button" class="alis-appointment-submit-btn" data-website-id="${websiteId}">提交预约</button>
        </div>
      </div>
    `;

    // 添加表单到聊天窗口
    chatWindow.appendChild(formContainer);

    // 设置日期时间最小值为当前时间
    const dateInput = document.getElementById('alis-appointment-date');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);

    // 添加关闭按钮事件
    const closeBtn = formContainer.querySelector('.alis-appointment-close-btn');
    closeBtn.addEventListener('click', () => formContainer.remove());

    // 添加取消按钮事件
    const cancelBtn = formContainer.querySelector('.alis-appointment-cancel-btn');
    cancelBtn.addEventListener('click', () => formContainer.remove());

    // 添加提交按钮事件
    const submitBtn = formContainer.querySelector('.alis-appointment-submit-btn');
    submitBtn.addEventListener('click', submitAppointment);
  }

  // 提交预约信息
  async function submitAppointment() {
    // 获取表单数据
    const name = document.getElementById('alis-appointment-name').value;
    const email = document.getElementById('alis-appointment-email').value;
    const phone = document.getElementById('alis-appointment-phone').value;
    const date = document.getElementById('alis-appointment-date').value;
    const notes = document.getElementById('alis-appointment-notes').value;

    // 验证必填字段
    if (!email || !phone || !date) {
      alert('请填写必填字段');
      return;
    }

    // 获取网站ID
    const submitBtn = event.target;
    const websiteId = submitBtn.getAttribute('data-website-id');

    if (!websiteId) {
      console.error('无法获取网站ID，提交按钮缺少data-website-id属性');
      alert('提交失败：缺少网站标识');
      return;
    }

    console.log('提交预约信息到网站ID:', websiteId);

    try {
      // 构建API端点 - 直接从API URL构建
      const appointmentEndpoint = `${config.apiUrl || config.scriptOrigin}/api/appointments`;
      console.log('发送预约请求到:', appointmentEndpoint);

      // 发送预约请求
      const response = await fetch(appointmentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify({
          name,
          email,
          phone,
          date,
          notes,
          subject: '网站聊天预约',
          websiteId,
          chatSessionId: sessionId
        })
      });

      // 检查响应
      console.log('预约响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('预约提交错误:', errorText);
        throw new Error(`预约提交失败 (${response.status}): ${errorText}`);
      }

      // 关闭表单
      document.getElementById('alis-appointment-form-container').remove();

      // 添加成功消息
      addMessage('您的预约已成功提交！我们的团队会尽快与您联系确认。谢谢您的信任！', 'bot');

    } catch (error) {
      console.error('预约提交错误:', error);
      alert(`预约提交失败: ${error.message || '请稍后再试'}`);
    }
  }

  async function sendToAPI(message, loadingId) {
    try {
      console.log(`Sending request to API: ${apiEndpoint}`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        body: JSON.stringify({
          message,
          websiteId: config.websiteId,
          apiKey: config.apiKey,
          chatSessionId: sessionId
        }),
      });

      // 先移除加载提示
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type');

      if (contentType && contentType.includes('application/json')) {
        // 处理JSON响应 (用于预约)
        console.log('Received JSON response');
        const data = await response.json();

        if (data.chatSessionId) {
          sessionId = data.chatSessionId;
          localStorage.setItem('alis_chat_session_id', sessionId);
          console.log('Updated session ID:', sessionId);
        }

        addMessage(data.content || "抱歉，AI没有返回有效响应。", 'bot');

      } else if (contentType && contentType.includes('text/event-stream')) {
        // 处理流式响应
        console.log('Received stream response');
        const streamMessageId = 'stream-' + Date.now();
        const messageElement = createMessageElement('', 'bot', streamMessageId);
        chatMessages.appendChild(messageElement);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let streamText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          let lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() && line.startsWith('data:')) {
              try {
                const jsonStr = line.substring(5).trim();
                const data = JSON.parse(jsonStr);
                if (data && data.content) {
                  streamText += data.content;
                  messageElement.innerHTML = streamText;

                  const appointmentFormMatch = streamText.match(/<APPOINTMENT_FORM:([^>]+)>/);
                  if (appointmentFormMatch) {
                    console.log('流式响应中找到预约表单指令:', appointmentFormMatch[0], '网站ID:', appointmentFormMatch[1]);
                    const websiteId = appointmentFormMatch[1];

                    streamText = streamText.replace(/<APPOINTMENT_FORM:[^>]+>/g, '');
                    messageElement.innerHTML = streamText;

                    setTimeout(() => {
                      renderAppointmentForm(messageElement, websiteId);
                    }, 100);
                  }

                  chatMessages.scrollTop = chatMessages.scrollHeight;
                }
              } catch (e) {
                console.error('解析流数据错误:', e, 'Line:', line);
              }
            }
          }
        }

        // 流式响应结束后，保存完整消息
        if (streamText.trim()) {
          saveChatMessage(streamText, 'bot');
        }
      } else {
        // 回退处理
        console.warn('Received unknown content type:', contentType);
        const text = await response.text();
        addMessage(text || '收到了未知类型的响应。', 'bot');
      }
    } catch (error) {
      console.error('API request failed:', error);
      // 确保先移除加载指示器
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();

      addMessage('抱歉，请求失败。请检查您的网络连接并重试。', 'bot');
    }
  }

  // 请求人工客服功能
  async function requestCustomerService(reason) {
    try {
      console.log(`Requesting customer service...`);

      // 显示等待消息
      addMessage('已发送人工客服请求，正在连接客服人员...', 'bot');

      // 优先尝试通过Socket.IO发送请求
      try {
        // 确保socket已连接
        if (!socket || !socket.connected) {
          console.log('Socket not connected, initializing connection...');
          await new Promise((resolve, reject) => {
            initSocketConnection();

            // 等待连接成功或失败
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
            socket.once('reconnect_failed', reject);

            // 设置超时
            setTimeout(() => reject(new Error('Socket connection timed out')), 10000);
          });
        }

        console.log('Socket is connected, sending request via Socket.IO');
        socket.emit('customer_service_request', {
          sessionId: sessionId,
          reason: reason,
          websiteId: config.websiteId
        });

        // 等待服务器确认
        await new Promise((resolve, reject) => {
          socket.once('customer_service_requested', (data) => {
            if (data.success) {
              console.log('Successfully requested customer service via Socket.IO');
              resolve();
            } else {
              reject(new Error(data.message || 'Server rejected the request.'));
            }
          });
          setTimeout(() => reject(new Error('Server acknowledgment timed out')), 10000);
        });

        return; // Socket请求成功，直接返回
      } catch (socketError) {
        console.error('Socket.IO request failed, falling back to HTTP:', socketError);
        // 如果Socket失败，则继续执行HTTP请求
      }

      // HTTP API 作为备用方案
      console.log('Falling back to HTTP API to request customer service.');
      const requestTimeout = new Promise(resolve => setTimeout(() => resolve({ ok: false, status: 504, statusText: 'Gateway Timeout' }), 10000)); // 10秒超时
      const response = await Promise.race([
        fetch(customerServiceEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          mode: 'cors',
          body: JSON.stringify({
            message: "请求人工客服",
            websiteId: config.websiteId,
            apiKey: config.apiKey,
            chatSessionId: sessionId,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            needsHumanSupport: true,
            supportReason: reason,
            timestamp: new Date().toISOString()
          }),
        }),
        requestTimeout
      ]);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }

      console.log('Customer service request sent successfully via HTTP API');

      // 既然HTTP请求成功了，再次尝试初始化Socket连接
      initSocketConnection();

    } catch (error) {
      console.error('Failed to request customer service:', error);
      addMessage(`抱歉，连接客服失败: ${error.message}，请稍后再试。`, 'bot');
    }
  }

  // 允许按回车键发送消息
  // chatInput.addEventListener('keypress', (e) => {
  //   if (e.key === 'Enter') {
  //     e.preventDefault();
  //     chatSend.click();
  //   }
  // });

  // 在文档加载完成后初始化
  function ensureInit() {
    console.log('Ensuring chatbot initialization with document.readyState:', document.readyState);

    // 如果之前初始化失败或没有初始化
    if (!document.querySelector('.alis-chatbot-container')) {
      console.log('No chatbot container found, initializing now');
      initChatbot();
    } else {
      console.log('Chatbot container already exists');
    }
  }

  // 处理不同的DOM加载状态
  if (document.readyState === 'loading') {
    console.log('Document still loading, adding DOMContentLoaded listener for chatbot');
    document.addEventListener('DOMContentLoaded', ensureInit);
    // 额外保险：如果DOMContentLoaded事件已经错过，用延迟作为备份
    setTimeout(ensureInit, 1000);
  } else {
    console.log('Document already loaded, initializing chatbot immediately');
    ensureInit();
  }

  // 最后的保险措施：如果一切都失败了，在window.onload之后再尝试
  window.addEventListener('load', function () {
    setTimeout(ensureInit, 500);
  });

  // 添加到window全局对象以便调试
  window.AlisChatbot = {
    init: initChatbot,
    config: config,
    addMessage: addMessage,
    ensureInit: ensureInit
  };

  // 动态加载Socket.IO客户端库
  function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = callback;
    document.head.appendChild(script);
  }

  // 初始化Socket.IO连接
  function initSocketConnection() {
    // 如果已经加载了Socket.IO库，直接初始化
    if (window.io) {
      connectSocket();
      return;
    }

    // 否则先加载Socket.IO库
    loadScript('https://cdn.socket.io/4.6.0/socket.io.min.js', function () {
      connectSocket();
    });
  }

  // 连接到Socket.IO服务器
  function connectSocket() {
    if (!sessionId) return;
    if (socket && socket.connected) {
      console.log('Socket.IO is already connected.');
      return;
    }

    // 修正socketUrl，确保正确连接到服务器
    let socketUrl = config.apiUrl
      ? new URL(config.apiUrl).origin
      : config.scriptOrigin;

    // 添加端口号3001
    socketUrl = socketUrl.replace(/:\d+$/, '') + ':3001';

    // 添加最大重试次数和当前重试计数
    const maxRetries = 3;
    let retryCount = 0;
    let connectTimeoutId = null;
    let connectionError = false;

    try {
      console.log('Attempting to connect to Socket.IO server at:', socketUrl);

      // 添加连接超时处理
      connectTimeoutId = setTimeout(() => {
        console.error('Socket.IO connection timeout');
        if (socket && !socket.connected) {
          socket.disconnect();
        }
        connectionError = true;
        handleSocketConnectionError('连接超时');
      }, 10000); // 10秒超时

      // 创建Socket实例时增加重连配置
      socket = window.io(socketUrl, {
        path: '/socket.io', // 确保路径匹配
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'] // 尝试WebSocket和长轮询两种方式
      });

      socket.on('connect', function () {
        console.log('Socket.IO connected:', socket.id);
        // 清除连接超时计时器
        if (connectTimeoutId) {
          clearTimeout(connectTimeoutId);
          connectTimeoutId = null;
        }

        // 重置错误状态和重试计数
        connectionError = false;
        retryCount = 0;

        // 保存重要元数据到socket对象
        socket.data = {
          role: 'user',
          chatSessionId: sessionId
        };

        // 加入聊天室
        socket.emit('join', {
          chatSessionId: sessionId,
          role: 'user',
          websiteId: config.websiteId,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        });

        // 如果之前显示了连接失败消息，现在添加连接成功消息
        if (document.querySelectorAll('.alis-message').length > 0) {
          const lastMessage = getLastMessageContent();
          if (lastMessage && lastMessage.includes('连接客服失败')) {
            addMessage('已成功连接到服务器，等待客服接入...', 'system');
          }
        }
      });

      socket.on('connect_error', function (error) {
        console.error('Socket connection error:', error);
        retryCount++;

        if (retryCount >= maxRetries) {
          connectionError = true;
          handleSocketConnectionError('连接服务器失败');
        }
      });

      socket.on('reconnect_failed', function () {
        console.error('Socket reconnection failed after', maxRetries, 'attempts');
        connectionError = true;
        handleSocketConnectionError('重连服务器失败');
      });

      socket.on('server_info', function (data) {
        console.log('Server info:', data);
      });

      socket.on('join_success', function (data) {
        console.log('Join success:', data);
      });

      socket.on('user_joined', function (data) {
        console.log('User joined:', data);
        if (data.role === 'admin') {
          // 客服加入聊天
          addMessage(data.message || '客服人员已接入', 'system');
        }
      });

      socket.on('chat_message', function (data) {
        console.log('New message received:', data);

        // 移除任何加载中指示器
        document.querySelectorAll('.alis-typing-indicator').forEach(el => {
          const parent = el.closest('.alis-message');
          if (parent) parent.remove();
        });

        // 根据消息的角色和内容添加消息
        if (data.role === 'assistant') {
          // 客服消息
          addMessage(data.content, 'bot', `msg-${data.id || Date.now()}`);
        } else if (data.role === 'system') {
          // 系统消息
          addMessage(data.content, 'system', `msg-${data.id || Date.now()}`);
        } else if (data.role === 'user' && socket.data && socket.data.role === 'admin') {
          // 仅当当前用户为管理员时才显示用户消息
          addMessage(data.content, 'user', `msg-${data.id || Date.now()}`);
        }
      });

      socket.on('typing', function (data) {
        console.log('Typing indicator:', data);
        if (data.role === 'admin' && data.isTyping) {
          // 显示客服正在输入...
          const typingId = 'typing-' + Date.now();
          const existingTyping = document.querySelector('.alis-typing-indicator');
          if (!existingTyping) {
            addMessage('<div class="alis-typing-indicator"><span></span><span></span><span></span></div>', 'bot', typingId, true, false);
          }
        } else if (data.role === 'admin' && !data.isTyping) {
          // 移除"正在输入"指示器
          document.querySelectorAll('.alis-typing-indicator').forEach(el => {
            const parent = el.closest('.alis-message');
            if (parent) parent.remove();
          });
        }
      });

      socket.on('customer_service_requested', function (data) {
        console.log('Customer service request acknowledged:', data);
        if (data.success) {
          addMessage('您的客服请求已发送，客服人员将尽快与您联系。', 'system');
        }
      });

      socket.on('error', function (data) {
        console.error('Socket error:', data);
        handleSocketConnectionError(data.message || '未知错误');
      });

      socket.on('disconnect', function () {
        console.log('Socket.IO disconnected');
        // 只有在已经连接成功后再显示断开消息
        if (!connectionError && socket.connected) {
          addMessage('与服务器的连接已断开，正在尝试重新连接...', 'system');
        }
      });

      socket.on('reconnect', function (attemptNumber) {
        console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
        addMessage('已重新连接到服务器', 'system');
      });

    } catch (err) {
      console.error('Failed to connect to Socket.IO:', err);
      connectionError = true;
      handleSocketConnectionError('连接服务器失败: ' + err.message);
    }
  }

  // 处理Socket连接错误
  function handleSocketConnectionError(errorMessage) {
    console.error('Socket connection error handled:', errorMessage);
    // 向用户显示连接失败消息，但避免重复显示
    const lastMessage = getLastMessageContent();
    if (!lastMessage || !lastMessage.includes('抱歉，连接客服失败')) {
      addMessage(`抱歉，连接客服失败: ${errorMessage}，请检查网络并稍后再试。`, 'bot');
    }
  }

  // 获取最后一条消息内容
  function getLastMessageContent() {
    const messages = chatMessages.querySelectorAll('.alis-message');
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      return lastMessage.textContent;
    }
    return null;
  }

  console.log(`Chatbot initialized. API endpoint: ${apiEndpoint}, config:`, config);
})();
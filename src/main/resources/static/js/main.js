'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const connectingElement = document.querySelector('.connecting');
const chatArea = document.querySelector('#chat-messages');
const logout = document.querySelector('#logout');

let stompClient = null;
let nickname = null;
let fullname = null;
let selectedUserId = null;

function connect(event) {
  nickname = document.querySelector('#nickname').value.trim();
  fullname = document.querySelector('#fullname').value.trim();

  if (nickname && fullname) {
    usernamePage.classList.add('hidden');
    chatPage.classList.remove('hidden');

    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    // STOMP 연결
    stompClient.connect({}, onConnected, onError);
  }
  event.preventDefault();
}

function onConnected() {
  // STOMP 메시징 구독
  stompClient.subscribe(`/queue/${nickname}/queue/messages`, onMessageReceived);
  stompClient.subscribe(`/topic/user`, onMessageReceived);

  // 연결된 사용자 등록 (@MessageMapping("/user.addUser") 매핑) - register the connected user
  stompClient.send("/app/user.addUser",
      {},
      JSON.stringify({nickName: nickname, fullName: fullname, status: 'ONLINE'})
  );
  document.querySelector('#connected-user-fullname').textContent = fullname;
  findAndDisplayConnectedUsers().then();
}

// 연결된 모든 사용자 정보 조회
async function findAndDisplayConnectedUsers() {
  const connectedUsersResponse = await fetch('/users');
  let connectedUsers = await connectedUsersResponse.json();
  connectedUsers = connectedUsers.filter(user => user.nickName !== nickname);
  const connectedUsersList = document.getElementById('connectedUsers');
  connectedUsersList.innerHTML = '';

  connectedUsers.forEach(user => {
    appendUserElement(user, connectedUsersList);
    if (connectedUsers.indexOf(user) < connectedUsers.length - 1) {
      const separator = document.createElement('li');
      separator.classList.add('separator');
      connectedUsersList.appendChild(separator);
    }
  });
}

function appendUserElement(user, connectedUsersList) {
  const listItem = document.createElement('li');
  listItem.classList.add('user-item');
  listItem.id = user.nickName;

  const userImage = document.createElement('img');
  userImage.src = '../img/user_icon.png';
  userImage.alt = user.fullName;

  const usernameSpan = document.createElement('span');
  usernameSpan.textContent = user.fullName;

  const receivedMsgs = document.createElement('span');
  receivedMsgs.textContent = '0';
  receivedMsgs.classList.add('nbr-msg', 'hidden');

  listItem.appendChild(userImage);
  listItem.appendChild(usernameSpan);
  listItem.appendChild(receivedMsgs);

  listItem.addEventListener('click', userItemClick);

  connectedUsersList.appendChild(listItem);
}

// 대화창 활성화
function userItemClick(event) {
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
  });
  messageForm.classList.remove('hidden');

  const clickedUser = event.currentTarget;
  clickedUser.classList.add('active');

  selectedUserId = clickedUser.getAttribute('id');
  fetchAndDisplayUserChat().then();

  const nbrMsg = clickedUser.querySelector('.nbr-msg');
  nbrMsg.classList.add('hidden');
  nbrMsg.textContent = '0';

}

// 로그인한 사용자 기준 대화 정보 불러오기
async function fetchAndDisplayUserChat() {
  const userChatResponse = await fetch(`/messages/${nickname}/${selectedUserId}`);
  const userChat = await userChatResponse.json();
  chatArea.innerHTML = '';
  userChat.forEach(chat => {
    displayMessage(chat.senderId, chat.content);
  });
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 모든 일대일 채팅 불러오기
function displayMessage(senderId, content) {
  const messageContainer = document.createElement('div');
  messageContainer.classList.add('message');
  if (senderId === nickname) {
    messageContainer.classList.add('sender');
  } else {
    messageContainer.classList.add('receiver');
  }
  const message = document.createElement('p');
  message.textContent = content;
  messageContainer.appendChild(message);
  chatArea.appendChild(messageContainer);
}

// 예외 처리
function onError() {
  connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
  connectingElement.style.color = 'red';
}

// 메시지 전송(@MessageMapping("/chat")로 매핑)
function sendMessage(event) {
  const messageContent = messageInput.value.trim();
  if (messageContent && stompClient) {
    const chatMessage = {
      senderId: nickname,
      recipientId: selectedUserId,
      content: messageInput.value.trim(),
      timestamp: new Date()
    };
    stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));
    displayMessage(nickname, messageInput.value.trim());
    messageInput.value = '';
  }
  chatArea.scrollTop = chatArea.scrollHeight;
  event.preventDefault();
}


async function onMessageReceived(payload) {
  await findAndDisplayConnectedUsers();
  console.log('Message received', payload);
  const message = JSON.parse(payload.body);
  if (selectedUserId && selectedUserId === message.senderId) {
    displayMessage(message.senderId, message.content);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  if (selectedUserId) {
    document.querySelector(`#${selectedUserId}`).classList.add('active');
  } else {
    messageForm.classList.add('hidden');
  }

  const notifiedUser = document.querySelector(`#${message.senderId}`);
  if (notifiedUser && !notifiedUser.classList.contains('active')) {
    const nbrMsg = notifiedUser.querySelector('.nbr-msg');
    nbrMsg.classList.remove('hidden');
    nbrMsg.textContent = '';
  }
}

// 로그아웃 (@MessageMapping("/user.disconnectUser")로 매핑)
function onLogout() {
  stompClient.send("/app/user.disconnectUser",
      {},
      JSON.stringify({nickName: nickname, fullName: fullname, status: 'OFFLINE'})
  );
  window.location.reload();
}

usernameForm.addEventListener('submit', connect, true); // step 1
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();
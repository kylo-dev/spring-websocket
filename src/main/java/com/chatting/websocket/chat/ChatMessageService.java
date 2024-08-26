package com.chatting.websocket.chat;

import com.chatting.websocket.chatroom.ChatRoomService;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomService chatRoomService;

    public ChatMessage save(ChatMessage chatMessage) {

        String chatId = chatRoomService.getChatRoomId(chatMessage.getSenderId(),
                        chatMessage.getRecipientId(), true)
                .orElseThrow();

        chatMessage.setChatId(chatId);
        chatMessageRepository.save(chatMessage);
        return chatMessage;
    }

    public List<ChatMessage> findChatMessages(String senderId, String recipientId) {

        Optional<String> chatId = chatRoomService.getChatRoomId(senderId, recipientId, false);

        return chatId.map(chatMessageRepository::findByChatId)
                .orElse(new ArrayList<>());
    }
}

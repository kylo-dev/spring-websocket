package com.chatting.websocket.user;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/user.addUser")
    @SendTo("/topic/user")
    public User adduser(@Payload User user) {

        userService.saveUser(user);
        // messagingTemplate.convertAndSend("/user/" + user.getNickName() + "/**", user);

        return user;
    }

    @MessageMapping("/user.disconnectUser")
    @SendTo("/topic/user")
    public User disconnect(@Payload User user) {

        userService.disconnect(user);
        //messagingTemplate.convertAndSend("/user/" + user.getNickName() + "/**", user);
        return user;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> findConnectedUsers() {

        return ResponseEntity.ok(userService.findConnectedUsers());
    }
}

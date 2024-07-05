import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce(function (initial, item) {
        if (item) {
          var parts = item.split('=');
          initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
      }, {});
    window.location.hash = '';

    let _token = hash.access_token;
    if (_token) {
      console.log(_token)
      socket.emit('authenticate', _token);
      socket.on('authenticated', (user) => {
        setCurrentUser(user);
        setAuthenticated(true);
        socket.emit('get_current_song');
      });
    }
  }, []);

  useEffect(() => {
    const handleNewUser = (message) => {
      setMessages((msgs) => [...msgs, message]);
    };

    const handleUserLeft = (message) => {
      setMessages((msgs) => [...msgs, message]);
    };

    const handleChatMessage = (message) => {
      console.log('Message received:', message);
      setMessages((msgs) => [...msgs, `${message.user}: ${message.message}`]);
    };

    socket.on('new_user', handleNewUser);
    socket.on('user_left', handleUserLeft);
    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('new_user', handleNewUser);
      socket.off('user_left', handleUserLeft);
      socket.off('chat_message', handleChatMessage);
    };
  }, []);
  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit('chat_message', input);
    setInput('');
  };

  return (
    <div className="App">
      {!authenticated ? (
        <a
          href={`https://accounts.spotify.com/authorize?client_id=3a33e5c9508449af900bb0667c56711e&response_type=token&redirect_uri=http://localhost:3000/callback&scope=user-read-playback-state`}
        >
          Login to Spotify
        </a>
      ) : (
        <div>
          <h1>Chat with other listeners</h1>
          <div>
            {messages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>
          <form onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;

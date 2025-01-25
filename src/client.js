import { io } from "socket.io-client";

export class WebRTCClient {
  constructor(iceServers, characterManager) {
    this.socket = io("http://localhost:3000");
    this.peerConnections = new Map(); // Store RTCPeerConnection for each peer
    this.dataChannels = new Map(); // Store data channels for each peer
    this.roomId = null;

    this.characterManager = characterManager;

    this.configuration = {
      iceServers: iceServers,
    };

    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on("user-connected", (userId) => {
      console.log("User connected:", userId);
      this.createPeerConnection(userId);
    });

    this.socket.on("user-disconnected", (userId) => {
      console.log("User disconnected:", userId);
      this.cleanupPeerConnection(userId);
    });

    this.socket.on("users-in-room", (users) => {
      console.log("Existing users in room:", users);
      users.forEach((userId) => {
        this.createPeerConnection(userId);
      });
    });

    this.socket.on("offer", async (data) => {
      console.log("Received offer from:", data.from);
      await this.handleOffer(data.from, data.offer);
    });

    this.socket.on("answer", async (data) => {
      console.log("Received answer from:", data.from);
      await this.handleAnswer(data.from, data.answer);
    });

    this.socket.on("ice-candidate", async (data) => {
      console.log("Received ICE candidate from:", data.from);
      await this.handleIceCandidate(data.from, data.candidate);
    });
  }

  joinRoom(roomId) {
    this.roomId = roomId;
    this.socket.emit("join-room", roomId);
  }

  async createPeerConnection(userId) {
    try {
      const peerConnection = new RTCPeerConnection(this.configuration);
      this.peerConnections.set(userId, peerConnection);

      // ICE connection state monitoring
      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          `ICE connection state: ${peerConnection.iceConnectionState}`,
        );

        switch (peerConnection.iceConnectionState) {
          case "failed":
            if (this.retryAttempts < this.maxRetryAttempts) {
              console.log("ICE failed, retrying connection...");
              this.retryConnection(userId);
            } else {
              console.error("ICE failed permanently after retries");
            }
            break;
          case "disconnected":
            console.log("ICE disconnected, attempting reconnection...");
            this.handleDisconnection(userId);
            break;
          case "connected":
            console.log("ICE connected successfully");
            this.retryAttempts = 0;
            break;
        }
      };

      // ICE candidate gathering state monitoring
      peerConnection.onicegatheringstatechange = () => {
        console.log(`ICE gathering state: ${peerConnection.iceGatheringState}`);
      };

      // ICE candidate error handling
      peerConnection.onicecandidateerror = (event) => {
        console.error("ICE candidate error:", event);
      };

      // Create data channel
      const dataChannel = peerConnection.createDataChannel(
        `gameData-${userId}`,
      );
      this.setupDataChannel(userId, dataChannel);

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit("ice-candidate", {
            target: userId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(userId, event.channel);
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      this.socket.emit("offer", {
        target: userId,
        offer: offer,
      });
    } catch (err) {
      console.error("Error creating peer connection:", err);
    }
  }

  async retryConnection(userId) {
    this.retryAttempts++;
    console.log(`Retry attempt ${this.retryAttempts}`);

    // Close existing connection
    const oldConnection = this.peerConnections.get(userId);
    if (oldConnection) {
      oldConnection.close();
    }

    // Create new connection
    await this.createPeerConnection(userId);

    // Recreate offer
    const peerConnection = this.peerConnections.get(userId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.socket.emit("offer", {
      target: userId,
      offer: offer,
    });
  }

  handleDisconnection(userId) {
    setTimeout(() => {
      const peerConnection = this.peerConnections.get(userId);
      if (
        peerConnection &&
        peerConnection.iceConnectionState === "disconnected"
      ) {
        this.retryConnection(userId);
      }
    }, 2000); // Wait 2 seconds before trying to reconnect
  }

  setupDataChannel(userId, channel) {
    channel.onopen = () => {
      console.log(`Data channel with ${userId} opened`);
      this.dataChannels.set(userId, channel);
    };

    channel.onclose = () => {
      console.log(`Data channel with ${userId} closed`);
      this.dataChannels.delete(userId);
    };

    channel.onmessage = (event) => {
      this.handleGameData(userId, event.data);
    };
  }

  async handleOffer(userId, offer) {
    try {
      if (!this.peerConnections.has(userId)) {
        const peerConnection = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(userId, peerConnection);

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.socket.emit("ice-candidate", {
              target: userId,
              candidate: event.candidate,
            });
          }
        };

        peerConnection.ondatachannel = (event) => {
          this.setupDataChannel(userId, event.channel);
        };
      }

      const peerConnection = this.peerConnections.get(userId);
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.socket.emit("answer", {
        target: userId,
        answer: answer,
      });
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  }

  async handleAnswer(userId, answer) {
    try {
      const peerConnection = this.peerConnections.get(userId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  }

  async handleIceCandidate(userId, candidate) {
    try {
      const peerConnection = this.peerConnections.get(userId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  }

  sendGameData(data) {
    // Send to all connected peers
    this.dataChannels.forEach((channel) => {
      if (channel.readyState === "open") {
        channel.send(JSON.stringify(data));
      }
    });
  }

  handleGameData(userId, data) {
    const gameData = JSON.parse(data);
    console.log("getting data", gameData);

    switch (gameData.type) {
      case "character_update":
        // Update character position for remote player
        if (gameData.state) {
          const { x, y } = gameData.state;

          // Create character if it doesn't exist
          if (!this.characterManager.characters.get(userId)) {
            this.characterManager.createCharacter(userId);
          }

          // Update position
          this.characterManager.updateCharacterPosition(userId, x, y);
        }
        break;
    }
  }

  cleanupPeerConnection(userId) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
      this.characterManager.removeCharacter(userId);
    }

    const dataChannel = this.dataChannels.get(userId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(userId);
      this.characterManager.removeCharacter(userId);
    }
  }

  disconnect() {
    this.peerConnections.forEach((connection) => connection.close());
    this.dataChannels.forEach((channel) => channel.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.socket.disconnect();
  }
}

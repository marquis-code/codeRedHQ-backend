// import {
//     WebSocketGateway,
//     WebSocketServer,
//     SubscribeMessage,
//     type OnGatewayConnection,
//     type OnGatewayDisconnect,
//     type OnGatewayInit,
//     WsException,
//     MessageBody,
//     ConnectedSocket,
//   } from "@nestjs/websockets"
//   import type { Server, Socket } from "socket.io"
//   import { Logger, Injectable } from "@nestjs/common"
//   import { EventEmitter2, OnEvent } from "@nestjs/event-emitter"
//   import { JwtService } from "@nestjs/jwt"
//   import { InjectModel } from "@nestjs/mongoose"
//   import { type Model, Types } from "mongoose"
//   import { Hospital, type HospitalDocument } from "../../hospital/schemas/hospital.schema"
//   import { Bedspace, type BedspaceDocument } from "../../bedspace/schemas/bedspace.schema"
//   import { Surge, type SurgeDocument } from "../../surge/schema/surge.schema"
//   import { HospitalClick, type HospitalClickDocument } from "../../hospital-click/schemas/hospital-click.schema"
//   import { HospitalClicksService, ClickData, SurgeData } from "../../hospital-click/hospital-clicks.service"
  
//   // Enhanced interfaces for hospital click functionality
// interface ClickData {
//   hospitalId: string
//   sessionId: string
//   latitude: number
//   longitude: number
//   userAgent?: string
//   ipAddress?: string
// }

// interface SurgeData {
//   hospitalId: string
//   clickCount: number
//   surgeTriggered: boolean
//   contributingClicks: Array<{
//     sessionId: string
//     latitude: number
//     longitude: number
//     timestamp: Date
//     distanceFromHospital: number
//     userAgent?: string
//     ipAddress?: string
//   }>
//   averageClickLocation: {
//     latitude: number
//     longitude: number
//   }
//   hospitalInfo: {
//     hospitalId: string
//     name: string
//     latitude: number
//     longitude: number
//   }
//   metadata: {
//     surgeNumber: number
//     totalUniqueSessions: number
//     timeToSurge: number
//     minDistanceFromHospital: number
//     maxDistanceFromHospital: number
//     averageDistanceFromHospital: number
//   }
// }

// interface ClickResult {
//   clickCount: number
//   surgeTriggered: boolean
//   message: string
//   isValidLocation: boolean
//   distanceFromHospital: number
//   hospitalInfo?: any
//   data?: SurgeData
// }

//   // Unified WebSocket gateway that handles both bedspace and surge functionality
//   @WebSocketGateway({
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//     transports: ["websocket", "polling"],
//     pingInterval: 10000,
//     pingTimeout: 5000,
//   })
//   @Injectable()
//   export class UnifiedHospitalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
//     @WebSocketServer() server: Server
//     private logger = new Logger("UnifiedHospitalGateway")
  
//     // Client tracking
//     private connectedClients: Map<string, Set<string>> = new Map()
//     private clientRooms: Map<string, Set<string>> = new Map()
//     private clientChannels: Map<string, Set<string>> = new Map()
//     private clientSessions: Map<string, string> = new Map() // clientId -> sessionId
  
//     // Subscription tracking
//     private regionalSubscriptions: Map<string, { lat: number; lng: number; radius: number }> = new Map();
  
//     constructor(
//       private readonly eventEmitter: EventEmitter2,
//       private readonly jwtService: JwtService,
//       private readonly hospitalClicksService: HospitalClicksService,
//       @InjectModel(Hospital.name) private readonly hospitalModel: Model<HospitalDocument>,
//       @InjectModel(Bedspace.name) private readonly bedspaceModel: Model<BedspaceDocument>,
//       @InjectModel(Surge.name) private readonly surgeModel: Model<SurgeDocument>,
//       @InjectModel(HospitalClick.name) private readonly hospitalClickModel: Model<HospitalClickDocument>,
//     ) {}
  
//     afterInit(server: Server) {
//       this.logger.log("🚀 Unified Hospital WebSocket Gateway initialized")
  
//       // Enhanced connection setup
//       server.use((socket: Socket, next) => {
//         this.logger.log(`🔌 Socket middleware: ${socket.id} from ${socket.handshake.address}`)
//         this.logger.log("🚀 Enhanced Unified Hospital WebSocket Gateway initialized with 30km location validation")
  
//         // Log connection details
//         this.logger.log(`📋 Connection details:`, {
//           id: socket.id,
//           transport: socket.conn.transport.name,
//           address: socket.handshake.address,
//           userAgent: socket.handshake.headers["user-agent"],
//           origin: socket.handshake.headers.origin,
//         })
  
//         try {
//           const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1]
  
//           // Allow anonymous connections for public data
//           if (!token) {
//             socket.data.anonymous = true
//             return next()
//           }
  
//           // Verify token
//           const payload = this.jwtService.verify(token)
//           socket.data.user = payload
//           socket.data.authenticated = true
//           next()
//         } catch (error) {
//           // Don't reject connection, just mark as anonymous
//           socket.data.anonymous = true
//           next()
//         }
//       })
  
//       // Enhanced error handling
//       server.on("connection_error", (err) => {
//         this.logger.error(`❌ Connection error: ${err.message}`)
//       })
  
//       this.logger.log("✅ Unified WebSocket server ready to accept connections")
//       this.logger.log(`🌐 Server listening on transports: websocket, polling`)
//       this.logger.log(`⚙️ CORS enabled for all origins`)
//     }
  
//     handleConnection(client: Socket) {
//       this.logger.log(`🔗 Client connected to unified gateway: ${client.id}`)
//       this.logger.log(`📊 Connection transport: ${client.conn.transport.name}`)

//       this.logger.log(`🔗 Client connected: ${client.id}`)

//       // Generate unique session ID for this client
//       const sessionId = `session_${client.id}_${Date.now()}`
//       this.clientSessions.set(client.id, sessionId)
  
//       // Initialize client tracking
//       if (!this.clientRooms.has(client.id)) {
//         this.clientRooms.set(client.id, new Set())
//       }
//       if (!this.clientChannels.has(client.id)) {
//         this.clientChannels.set(client.id, new Set())
//       }
  
//       // Send immediate connection confirmation
//       client.emit("connection_status", {
//         connected: true,
//         clientId: client.id,
//         sessionId,
//         timestamp: new Date().toISOString(),
//         transport: client.conn.transport.name,
//         message: "Connected to enhanced hospital monitoring system with location validation",
//         modules: ["surge", "bedspace", "hospital-clicks", "general"],
//         authenticated: client.data.authenticated || false,
//         locationValidation: {
//           enabled: true,
//           radiusKm: 30,
//           surgeWindowMinutes: 30,
//         },
//       })
  
//       // Send welcome message
//       client.emit("welcome", {
//         message: "Welcome to the Unified Hospital Monitoring System",
//         clientId: client.id,
//         timestamp: new Date().toISOString(),
//         modules: ["surge", "bedspace", "hospital-clicks", "general"],
//         availableEvents: [
//                  // Hospital Click Events
//         "hospital-click",
//         "get-hospital-click-stats",
//         "get-surge-history",
//         "subscribe_hospital_clicks",
//         "reset-hospital-clicks",
//         // Surge Events
//         "subscribe_hospital_surges",
//         "subscribe_regional_surges",
//         "create_surge",
//         // Bedspace Events
//         "subscribe_hospital",
//         "updateBedSpace",
//         "get_initial_bedspace_data",
//         // General Events
//         "subscribe_channel",
//         "get_connection_stats",
//         "ping",
//           //    // Hospital Click Events
//           // "hospital-click",
//           // "get-hospital-click-stats",
//           // "get-surge-history",
//           // "subscribe_hospital_clicks",
//           // "reset-hospital-clicks",
//           // "subscribe_hospital_surges",
//           // "subscribe_regional_surges",
//           // "subscribe_hospital",
//           // "subscribe_channel",
//           // "create_surge",
//           // "updateBedSpace",
//           // "get_connection_stats",
//         ],
//       })
  
//       // Set up immediate heartbeat
//       client.emit("heartbeat", {
//         timestamp: new Date().toISOString(),
//         message: "Initial heartbeat",
//       })
  
//       // Set up regular heartbeat
//       const interval = setInterval(() => {
//         if (client.connected) {
//           client.emit("heartbeat", {
//             timestamp: new Date().toISOString(),
//             clientId: client.id,
//             sessionId,
//           })
//         } else {
//           clearInterval(interval)
//         }
//       }, 30000)
  
//       // Store interval for cleanup
//       client.data.heartbeatInterval = interval
  
//       this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`)
  
//       // Broadcast connection event to other clients
//       client.broadcast.emit("client_connected", {
//         clientId: client.id,
//         timestamp: new Date().toISOString(),
//         totalClients: this.server.sockets.sockets.size,
//       })
//     }
  
//     handleDisconnect(client: Socket) {
//       this.logger.log(`❌ Client disconnected from unified gateway: ${client.id}`)
  
//       // Clear heartbeat interval
//       if (client.data.heartbeatInterval) {
//         clearInterval(client.data.heartbeatInterval)
//       }

//          // Cleanup client tracking
//     this.clientSessions.delete(client.id)
  
//       // Remove client from all rooms and channels
//       if (this.clientRooms.has(client.id)) {
//         const rooms = this.clientRooms.get(client.id)
//         rooms.forEach((room) => {
//           if (this.connectedClients.has(room)) {
//             this.connectedClients.get(room).delete(client.id)
//           }
//         })
//         this.clientRooms.delete(client.id)
//       }
  
//       if (this.clientChannels.has(client.id)) {
//         this.clientChannels.delete(client.id)
//       }
  
//       this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`)
//     }
  
//     // SURGE MODULE METHODS
//     @SubscribeMessage("subscribe_hospital_surges")
//     async handleSubscribeHospitalSurges(client: Socket, payload: { hospitalId: string }) {
//       try {
//         const { hospitalId } = payload
//         this.logger.log(`🏥 Client ${client.id} subscribing to hospital surges ${hospitalId}`)
  
//         const roomName = `hospital:${hospitalId}:surges`
//         await client.join(roomName)
  
//         if (!this.connectedClients.has(hospitalId)) {
//           this.connectedClients.set(hospitalId, new Set())
//         }
//         this.connectedClients.get(hospitalId).add(client.id)
  
//         if (!this.clientRooms.has(client.id)) {
//           this.clientRooms.set(client.id, new Set())
//         }
//         this.clientRooms.get(client.id).add(hospitalId)
  
//         await this.sendCurrentSurgeData(client, hospitalId)
  
//         client.emit("hospital_subscription_confirmed", {
//           hospitalId,
//           success: true,
//           timestamp: new Date().toISOString(),
//           locationValidation: true,
//         })
  
//         this.logger.log(`✅ Client ${client.id} successfully subscribed to hospital surges ${hospitalId}`)
  
//         return {
//           success: true,
//           message: `Subscribed to hospital surges ${hospitalId}`,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error subscribing to hospital surges: ${error.message}`)
//         throw new WsException(`Failed to subscribe to surges: ${error.message}`)
//       }
//     }
  
//     @SubscribeMessage("subscribe_regional_surges")
//     async handleSubscribeRegionalSurges(
//       client: Socket,
//       payload: {
//         latitude: number
//         longitude: number
//         radius: number
//         radiusKm?: number
//       },
//     ) {
//       try {
//         const { latitude, longitude, radius, radiusKm } = payload
//         const actualRadius = radiusKm || radius / 1000
  
//         this.logger.log(
//           `🌍 Client ${client.id} subscribing to regional surges at ${latitude}, ${longitude} within ${actualRadius}km`,
//         )
  
//         const roomName = `region:${latitude}:${longitude}:${actualRadius}`
//         await client.join(roomName)
  
//         this.regionalSubscriptions.set(roomName, {
//           lat: latitude,
//           lng: longitude,
//           radius: actualRadius * 1000,
//         })
  
//         if (!this.clientRooms.has(client.id)) {
//           this.clientRooms.set(client.id, new Set())
//         }
//         this.clientRooms.get(client.id).add(roomName)
  
//         await this.sendCurrentRegionalSurgeData(client, latitude, longitude, actualRadius)
  
//         client.emit("regional_subscription_confirmed", {
//           latitude,
//           longitude,
//           radiusKm: actualRadius,
//           success: true,
//           timestamp: new Date().toISOString(),
//         })
  
//         this.logger.log(`✅ Client ${client.id} successfully subscribed to regional surges`)
  
//         return {
//           success: true,
//           message: `Subscribed to regional surges within ${actualRadius}km`,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error subscribing to regional surges: ${error.message}`)
//         throw new WsException(`Failed to subscribe to regional surges: ${error.message}`)
//       }
//     }
  
//     // BEDSPACE MODULE METHODS
//     @SubscribeMessage("subscribe_hospital")
//     async handleSubscribeHospital(client: Socket, payload: { hospitalId: string }) {
//       try {
//         const { hospitalId } = payload
  
//         if (!hospitalId) {
//           throw new WsException("Hospital ID is required")
//         }
  
//         this.logger.log(`🏥 Client ${client.id} subscribing to hospital bedspace ${hospitalId}`)
  
//         const roomName = `hospital:${hospitalId}:bedspace`
//         await client.join(roomName)
  
//         if (!this.connectedClients.has(hospitalId)) {
//           this.connectedClients.set(hospitalId, new Set())
//         }
//         this.connectedClients.get(hospitalId).add(client.id)
  
//         if (!this.clientRooms.has(client.id)) {
//           this.clientRooms.set(client.id, new Set())
//         }
//         this.clientRooms.get(client.id).add(hospitalId)
  
//         await this.sendCurrentBedspaceData(client, hospitalId)
  
//         return {
//           success: true,
//           message: `Subscribed to hospital bedspace ${hospitalId}`,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error subscribing to hospital bedspace: ${error.message}`)
//         throw new WsException(`Failed to subscribe: ${error.message}`)
//       }
//     }
  
//     @SubscribeMessage("unsubscribe_hospital")
//     async handleUnsubscribeHospital(client: Socket, payload: { hospitalId: string }) {
//       try {
//         const { hospitalId } = payload
  
//         if (!hospitalId) {
//           throw new WsException("Hospital ID is required")
//         }
  
//         this.logger.log(`🏥 Client ${client.id} unsubscribing from hospital ${hospitalId}`)
  
//         const roomName = `hospital:${hospitalId}:bedspace`
//         await client.leave(roomName)
  
//         if (this.connectedClients.has(hospitalId)) {
//           this.connectedClients.get(hospitalId).delete(client.id)
//         }
  
//         if (this.clientRooms.has(client.id)) {
//           this.clientRooms.get(client.id).delete(hospitalId)
//         }
  
//         return {
//           success: true,
//           message: `Unsubscribed from hospital ${hospitalId}`,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error unsubscribing from hospital: ${error.message}`)
//         throw new WsException(`Failed to unsubscribe: ${error.message}`)
//       }
//     }
  
//     // GENERAL MODULE METHODS
//     @SubscribeMessage("subscribe_channel")
//     async handleSubscribeChannel(client: Socket, payload: { channel: string }) {
//       try {
//         const { channel } = payload
//         this.logger.log(`📡 Client ${client.id} subscribing to channel ${channel}`)
  
//         await client.join(channel)
  
//         if (!this.clientChannels.has(client.id)) {
//           this.clientChannels.set(client.id, new Set())
//         }
//         this.clientChannels.get(client.id).add(channel)
  
//         client.emit("channel_subscription_confirmed", {
//           channel,
//           success: true,
//           timestamp: new Date().toISOString(),
//         })
  
//         this.logger.log(`✅ Client ${client.id} successfully subscribed to channel ${channel}`)
  
//         return {
//           success: true,
//           message: `Subscribed to channel ${channel}`,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error subscribing to channel: ${error.message}`)
//         throw new WsException(`Failed to subscribe to channel: ${error.message}`)
//       }
//     }
  
//     // ACTION METHODS
//     @SubscribeMessage("create_surge")
//     async handleCreateSurge(
//       client: Socket,
//       payload: {
//         hospitalId: string
//         latitude: number
//         longitude: number
//         address?: string
//         emergencyType?: string
//         description?: string
//         metadata?: Record<string, any>
//       },
//     ) {
//       try {
//         const { hospitalId, latitude, longitude, address, emergencyType, description, metadata } = payload
  
//         this.logger.log(`🚨 Creating surge via WebSocket for hospital ${hospitalId}`)
  
//         const newSurge = new this.surgeModel({
//           hospital: hospitalId,
//           latitude,
//           longitude,
//           address,
//           emergencyType,
//           description,
//           metadata,
//           status: "pending",
//         })
  
//         const savedSurge = await newSurge.save()
  
//         const surgeData = savedSurge.toObject()
//         const eventPayload = {
//           hospitalId,
//           surge: surgeData,
//           timestamp: new Date().toISOString(),
//           eventId: `surge_create_${Date.now()}`,
//         }
  
//         // Emit to hospital surge room
//         this.server.to(`hospital:${hospitalId}:surges`).emit("surge_created", eventPayload)
//         this.server.to(`hospital:${hospitalId}:surges`).emit("new_surge", eventPayload)
  
//         // Emit to regional subscribers
//         await this.emitToRegionalSubscribers(hospitalId, "hospital_surge_created", eventPayload)
//         await this.emitToRegionalSubscribers(hospitalId, "regional_surge_created", eventPayload)
  
//         // Emit event for other services
//         this.eventEmitter.emit("surge.created", eventPayload)
  
//         this.logger.log(`✅ Surge created and emitted: ${savedSurge._id}`)
  
//         return {
//           success: true,
//           message: "Surge created successfully",
//           surge: surgeData,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error creating surge: ${error.message}`)
//         throw new WsException(`Failed to create surge: ${error.message}`)
//       }
//     }
  
//     @SubscribeMessage("updateBedSpace")
//     async handleUpdateBedSpace(
//       client: Socket,
//       payload: {
//         unitId: string
//         availableBeds: number
//         hospitalId?: string
//       },
//     ) {
//       try {
//         const { unitId, availableBeds, hospitalId } = payload
  
//         this.logger.log(`🛏️ Updating bed space via WebSocket: unitId=${unitId}, availableBeds=${availableBeds}`)
  
//         // Find and update the bedspace
//         const bedspace = await this.bedspaceModel.findById(unitId)
  
//         if (!bedspace) {
//           throw new WsException("Bedspace not found")
//         }
  
//         bedspace.availableBeds = availableBeds
//         bedspace.occupiedBeds = bedspace.totalBeds - availableBeds
  
//         const updatedBedspace = await bedspace.save()
  
//         const eventPayload = {
//           hospitalId: hospitalId || bedspace.hospital.toString(),
//           bedspace: updatedBedspace.toObject(),
//           timestamp: new Date().toISOString(),
//           eventId: `bedspace_update_${Date.now()}`,
//         }
  
//         // Emit to hospital bedspace room
//         const roomName = `hospital:${eventPayload.hospitalId}:bedspace`
//         this.server.to(roomName).emit("bedspace_updated", eventPayload)
//         this.server.to(roomName).emit("bedSpaceUpdated", eventPayload)
  
//         // Emit event for other services
//         this.eventEmitter.emit("bedspace.updated", eventPayload)
  
//         this.logger.log(`✅ Bedspace updated and emitted: ${updatedBedspace._id}`)
  
//         return {
//           success: true,
//           message: "Bedspace updated successfully",
//           data: updatedBedspace.toObject(),
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error updating bedspace: ${error.message}`)
//         throw new WsException(`Failed to update bedspace: ${error.message}`)
//       }
//     }
  
//     @SubscribeMessage("emergencyNotification")
//     async handleEmergencyNotification(
//       client: Socket,
//       payload: {
//         hospitalId: string
//         userLocation: string
//         latitude: number
//         longitude: number
//       },
//     ) {
//       try {
//         const { hospitalId, userLocation, latitude, longitude } = payload
  
//         this.logger.log(`🚨 Emergency notification for hospital ${hospitalId} from ${userLocation}`)
  
//         const eventPayload = {
//           hospitalId,
//           userLocation,
//           latitude,
//           longitude,
//           timestamp: new Date().toISOString(),
//           eventId: `emergency_${Date.now()}`,
//         }
  
//         // Emit to hospital room
//         this.server.to(`hospital:${hospitalId}:bedspace`).emit("emergency_created", eventPayload)
  
//         // Emit to general emergency channel
//         this.server.to("emergency_alerts").emit("emergency_alert", eventPayload)
  
//         // Emit event for other services
//         this.eventEmitter.emit("emergency.created", eventPayload)
  
//         this.logger.log(`✅ Emergency notification emitted for hospital ${hospitalId}`)
  
//         return {
//           success: true,
//           message: "Emergency notification sent successfully",
//           data: eventPayload,
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error sending emergency notification: ${error.message}`)
//         throw new WsException(`Failed to send emergency notification: ${error.message}`)
//       }
//     }
  
//     @SubscribeMessage("get_initial_bedspace_data")
//     async handleGetInitialBedspaceData(client: Socket, payload: { hospitalId: string }) {
//       try {
//         const { hospitalId } = payload
//         this.logger.log(`📊 Client ${client.id} requesting initial bedspace data for hospital ${hospitalId}`)
  
//         await this.sendCurrentBedspaceData(client, hospitalId)
  
//         return {
//           success: true,
//           message: "Initial bedspace data sent",
//           timestamp: new Date().toISOString(),
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error sending initial bedspace data: ${error.message}`)
//         throw new WsException(`Failed to send initial bedspace data: ${error.message}`)
//       }
//     }
  
//     // UTILITY METHODS
//     @SubscribeMessage("ping")
//     handlePing(client: Socket, payload: any) {
//       this.logger.log(`🏓 Ping received from client ${client.id}`)
//       return { event: "pong", data: { timestamp: new Date().toISOString() } }
//     }
  
//     @SubscribeMessage("heartbeat_response")
//     handleHeartbeatResponse(client: Socket) {
//       client.data.lastActivity = new Date()
//       return { timestamp: new Date().toISOString() }
//     }

//       // ENHANCED HOSPITAL CLICK FUNCTIONALITY WITH LOCATION VALIDATION
//   @SubscribeMessage("hospital-click")
//   async handleHospitalClick(
//     @MessageBody() data: { 
//       hospitalId: string; 
//       latitude: number; 
//       longitude: number;
//       userAgent?: string;
//     },
//     @ConnectedSocket() client: Socket,
//   ) {
//     try {
//       const { hospitalId, latitude, longitude, userAgent } = data
//       const sessionId = this.clientSessions.get(client.id)

//       if (!sessionId) {
//         throw new WsException("Session not found")
//       }

//       if (!hospitalId || latitude === undefined || longitude === undefined) {
//         throw new WsException("Hospital ID, latitude, and longitude are required")
//       }

//            // Check rate limiting
//            if (!this.checkRateLimit(sessionId)) {
//             throw new WsException("Rate limit exceeded. Please wait before clicking again.")
//           }

//       this.logger.log(`🖱️ Hospital click received: ${hospitalId} from ${sessionId} at ${latitude}, ${longitude}`)

//       const clickData: ClickData = {
//         hospitalId,
//         sessionId,
//         latitude,
//         longitude,
//         userAgent: userAgent || client.handshake.headers["user-agent"],
//         ipAddress: client.handshake.address,
//       }

//       const result = await this.hospitalClicksService.handleClick(clickData)

//       // Enhanced click update payload with location validation info
//       const clickUpdatePayload = {
//         hospitalId,
//         clickCount: result.clickCount,
//         surgeTriggered: result.surgeTriggered,
//         message: result.message,
//         isValidLocation: result.isValidLocation,
//         distanceFromHospital: result.distanceFromHospital,
//         timestamp: new Date().toISOString(),
//         sessionId,
//         location: { latitude, longitude },
//         hospitalInfo: result.hospitalInfo,
//         validationInfo: {
//           radiusKm: 30,
//           withinRadius: result.isValidLocation,
//           distanceKm: result.distanceFromHospital,
//         },
//       }

//       // Emit to hospital-specific rooms
//       const hospitalRooms = [
//         `hospital:${hospitalId}:clicks`,
//         `hospital:${hospitalId}:surges`,
//         `hospital:${hospitalId}:bedspace`,
//       ]

//       hospitalRooms.forEach((room) => {
//         this.server.to(room).emit("click-count-updated", clickUpdatePayload)
//         this.server.to(room).emit("hospital-click-processed", clickUpdatePayload)
//       })

//       // Emit to regional subscribers only if it's a valid location
//       if (result.isValidLocation) {
//         await this.emitToRegionalSubscribers(hospitalId, "hospital-click-updated", clickUpdatePayload)
//       }

//       // If surge was triggered, additional logging
//       if (result.surgeTriggered) {
//         this.logger.log(`🚨 Location-validated surge triggered by click for hospital ${hospitalId}`)

//         // Emit special surge trigger notification
//         const surgeNotification = {
//           ...clickUpdatePayload,
//           surgeData: result.data,
//           eventType: "location_validated_surge",
//         }

//         hospitalRooms.forEach((room) => {
//           this.server.to(room).emit("location-validated-surge-triggered", surgeNotification)
//         })
//       }

//       return {
//         success: true,
//         clickCount: result.clickCount,
//         surgeTriggered: result.surgeTriggered,
//         message: result.message,
//         isValidLocation: result.isValidLocation,
//         distanceFromHospital: result.distanceFromHospital,
//         sessionId,
//       }
//     } catch (error) {
//       this.logger.error("Error handling hospital click:", error)
//       return {
//         success: false,
//         error: error.message,
//         isValidLocation: false,
//       }
//     }
//   }

//   @SubscribeMessage("get-hospital-click-stats")
//   async getHospitalClickStats(@MessageBody() data: { hospitalId: string }, @ConnectedSocket() client: Socket) {
//     try {
//       const stats = await this.hospitalClicksService.getClickStatistics(data.hospitalId)

//       client.emit("hospital-click-stats", {
//         hospitalId: data.hospitalId,
//         ...stats,
//         timestamp: new Date().toISOString(),
//       })

//       return { success: true }
//     } catch (error) {
//       this.logger.error("Error getting hospital click stats:", error)
//       client.emit("hospital-click-stats-error", { error: error.message })
//       return { success: false, error: error.message }
//     }
//   }

//   @SubscribeMessage("get-surge-history")
//   async getSurgeHistory(
//     @MessageBody() data: { hospitalId: string; limit?: number },
//     @ConnectedSocket() client: Socket,
//   ) {
//     try {
//       const { hospitalId, limit = 10 } = data
//       const surgeHistory = await this.hospitalClicksService.getSurgeHistory(hospitalId, limit)

//       client.emit("surge-history", {
//         hospitalId,
//         surgeHistory,
//         timestamp: new Date().toISOString(),
//       })

//       return { success: true }
//     } catch (error) {
//       this.logger.error("Error getting surge history:", error)
//       client.emit("surge-history-error", { error: error.message })
//       return { success: false, error: error.message }
//     }
//   }

//   @SubscribeMessage("subscribe_hospital_clicks")
//   async handleSubscribeHospitalClicks(client: Socket, payload: { hospitalId: string }) {
//     try {
//       const { hospitalId } = payload
//       this.logger.log(`🖱️ Client ${client.id} subscribing to hospital clicks ${hospitalId}`)

//       const roomName = `hospital:${hospitalId}:clicks`
//       await client.join(roomName)

//       if (!this.connectedClients.has(hospitalId)) {
//         this.connectedClients.set(hospitalId, new Set())
//       }
//       this.connectedClients.get(hospitalId).add(client.id)

//       if (!this.clientRooms.has(client.id)) {
//         this.clientRooms.set(client.id, new Set())
//       }
//       this.clientRooms.get(client.id).add(hospitalId)

//       // Send current click statistics with location validation info
//       const stats = await this.hospitalClicksService.getClickStatistics(hospitalId)
//       client.emit("hospital-clicks-data", {
//         hospitalId,
//         ...stats,
//         locationValidation: {
//           enabled: true,
//           radiusKm: 30,
//           surgeWindowMinutes: 30,
//         },
//         timestamp: new Date().toISOString(),
//       })

//       return {
//         success: true,
//         message: `Subscribed to hospital clicks ${hospitalId}`,
//         timestamp: new Date().toISOString(),
//       }
//     } catch (error) {
//       this.logger.error(`❌ Error subscribing to hospital clicks: ${error.message}`)
//       throw new WsException(`Failed to subscribe to clicks: ${error.message}`)
//     }
//   }

  
//     // PRIVATE HELPER METHODS
//     private async sendCurrentSurgeData(client: Socket, hospitalId: string) {
//       try {
//         const surges = await this.surgeModel
//           .find({
//             hospital: hospitalId,
//             status: { $in: ["pending", "active", "in-progress"] },
//           })
//           .exec()
  
//         if (surges.length > 0) {
//           const surgeData = surges.map((surge) => surge.toObject())
  
//           client.emit("initial_surge_data", {
//             hospitalId,
//             surges: surgeData,
//             timestamp: new Date().toISOString(),
//           })
  
//           client.emit("hospital_surges_initial", {
//             hospitalId,
//             surges: surgeData,
//             locationValidated: true,
//             timestamp: new Date().toISOString(),
//           })
  
//           this.logger.log(`📤 Sent ${surges.length} initial surges for hospital ${hospitalId} to client ${client.id}`)
//         } else {
//           this.logger.log(`📭 No active surges found for hospital ${hospitalId}`)
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error sending current surge data: ${error.message}`)
//       }
//     }
  
//     private async sendCurrentRegionalSurgeData(client: Socket, latitude: number, longitude: number, radiusKm: number) {
//       try {
//         const surges = await this.getSurgesInRegion(latitude, longitude, radiusKm)
  
//         if (surges.length > 0) {
//           client.emit("initial_surge_data", {
//             surges,
//             region: { latitude, longitude, radiusKm },
//             timestamp: new Date().toISOString(),
//           })
  
//           client.emit("regional_surges_initial", {
//             surges,
//             region: { latitude, longitude, radiusKm },
//             timestamp: new Date().toISOString(),
//           })
  
//           this.logger.log(`📤 Sent ${surges.length} initial regional surges to client ${client.id}`)
//         } else {
//           this.logger.log(`📭 No active surges found in region ${latitude}, ${longitude} (${radiusKm}km)`)
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error sending current regional surge data: ${error.message}`)
//       }
//     }
  
//     private async sendCurrentBedspaceData(client: Socket, hospitalId: string) {
//       try {
//         let query
  
//         if (this.isValidObjectId(hospitalId)) {
//           query = {
//             $or: [{ hospital: new Types.ObjectId(hospitalId) }, { hospital: hospitalId }],
//           }
//         } else {
//           query = { hospital: hospitalId }
//         }
  
//         const bedspaces = await this.bedspaceModel.find(query).maxTimeMS(5000).exec()
  
//         if (bedspaces.length > 0) {
//           this.logger.log(
//             `📤 Sending initial bedspace data for hospital ${hospitalId}: ${bedspaces.length} bedspaces found`,
//           )
//           client.emit("initial_bedspace_data", {
//             hospitalId,
//             bedspaces,
//             timestamp: new Date().toISOString(),
//           })
  
//           client.emit("initialBedspaceData", {
//             hospitalId,
//             bedspaces,
//             timestamp: new Date().toISOString(),
//           })
//         } else {
//           const hospital = await this.findHospitalByIdOrPlaceId(hospitalId)
  
//           if (hospital) {
//             this.logger.log(`Hospital ${hospitalId} found but no bedspaces available`)
//             client.emit("initial_bedspace_data", {
//               hospitalId,
//               bedspaces: [],
//               message: "No bedspaces found for this hospital",
//               timestamp: new Date().toISOString(),
//             })
//           } else {
//             this.logger.warn(`Hospital with ID ${hospitalId} not found`)
//             client.emit("error", {
//               code: "HOSPITAL_NOT_FOUND",
//               message: `Hospital with ID ${hospitalId} not found`,
//               timestamp: new Date().toISOString(),
//             })
//           }
//         }
//       } catch (error) {
//         this.logger.error(`❌ Error sending current bedspace data: ${error.message}`)
  
//         client.emit("error", {
//           code: "BEDSPACE_DATA_ERROR",
//           message: "Unable to retrieve bedspace data. Please try again later.",
//           timestamp: new Date().toISOString(),
//         })
//       }
//     }
  
//     private async getSurgesInRegion(latitude: number, longitude: number, radiusKm: number): Promise<any[]> {
//       try {
//         const allSurges = await this.surgeModel
//           .find({
//             status: { $in: ["pending", "active", "in-progress"] },
//           })
//           .exec()
  
//         const surgesInRegion = allSurges.filter((surge) => {
//           if (!surge.latitude || !surge.longitude) return false
  
//           const distance = this.calculateDistance(latitude, longitude, surge.latitude, surge.longitude)
  
//           return distance <= radiusKm * 1000
//         })
  
//         return surgesInRegion.map((surge) => surge.toObject())
//       } catch (error) {
//         this.logger.error(`❌ Error getting surges in region: ${error.message}`)
//         return []
//       }
//     }
  
//     private async emitToRegionalSubscribers(hospitalId: string, eventName: string, payload: any) {
//       try {
//         const hospital = await this.hospitalModel.findById(hospitalId).exec()
  
//         if (!hospital || !hospital.latitude || !hospital.longitude) {
//           this.logger.warn(`⚠️ Hospital ${hospitalId} not found or missing coordinates`)
//           return
//         }
  
//         const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys()).filter((room) =>
//           room.startsWith("region:"),
//         )
  
//         this.logger.log(
//           `🌍 Checking ${regionRooms.length} regional rooms for hospital at ${hospital.latitude}, ${hospital.longitude}`,
//         )
  
//         let emittedCount = 0
  
//         for (const room of regionRooms) {
//           try {
//             const [, latStr, lngStr, radiusStr] = room.split(":")
//             const regionLat = Number.parseFloat(latStr)
//             const regionLng = Number.parseFloat(lngStr)
//             const radius = Number.parseFloat(radiusStr) * 1000
  
//             const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude)
  
//             if (distance <= radius) {
//               const roomClients = this.server.sockets.adapter.rooms.get(room)
//               const clientCount = roomClients ? roomClients.size : 0
  
//               this.logger.log(
//                 `📡 Emitting ${eventName} to regional room ${room} (${clientCount} clients, distance: ${Math.round(distance)}m)`,
//               )
//               this.server.to(room).emit(eventName, payload)
//               emittedCount++
//             }
//           } catch (parseError) {
//             this.logger.error(`❌ Error parsing regional room ${room}: ${parseError.message}`)
//           }
//         }
  
//         this.logger.log(`✅ Emitted ${eventName} to ${emittedCount} regional rooms`)
//       } catch (error) {
//         this.logger.error(`❌ Error emitting to regional subscribers: ${error.message}`)
//       }
//     }
  
//     private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//       const R = 6371e3
//       const φ1 = (lat1 * Math.PI) / 180
//       const φ2 = (lat2 * Math.PI) / 180
//       const Δφ = ((lat2 - lat1) * Math.PI) / 180
//       const Δλ = ((lon2 - lon1) * Math.PI) / 180
  
//       const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
//       return R * c
//     }
  
//     private isValidObjectId(id: any): boolean {
//       if (!id || typeof id !== "string") {
//         return false
//       }
  
//       return Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)
//     }
  
//     private async findHospitalByIdOrPlaceId(id: string): Promise<HospitalDocument | null> {
//       try {
//         if (!id) {
//           this.logger.error("Invalid hospital ID: null or undefined")
//           return null
//         }
  
//         const isValidObjectId = id && typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)
  
//         let query
//         if (isValidObjectId) {
//           const hospitalById = await this.hospitalModel
//             .findById(id)
//             .select("_id hospitalName latitude longitude location placeId")
//             .lean()
//             .maxTimeMS(3000)
//             .exec()
  
//           if (hospitalById) {
//             return hospitalById
//           }
  
//           query = { placeId: id }
//         } else {
//           query = { placeId: id }
//         }
  
//         return await this.hospitalModel
//           .findOne(query)
//           .select("_id hospitalName latitude longitude location placeId")
//           .lean()
//           .maxTimeMS(3000)
//           .exec()
//       } catch (error) {
//         this.logger.error(`Error finding hospital: ${error}`)
//         return null
//       }
//     }
  
//     // EVENT HANDLERS
//     @OnEvent("hospital.surge.triggered")
//     async handleLocationValidatedSurgeTriggered(surgeData: SurgeData) {
//       try {
//         this.logger.log(`🚨 LOCATION-VALIDATED SURGE TRIGGERED for hospital ${surgeData.hospitalId}`)
//         this.logger.log(`📍 Contributing locations: ${surgeData.contributingLocations.length} unique locations`)
//         this.logger.log(
//           `🎯 Average click location: ${surgeData.averageClickLocation.latitude}, ${surgeData.averageClickLocation.longitude}`,
//         )
//         this.logger.log(
//           `📏 Distance range: ${Math.round(surgeData.metadata.minDistanceFromHospital / 1000)}km - ${Math.round(surgeData.metadata.maxDistanceFromHospital / 1000)}km`,
//         )
  
//         // Create enhanced surge record in database
//         const newSurge = new this.surgeModel({
//           hospital: surgeData.hospitalId,
//           latitude: surgeData.averageClickLocation.latitude,
//           longitude: surgeData.averageClickLocation.longitude,
//           emergencyType: "location_validated_high_demand",
//           description: `Location-validated surge triggered by ${surgeData.clickCount} clicks from ${surgeData.metadata.totalUniqueSessions} unique sessions within 30km radius`,
//           metadata: {
//             ...surgeData.metadata,
//             clickCount: surgeData.clickCount,
//             triggerType: "location_validated_click_threshold",
//             hospitalLocation: { latitude: surgeData.hospitalInfo.latitude, longitude: surgeData.hospitalInfo.longitude },
//             contributingLocations: surgeData.contributingLocations,
//             averageClickLocation: surgeData.averageClickLocation,
//             locationValidation: {
//               radiusKm: 30,
//               allClicksValidated: true,
//               minDistanceKm: Math.round(surgeData.metadata.minDistanceFromHospital / 1000),
//               maxDistanceKm: Math.round(surgeData.metadata.maxDistanceFromHospital / 1000),
//             },
//           },
//           status: "active",
//         })
  
//         const savedSurge = await newSurge.save()
  
//         // Prepare enhanced event payload
//         const eventPayload = {
//           hospitalId: surgeData.hospitalId,
//           surge: savedSurge.toObject(),
//           triggerData: surgeData,
//           timestamp: new Date().toISOString(),
//           eventId: `location_validated_surge_${Date.now()}`,
//           locationsMap: surgeData.contributingLocations.map((loc) => ({
//             sessionId: loc.sessionId,
//             coordinates: [loc.longitude, loc.latitude], // GeoJSON format
//             distanceFromHospitalKm: Math.round(loc.distanceFromHospital / 1000),
//             timestamp: loc.timestamp,
//           })),
//           hospitalLocation: {
//             coordinates: [surgeData.hospitalInfo.longitude, surgeData.hospitalInfo.latitude],
//           },
//           averageClickLocation: {
//             coordinates: [surgeData.averageClickLocation.longitude, surgeData.averageClickLocation.latitude],
//           },
//         }
  
//         // Emit to all hospital rooms
//         const hospitalRooms = [
//           `hospital:${surgeData.hospitalId}:surges`,
//           `hospital:${surgeData.hospitalId}:clicks`,
//           `hospital:${surgeData.hospitalId}:bedspace`,
//         ]
  
//         hospitalRooms.forEach((room) => {
//           this.server.to(room).emit("surge_created", eventPayload)
//           this.server.to(room).emit("location-validated-surge-created", eventPayload)
//           this.server.to(room).emit("hospital-click-threshold-reached", eventPayload)
//           this.server.to(room).emit("surge-with-locations", eventPayload)
//         })
  
//         // Emit to regional subscribers with enhanced location data
//         await this.emitToRegionalSubscribers(surgeData.hospitalId, "surge_created", eventPayload)
//         await this.emitToRegionalSubscribers(surgeData.hospitalId, "location-validated-surge-created", eventPayload)
  
//         // Global broadcast with location information
//         this.server.emit("global_location_validated_surge_created", eventPayload)
  
//         // Emit for other services
//         this.eventEmitter.emit("surge.created", eventPayload)
  
//         this.logger.log(`✅ Location-validated surge created and broadcasted: ${savedSurge._id}`)
//         this.logger.log(
//           `📊 Surge stats: ${surgeData.clickCount} clicks, ${surgeData.metadata.totalUniqueSessions} sessions, surge #${surgeData.metadata.surgeNumber}`,
//         )
//       } catch (error) {
//         this.logger.error(`❌ Error handling location-validated surge trigger: ${error.message}`, error.stack)
//       }
//     }
    
//     @OnEvent("surge.created")
//     async handleSurgeCreated(payload: { hospitalId: string; surge: any }) {
//       this.logger.log(`🚨 SURGE CREATED EVENT RECEIVED for hospital ${payload.hospitalId}`)
  
//       const eventPayload = {
//         ...payload,
//         timestamp: new Date().toISOString(),
//         eventId: `surge_create_${Date.now()}`,
//       }
  
//       const roomName = `hospital:${payload.hospitalId}:surges`
//       const room = this.server.sockets.adapter.rooms.get(roomName)
//       const clientCount = room ? room.size : 0
  
//       this.logger.log(`📊 Room ${roomName} has ${clientCount} clients`)
  
//       this.server.to(roomName).emit("surge_created", eventPayload)
//       this.server.to(roomName).emit("new_surge", eventPayload)
//       this.server.to(roomName).emit("surge.created", eventPayload)
//       this.server.to(roomName).emit("emergency_surge", eventPayload)
  
//       this.server.emit("global_surge_created", eventPayload)
  
//       await this.emitToRegionalSubscribers(payload.hospitalId, "surge_created", eventPayload)
//       await this.emitToRegionalSubscribers(payload.hospitalId, "regional_surge_created", eventPayload)
//       await this.emitToRegionalSubscribers(payload.hospitalId, "hospital_surge_created", eventPayload)
  
//       this.logger.log(`✅ Surge created event emitted to ${clientCount} clients in room ${roomName}`)
//     }
  
//     @OnEvent("surge.updated")
//     async handleSurgeUpdated(payload: { hospitalId: string; surge: any }) {
//       this.logger.log(`🔄 SURGE UPDATED EVENT RECEIVED for hospital ${payload.hospitalId}`)
  
//       const eventPayload = {
//         ...payload,
//         timestamp: new Date().toISOString(),
//         eventId: `surge_update_${Date.now()}`,
//       }
  
//       const roomName = `hospital:${payload.hospitalId}:surges`
//       const room = this.server.sockets.adapter.rooms.get(roomName)
//       const clientCount = room ? room.size : 0
  
//       this.logger.log(`📊 Room ${roomName} has ${clientCount} clients`)
  
//       this.server.to(roomName).emit("surge_updated", eventPayload)
//       this.server.to(roomName).emit("surge.updated", eventPayload)
//       this.server.to(roomName).emit("hospital_surge_updated", eventPayload)
  
//       this.server.emit("global_surge_updated", eventPayload)
  
//       await this.emitToRegionalSubscribers(payload.hospitalId, "surge_updated", eventPayload)
//       await this.emitToRegionalSubscribers(payload.hospitalId, "hospital_surge_updated", eventPayload)
  
//       this.logger.log(`✅ Surge updated event emitted to ${clientCount} clients in room ${roomName}`)
//     }
  
//     @OnEvent("bedspace.updated")
//     handleBedspaceUpdated(payload: { hospitalId: string; bedspace: any }) {
//       try {
//         if (!payload || !payload.hospitalId) {
//           this.logger.error("Invalid bedspace update payload")
//           return
//         }
  
//         this.logger.log(`🛏️ Bedspace updated for hospital ${payload.hospitalId}`)
  
//         const eventPayload = {
//           ...payload,
//           timestamp: new Date().toISOString(),
//           eventId: `bedspace_update_${Date.now()}`,
//         }
  
//         const roomName = `hospital:${payload.hospitalId}:bedspace`
//         this.logger.log(`Emitting bedspace_updated event to room ${roomName}`)
//         this.server.to(roomName).emit("bedspace_updated", eventPayload)
//         this.server.to(roomName).emit("bedSpaceUpdated", eventPayload)
  
//         // Also emit to general hospital room for backward compatibility
//         this.server.to(`hospital:${payload.hospitalId}`).emit("bedspace_updated", eventPayload)
//       } catch (error) {
//         this.logger.error(`Error handling bedspace update: ${error.message}`)
//       }
//     }
  
//     @OnEvent("emergency.created")
//     handleEmergencyCreated(payload: { hospitalId: string; emergency: any }) {
//       try {
//         if (!payload || !payload.hospitalId) {
//           this.logger.error("Invalid emergency created payload")
//           return
//         }
  
//         this.logger.log(`🚨 Emergency created for hospital ${payload.hospitalId}`)
  
//         const eventPayload = {
//           ...payload,
//           timestamp: new Date().toISOString(),
//           eventId: `emergency_create_${Date.now()}`,
//         }
  
//         const roomName = `hospital:${payload.hospitalId}:bedspace`
//         this.logger.log(`Emitting emergency_created event to room ${roomName}`)
//         this.server.to(roomName).emit("emergency_created", eventPayload)
  
//         // Also emit to general emergency channel
//         this.server.to("emergency_alerts").emit("emergency_alert", eventPayload)
//       } catch (error) {
//         this.logger.error(`Error handling emergency creation: ${error.message}`)
//       }
//     }
  
//     @OnEvent("hospital.status_changed")
//     handleHospitalStatusChanged(payload: { hospitalId: string; status: string }) {
//       try {
//         if (!payload || !payload.hospitalId) {
//           this.logger.error("Invalid hospital status change payload")
//           return
//         }
  
//         this.logger.log(`🏥 Hospital ${payload.hospitalId} status changed to ${payload.status}`)
  
//         const eventPayload = {
//           ...payload,
//           timestamp: new Date().toISOString(),
//           eventId: `status_change_${Date.now()}`,
//         }
  
//         this.logger.log("Emitting hospital_status_changed event to all clients")
//         this.server.emit("hospital_status_changed", eventPayload)
//       } catch (error) {
//         this.logger.error(`Error handling hospital status change: ${error.message}`)
//       }
//     }
  
//     // DEBUG METHODS
//     @SubscribeMessage("get_connection_stats")
//     handleGetConnectionStats(client: Socket) {
//       const totalClients = this.server.sockets.sockets.size
//       const rooms = Array.from(this.server.sockets.adapter.rooms.keys())
//       const hospitalRooms = rooms.filter((room) => room.startsWith("hospital:"))
//       const regionalRooms = rooms.filter((room) => room.startsWith("region:"))
//       const generalChannels = rooms.filter((room) => !room.startsWith("hospital:") && !room.startsWith("region:"))
  
//       const stats = {
//         totalClients,
//         totalRooms: rooms.length,
//         hospitalRooms: hospitalRooms.length,
//         regionalRooms: regionalRooms.length,
//         generalChannels: generalChannels.length,
//         clientRooms: this.clientRooms.get(client.id) || new Set(),
//         clientChannels: this.clientChannels.get(client.id) || new Set(),
//         sessionId: this.clientSessions.get(client.id),
//         locationValidation: {
//           enabled: true,
//           radiusKm: 30,
//           surgeWindowMinutes: 30,
//         },
//         timestamp: new Date().toISOString(),
//       }
  
//       this.logger.log(`📊 Connection stats requested by ${client.id}:`, stats)
  
//       client.emit("connection_stats", stats)
  
//       return stats
//     }

//     private checkRateLimit(sessionId: string): boolean {
//       const now = Date.now()
//       const rateData = this.clickRateLimit.get(sessionId)
  
//       if (!rateData) {
//         this.clickRateLimit.set(sessionId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW })
//         return true
//       }
  
//       if (now > rateData.resetTime) {
//         // Reset the rate limit window
//         this.clickRateLimit.set(sessionId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW })
//         return true
//       }
  
//       if (rateData.count >= this.CLICK_RATE_LIMIT) {
//         return false
//       }
  
//       rateData.count++
//       return true
//     }
//   }
  


import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WsException,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets"
import type { Server, Socket } from "socket.io"
import { Logger, Injectable } from "@nestjs/common"
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter"
import { JwtService } from "@nestjs/jwt"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import { Hospital, type HospitalDocument } from "../../hospital/schemas/hospital.schema"
import { Bedspace, type BedspaceDocument } from "../../bedspace/schemas/bedspace.schema"
import { Surge, type SurgeDocument } from "../../surge/schema/surge.schema"
import { HospitalClick, type HospitalClickDocument } from "../../hospital-click/schemas/hospital-click.schema"
import { HospitalClicksService } from "../../hospital-click/hospital-clicks.service"

// Enhanced interfaces for hospital click functionality
interface ClickData {
  hospitalId: string
  sessionId: string
  latitude: number
  longitude: number
  userAgent?: string
  ipAddress?: string
}

interface SurgeData {
  hospitalId: string
  clickCount: number
  surgeTriggered: boolean
  contributingClicks: Array<{
    sessionId: string
    latitude: number
    longitude: number
    timestamp: Date
    distanceFromHospital: number
    userAgent?: string
    ipAddress?: string
  }>
  averageClickLocation: {
    latitude: number
    longitude: number
  }
  hospitalInfo: {
    hospitalId: string
    name: string
    latitude: number
    longitude: number
  }
  metadata: {
    surgeNumber: number
    totalUniqueSessions: number
    timeToSurge: number
    minDistanceFromHospital: number
    maxDistanceFromHospital: number
    averageDistanceFromHospital: number
  }
}

interface ClickResult {
  clickCount: number
  surgeTriggered: boolean
  message: string
  isValidLocation: boolean
  distanceFromHospital: number
  hospitalInfo?: any
  data?: SurgeData
}

// Unified WebSocket gateway that handles all hospital functionality
@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 10000,
  pingTimeout: 5000,
})
@Injectable()
export class UnifiedHospitalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private logger = new Logger("UnifiedHospitalGateway")

  // Client tracking
  private connectedClients: Map<string, Set<string>> = new Map()
  private clientRooms: Map<string, Set<string>> = new Map()
  private clientChannels: Map<string, Set<string>> = new Map()
  private clientSessions: Map<string, string> = new Map() // clientId -> sessionId

  // Subscription tracking
  private regionalSubscriptions: Map<string, { lat: number; lng: number; radius: number }> = new Map()

  // Click tracking for rate limiting and validation
  private clickRateLimit: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly CLICK_RATE_LIMIT = 10 // clicks per minute per session
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly hospitalClicksService: HospitalClicksService,
    @InjectModel(Hospital.name) private readonly hospitalModel: Model<HospitalDocument>,
    @InjectModel(Bedspace.name) private readonly bedspaceModel: Model<BedspaceDocument>,
    @InjectModel(Surge.name) private readonly surgeModel: Model<SurgeDocument>,
    @InjectModel(HospitalClick.name) private readonly hospitalClickModel: Model<HospitalClickDocument>,
  ) { }

  afterInit(server: Server) {
    this.logger.log("🚀 Enhanced Unified Hospital WebSocket Gateway initialized with robust click handling")

    // Enhanced connection setup with click validation
    server.use((socket: Socket, next) => {
      this.logger.log(`🔌 Socket middleware: ${socket.id} from ${socket.handshake.address}`)

      // Log connection details
      this.logger.log(`📋 Connection details:`, {
        id: socket.id,
        transport: socket.conn.transport.name,
        address: socket.handshake.address,
        userAgent: socket.handshake.headers["user-agent"],
        origin: socket.handshake.headers.origin,
      })

      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1]

        // Allow anonymous connections for public data
        if (!token) {
          socket.data.anonymous = true
          return next()
        }

        // Verify token
        const payload = this.jwtService.verify(token)
        socket.data.user = payload
        socket.data.authenticated = true
        next()
      } catch (error) {
        // Don't reject connection, just mark as anonymous
        socket.data.anonymous = true
        next()
      }
    })

    // Enhanced error handling
    server.on("connection_error", (err) => {
      this.logger.error(`❌ Connection error: ${err.message}`)
    })

    this.logger.log("✅ Unified WebSocket server ready with enhanced click validation")
    this.logger.log(`🌐 Features: Location validation (30km), Rate limiting, Surge detection`)
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected to unified gateway: ${client.id}`)

    // Generate unique session ID for this client
    const sessionId = `session_${client.id}_${Date.now()}`
    this.clientSessions.set(client.id, sessionId)

    // Initialize client tracking
    if (!this.clientRooms.has(client.id)) {
      this.clientRooms.set(client.id, new Set())
    }
    if (!this.clientChannels.has(client.id)) {
      this.clientChannels.set(client.id, new Set())
    }

    // Initialize rate limiting for this session
    this.clickRateLimit.set(sessionId, { count: 0, resetTime: Date.now() + this.RATE_LIMIT_WINDOW })

    // Send immediate connection confirmation
    client.emit("connection_status", {
      connected: true,
      clientId: client.id,
      sessionId,
      timestamp: new Date().toISOString(),
      transport: client.conn.transport.name,
      message: "Connected to enhanced hospital monitoring system with robust click handling",
      modules: ["surge", "bedspace", "hospital-clicks", "general"],
      authenticated: client.data.authenticated || false,
      clickValidation: {
        locationValidation: true,
        radiusKm: 30,
        rateLimit: this.CLICK_RATE_LIMIT,
        rateLimitWindowMs: this.RATE_LIMIT_WINDOW,
        surgeWindowMinutes: 30,
      },
    })

    // Send welcome message with available events
    client.emit("welcome", {
      message: "Welcome to the Enhanced Unified Hospital Monitoring System",
      clientId: client.id,
      sessionId,
      timestamp: new Date().toISOString(),
      modules: ["surge", "bedspace", "hospital-clicks", "general"],
      availableEvents: [
        // Hospital Click Events
        "hospital-click",
        "get-hospital-click-stats",
        "get-surge-history",
        "subscribe_hospital_clicks",
        "reset-hospital-clicks",
        // Surge Events
        "subscribe_hospital_surges",
        "subscribe_regional_surges",
        "create_surge",
        // Bedspace Events
        "subscribe_hospital",
        "updateBedSpace",
        "get_initial_bedspace_data",
        // General Events
        "subscribe_channel",
        "get_connection_stats",
        "ping",
      ],
    })

    // Set up heartbeat
    this.setupHeartbeat(client, sessionId)

    this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`)

    // Broadcast connection event
    client.broadcast.emit("client_connected", {
      clientId: client.id,
      sessionId,
      timestamp: new Date().toISOString(),
      totalClients: this.server.sockets.sockets.size,
    })
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected from unified gateway: ${client.id}`)

    const sessionId = this.clientSessions.get(client.id)

    // Clear heartbeat interval
    if (client.data.heartbeatInterval) {
      clearInterval(client.data.heartbeatInterval)
    }

    // Cleanup client tracking
    this.clientSessions.delete(client.id)
    if (sessionId) {
      this.clickRateLimit.delete(sessionId)
    }

    // Remove client from all rooms and channels
    this.cleanupClientSubscriptions(client.id)

    this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`)
  }

  // ==================== ENHANCED HOSPITAL CLICK FUNCTIONALITY ====================

  @SubscribeMessage("hospital-click")
  async handleHospitalClick(
    @MessageBody() data: {
      hospitalId: string
      latitude: number
      longitude: number
      userAgent?: string
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { hospitalId, latitude, longitude, userAgent } = data
      const sessionId = this.clientSessions.get(client.id)

      if (!sessionId) {
        throw new WsException("Session not found")
      }

      // Validate required fields
      if (!hospitalId || latitude === undefined || longitude === undefined) {
        throw new WsException("Hospital ID, latitude, and longitude are required")
      }

      // Check rate limiting
      if (!this.checkRateLimit(sessionId)) {
        throw new WsException("Rate limit exceeded. Please wait before clicking again.")
      }

      this.logger.log(`🖱️ Hospital click received: ${hospitalId} from ${sessionId} at ${latitude}, ${longitude}`)

      const clickData: ClickData = {
        hospitalId,
        sessionId,
        latitude,
        longitude,
        userAgent: userAgent || client.handshake.headers["user-agent"],
        ipAddress: client.handshake.address,
      }

      const result = await this.hospitalClicksService.handleClick(clickData)

      // Enhanced click update payload
      const clickUpdatePayload = {
        hospitalId,
        clickCount: result.clickCount,
        surgeTriggered: result.surgeTriggered,
        message: result.message,
        isValidLocation: result.isValidLocation,
        distanceFromHospital: result.distanceFromHospital,
        timestamp: new Date().toISOString(),
        sessionId,
        location: { latitude, longitude },
        hospitalInfo: result.hospitalInfo,
        validationInfo: {
          radiusKm: 30,
          withinRadius: result.isValidLocation,
          distanceKm: Math.round(result.distanceFromHospital / 1000),
        },
        eventId: `click_${Date.now()}`,
      }

      // Emit to hospital-specific rooms
      await this.emitToHospitalRooms(hospitalId, "click-count-updated", clickUpdatePayload)
      await this.emitToHospitalRooms(hospitalId, "hospital-click-processed", clickUpdatePayload)

      // Emit to regional subscribers only if it's a valid location
      if (result.isValidLocation) {
        await this.emitToRegionalSubscribers(hospitalId, "hospital-click-updated", clickUpdatePayload)
      }

      // Handle surge trigger
      if (result.surgeTriggered && result.data) {
        await this.handleSurgeTriggered(result.data, clickUpdatePayload)
      }

      // Send response to client
      client.emit("hospital-click-response", {
        success: true,
        clickCount: result.clickCount,
        surgeTriggered: result.surgeTriggered,
        message: result.message,
        isValidLocation: result.isValidLocation,
        distanceFromHospital: result.distanceFromHospital,
        sessionId,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        clickCount: result.clickCount,
        surgeTriggered: result.surgeTriggered,
        message: result.message,
        isValidLocation: result.isValidLocation,
        distanceFromHospital: result.distanceFromHospital,
        sessionId,
      }
    } catch (error) {
      this.logger.error("Error handling hospital click:", error)

      client.emit("hospital-click-error", {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return {
        success: false,
        error: error.message,
        isValidLocation: false,
      }
    }
  }

  @SubscribeMessage("get-hospital-click-stats")
  async getHospitalClickStats(@MessageBody() data: { hospitalId: string }, @ConnectedSocket() client: Socket) {
    try {
      const { hospitalId } = data

      if (!hospitalId) {
        throw new WsException("Hospital ID is required")
      }

      const stats = await this.hospitalClicksService.getClickStatistics(hospitalId)

      const statsPayload = {
        hospitalId,
        ...stats,
        timestamp: new Date().toISOString(),
        eventId: `stats_${Date.now()}`,
      }

      client.emit("hospital-click-stats", statsPayload)

      this.logger.log(`📊 Click stats sent for hospital ${hospitalId}`)

      return { success: true, stats: statsPayload }
    } catch (error) {
      this.logger.error("Error getting hospital click stats:", error)

      client.emit("hospital-click-stats-error", {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return { success: false, error: error.message }
    }
  }

  @SubscribeMessage("get-surge-history")
  async getSurgeHistory(
    @MessageBody() data: { hospitalId: string; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { hospitalId, limit = 10 } = data

      if (!hospitalId) {
        throw new WsException("Hospital ID is required")
      }

      const surgeHistory = await this.hospitalClicksService.getSurgeHistory(hospitalId, limit)

      const historyPayload = {
        hospitalId,
        surgeHistory,
        limit,
        timestamp: new Date().toISOString(),
        eventId: `history_${Date.now()}`,
      }

      client.emit("surge-history", historyPayload)

      this.logger.log(`📜 Surge history sent for hospital ${hospitalId} (${surgeHistory.length} records)`)

      return { success: true, history: historyPayload }
    } catch (error) {
      this.logger.error("Error getting surge history:", error)

      client.emit("surge-history-error", {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return { success: false, error: error.message }
    }
  }

  @SubscribeMessage("subscribe_hospital_clicks")
  async handleSubscribeHospitalClicks(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { hospitalId: string },
  ) {
    try {
      const { hospitalId } = payload

      if (!hospitalId) {
        throw new WsException("Hospital ID is required")
      }

      this.logger.log(`🖱️ Client ${client.id} subscribing to hospital clicks ${hospitalId}`)

      const roomName = `hospital:${hospitalId}:clicks`
      await client.join(roomName)

      // Update client tracking
      this.updateClientTracking(client.id, hospitalId)

      // Send current click statistics
      const stats = await this.hospitalClicksService.getClickStatistics(hospitalId)

      const initialData = {
        hospitalId,
        ...stats,
        locationValidation: {
          enabled: true,
          radiusKm: 30,
          surgeWindowMinutes: 30,
        },
        timestamp: new Date().toISOString(),
        eventId: `initial_clicks_${Date.now()}`,
      }

      client.emit("hospital-clicks-data", initialData)
      client.emit("hospital-clicks-subscription-confirmed", {
        hospitalId,
        success: true,
        roomName,
        timestamp: new Date().toISOString(),
      })

      this.logger.log(`✅ Client ${client.id} subscribed to hospital clicks ${hospitalId}`)

      return {
        success: true,
        message: `Subscribed to hospital clicks ${hospitalId}`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error subscribing to hospital clicks: ${error.message}`)
      throw new WsException(`Failed to subscribe to clicks: ${error.message}`)
    }
  }

  @SubscribeMessage("reset-hospital-clicks")
  async resetHospitalClicks(
    @MessageBody() data: { hospitalId: string; adminToken?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { hospitalId, adminToken } = data

      if (!hospitalId) {
        throw new WsException("Hospital ID is required")
      }

      // Verify admin privileges (you can implement your own auth logic)
      if (!this.verifyAdminAccess(client, adminToken)) {
        throw new WsException("Admin access required for reset operation")
      }

      this.logger.log(`🔄 Resetting hospital clicks for ${hospitalId}`)

      await this.hospitalClicksService.resetClicks(hospitalId)

      const resetPayload = {
        hospitalId,
        clickCount: 0,
        surgeTriggered: false,
        message: "Hospital clicks reset successfully",
        timestamp: new Date().toISOString(),
        eventId: `reset_${Date.now()}`,
        resetBy: client.data.user?.id || "anonymous",
      }

      // Emit to all hospital rooms
      await this.emitToHospitalRooms(hospitalId, "click-count-updated", resetPayload)
      await this.emitToHospitalRooms(hospitalId, "hospital-clicks-reset", resetPayload)

      this.logger.log(`✅ Hospital clicks reset for ${hospitalId}`)

      return { success: true, message: "Hospital clicks reset successfully" }
    } catch (error) {
      this.logger.error("Error resetting hospital clicks:", error)
      return { success: false, error: error.message }
    }
  }

  // ==================== SURGE MODULE METHODS ====================

  @SubscribeMessage("subscribe_hospital_surges")
  async handleSubscribeHospitalSurges(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { hospitalId: string },
  ) {
    try {
      const { hospitalId } = payload

      if (!hospitalId) {
        throw new WsException("Hospital ID is required")
      }

      this.logger.log(`🏥 Client ${client.id} subscribing to hospital surges ${hospitalId}`)

      const roomName = `hospital:${hospitalId}:surges`
      await client.join(roomName)

      this.updateClientTracking(client.id, hospitalId)

      await this.sendCurrentSurgeData(client, hospitalId)

      client.emit("hospital_subscription_confirmed", {
        hospitalId,
        success: true,
        timestamp: new Date().toISOString(),
        locationValidation: true,
      })

      this.logger.log(`✅ Client ${client.id} successfully subscribed to hospital surges ${hospitalId}`)

      return {
        success: true,
        message: `Subscribed to hospital surges ${hospitalId}`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error subscribing to hospital surges: ${error.message}`)
      throw new WsException(`Failed to subscribe to surges: ${error.message}`)
    }
  }

  @SubscribeMessage("subscribe_regional_surges")
  async handleSubscribeRegionalSurges(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      latitude: number
      longitude: number
      radius: number
      radiusKm?: number
    },
  ) {
    try {
      const { latitude, longitude, radius, radiusKm } = payload
      const actualRadius = radiusKm || radius / 1000

      this.logger.log(
        `🌍 Client ${client.id} subscribing to regional surges at ${latitude}, ${longitude} within ${actualRadius}km`,
      )

      const roomName = `region:${latitude}:${longitude}:${actualRadius}`
      await client.join(roomName)

      this.regionalSubscriptions.set(roomName, {
        lat: latitude,
        lng: longitude,
        radius: actualRadius * 1000,
      })

      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set())
      }
      this.clientRooms.get(client.id).add(roomName)

      await this.sendCurrentRegionalSurgeData(client, latitude, longitude, actualRadius)

      client.emit("regional_subscription_confirmed", {
        latitude,
        longitude,
        radiusKm: actualRadius,
        success: true,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: `Subscribed to regional surges within ${actualRadius}km`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error subscribing to regional surges: ${error.message}`)
      throw new WsException(`Failed to subscribe to regional surges: ${error.message}`)
    }
  }

  // ==================== BEDSPACE MODULE METHODS ====================

  @SubscribeMessage("subscribe_hospital")
  async handleSubscribeHospital(@ConnectedSocket() client: Socket, @MessageBody() payload: { hospitalId: string }) {
    try {
      const { hospitalId } = payload

      if (!hospitalId) {
        throw new WsException("Hospital ID is required")
      }

      this.logger.log(`🏥 Client ${client.id} subscribing to hospital bedspace ${hospitalId}`)

      const roomName = `hospital:${hospitalId}:bedspace`
      await client.join(roomName)

      this.updateClientTracking(client.id, hospitalId)

      await this.sendCurrentBedspaceData(client, hospitalId)

      return {
        success: true,
        message: `Subscribed to hospital bedspace ${hospitalId}`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error subscribing to hospital bedspace: ${error.message}`)
      throw new WsException(`Failed to subscribe: ${error.message}`)
    }
  }

  @SubscribeMessage("updateBedSpace")
  async handleUpdateBedSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      unitId: string
      availableBeds: number
      hospitalId?: string
    },
  ) {
    try {
      const { unitId, availableBeds, hospitalId } = payload

      this.logger.log(`🛏️ Updating bed space via WebSocket: unitId=${unitId}, availableBeds=${availableBeds}`)

      // Find and update the bedspace
      const bedspace = await this.bedspaceModel.findById(unitId)

      if (!bedspace) {
        throw new WsException("Bedspace not found")
      }

      bedspace.availableBeds = availableBeds
      bedspace.occupiedBeds = bedspace.totalBeds - availableBeds

      const updatedBedspace = await bedspace.save()

      const eventPayload = {
        hospitalId: hospitalId || bedspace.hospital.toString(),
        bedspace: updatedBedspace.toObject(),
        timestamp: new Date().toISOString(),
        eventId: `bedspace_update_${Date.now()}`,
      }

      // Emit to hospital bedspace room
      const roomName = `hospital:${eventPayload.hospitalId}:bedspace`
      this.server.to(roomName).emit("bedspace_updated", eventPayload)
      this.server.to(roomName).emit("bedSpaceUpdated", eventPayload)

      // Emit event for other services
      this.eventEmitter.emit("bedspace.updated", eventPayload)

      this.logger.log(`✅ Bedspace updated and emitted: ${updatedBedspace._id}`)

      return {
        success: true,
        message: "Bedspace updated successfully",
        data: updatedBedspace.toObject(),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error updating bedspace: ${error.message}`)
      throw new WsException(`Failed to update bedspace: ${error.message}`)
    }
  }

  // ==================== EVENT HANDLERS ====================

  @OnEvent("hospital.surge.triggered")
  async handleLocationValidatedSurgeTriggered(surgeData: SurgeData) {
    try {
      this.logger.log(`🚨 LOCATION-VALIDATED SURGE TRIGGERED for hospital ${surgeData.hospitalId}`)
      this.logger.log(`📍 Contributing locations: ${surgeData.contributingClicks.length} unique locations`)
      this.logger.log(
        `🎯 Average click location: ${surgeData.averageClickLocation.latitude}, ${surgeData.averageClickLocation.longitude}`,
      )

      // Create enhanced surge record in database
      const newSurge = new this.surgeModel({
        hospital: surgeData.hospitalId,
        latitude: surgeData.averageClickLocation.latitude,
        longitude: surgeData.averageClickLocation.longitude,
        emergencyType: "location_validated_high_demand",
        description: `Location-validated surge triggered by ${surgeData.clickCount} clicks from ${surgeData.metadata.totalUniqueSessions} unique sessions within 30km radius`,
        metadata: {
          ...surgeData.metadata,
          clickCount: surgeData.clickCount,
          triggerType: "location_validated_click_threshold",
          hospitalLocation: {
            latitude: surgeData.hospitalInfo.latitude,
            longitude: surgeData.hospitalInfo.longitude,
          },
          contributingClicks: surgeData.contributingClicks,
          averageClickLocation: surgeData.averageClickLocation,
          locationValidation: {
            radiusKm: 30,
            allClicksValidated: true,
            minDistanceKm: Math.round(surgeData.metadata.minDistanceFromHospital / 1000),
            maxDistanceKm: Math.round(surgeData.metadata.maxDistanceFromHospital / 1000),
          },
        },
        status: "active",
      })

      const savedSurge = await newSurge.save()

      // Prepare enhanced event payload
      const eventPayload = {
        hospitalId: surgeData.hospitalId,
        surge: savedSurge.toObject(),
        triggerData: surgeData,
        timestamp: new Date().toISOString(),
        eventId: `location_validated_surge_${Date.now()}`,
        locationsMap: surgeData.contributingClicks.map((click) => ({
          sessionId: click.sessionId,
          coordinates: [click.longitude, click.latitude], // GeoJSON format
          distanceFromHospitalKm: Math.round(click.distanceFromHospital / 1000),
          timestamp: click.timestamp,
        })),
        hospitalLocation: {
          coordinates: [surgeData.hospitalInfo.longitude, surgeData.hospitalInfo.latitude],
        },
        averageClickLocation: {
          coordinates: [surgeData.averageClickLocation.longitude, surgeData.averageClickLocation.latitude],
        },
      }

      // Emit to all hospital rooms
      await this.emitToHospitalRooms(surgeData.hospitalId, "surge_created", eventPayload)
      await this.emitToHospitalRooms(surgeData.hospitalId, "location-validated-surge-created", eventPayload)
      await this.emitToHospitalRooms(surgeData.hospitalId, "hospital-click-threshold-reached", eventPayload)

      // Emit to regional subscribers
      await this.emitToRegionalSubscribers(surgeData.hospitalId, "surge_created", eventPayload)
      await this.emitToRegionalSubscribers(surgeData.hospitalId, "location-validated-surge-created", eventPayload)

      // Global broadcast
      this.server.emit("global_location_validated_surge_created", eventPayload)

      // Emit for other services
      this.eventEmitter.emit("surge.created", eventPayload)

      this.logger.log(`✅ Location-validated surge created and broadcasted: ${savedSurge._id}`)
    } catch (error) {
      this.logger.error(`❌ Error handling location-validated surge trigger: ${error.message}`, error.stack)
    }
  }

  // ==================== UTILITY METHODS ====================

  @SubscribeMessage("ping")
  handlePing(@ConnectedSocket() client: Socket) {
    this.logger.log(`🏓 Ping received from client ${client.id}`)
    return { event: "pong", data: { timestamp: new Date().toISOString() } }
  }

  @SubscribeMessage("get_connection_stats")
  handleGetConnectionStats(@ConnectedSocket() client: Socket) {
    const totalClients = this.server.sockets.sockets.size
    const rooms = Array.from(this.server.sockets.adapter.rooms.keys())
    const hospitalRooms = rooms.filter((room) => room.startsWith("hospital:"))
    const regionalRooms = rooms.filter((room) => room.startsWith("region:"))

    const stats = {
      totalClients,
      totalRooms: rooms.length,
      hospitalRooms: hospitalRooms.length,
      regionalRooms: regionalRooms.length,
      clientRooms: this.clientRooms.get(client.id) || new Set(),
      clientChannels: this.clientChannels.get(client.id) || new Set(),
      sessionId: this.clientSessions.get(client.id),
      clickValidation: {
        locationValidation: true,
        radiusKm: 30,
        rateLimit: this.CLICK_RATE_LIMIT,
        rateLimitWindowMs: this.RATE_LIMIT_WINDOW,
      },
      timestamp: new Date().toISOString(),
    }

    client.emit("connection_stats", stats)
    return stats
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private setupHeartbeat(client: Socket, sessionId: string) {
    client.emit("heartbeat", {
      timestamp: new Date().toISOString(),
      message: "Initial heartbeat",
    })

    const interval = setInterval(() => {
      if (client.connected) {
        client.emit("heartbeat", {
          timestamp: new Date().toISOString(),
          clientId: client.id,
          sessionId,
        })
      } else {
        clearInterval(interval)
      }
    }, 30000)

    client.data.heartbeatInterval = interval
  }

  private checkRateLimit(sessionId: string): boolean {
    const now = Date.now()
    const rateData = this.clickRateLimit.get(sessionId)

    if (!rateData) {
      this.clickRateLimit.set(sessionId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW })
      return true
    }

    if (now > rateData.resetTime) {
      // Reset the rate limit window
      this.clickRateLimit.set(sessionId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW })
      return true
    }

    if (rateData.count >= this.CLICK_RATE_LIMIT) {
      return false
    }

    rateData.count++
    return true
  }

  private updateClientTracking(clientId: string, hospitalId: string) {
    if (!this.connectedClients.has(hospitalId)) {
      this.connectedClients.set(hospitalId, new Set())
    }
    this.connectedClients.get(hospitalId).add(clientId)

    if (!this.clientRooms.has(clientId)) {
      this.clientRooms.set(clientId, new Set())
    }
    this.clientRooms.get(clientId).add(hospitalId)
  }

  private cleanupClientSubscriptions(clientId: string) {
    if (this.clientRooms.has(clientId)) {
      const rooms = this.clientRooms.get(clientId)
      rooms.forEach((room) => {
        if (this.connectedClients.has(room)) {
          this.connectedClients.get(room).delete(clientId)
        }
      })
      this.clientRooms.delete(clientId)
    }

    if (this.clientChannels.has(clientId)) {
      this.clientChannels.delete(clientId)
    }
  }

  private async emitToHospitalRooms(hospitalId: string, eventName: string, payload: any) {
    const hospitalRooms = [
      `hospital:${hospitalId}:clicks`,
      `hospital:${hospitalId}:surges`,
      `hospital:${hospitalId}:bedspace`,
    ]

    hospitalRooms.forEach((room) => {
      this.server.to(room).emit(eventName, payload)
    })
  }

  private async handleSurgeTriggered(surgeData: SurgeData, clickPayload: any) {
    this.logger.log(`🚨 Location-validated surge triggered by click for hospital ${surgeData.hospitalId}`)

    const surgeNotification = {
      ...clickPayload,
      surgeData,
      eventType: "location_validated_surge",
      timestamp: new Date().toISOString(),
    }

    await this.emitToHospitalRooms(surgeData.hospitalId, "location-validated-surge-triggered", surgeNotification)
    await this.emitToRegionalSubscribers(surgeData.hospitalId, "surge-triggered-by-clicks", surgeNotification)
  }

  private verifyAdminAccess(client: Socket, adminToken?: string): boolean {
    // Implement your admin verification logic here
    // For now, just check if user is authenticated
    return client.data.authenticated || false
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  private async sendCurrentSurgeData(client: Socket, hospitalId: string) {
    try {
      const surges = await this.surgeModel
        .find({
          hospital: hospitalId,
          status: { $in: ["pending", "active", "in-progress"] },
        })
        .exec()

      if (surges.length > 0) {
        const surgeData = surges.map((surge) => surge.toObject())

        client.emit("initial_surge_data", {
          hospitalId,
          surges: surgeData,
          timestamp: new Date().toISOString(),
        })

        this.logger.log(`📤 Sent ${surges.length} initial surges for hospital ${hospitalId}`)
      }
    } catch (error) {
      this.logger.error(`❌ Error sending current surge data: ${error.message}`)
    }
  }

  private async sendCurrentRegionalSurgeData(client: Socket, latitude: number, longitude: number, radiusKm: number) {
    try {
      const surges = await this.getSurgesInRegion(latitude, longitude, radiusKm)

      if (surges.length > 0) {
        client.emit("initial_surge_data", {
          surges,
          region: { latitude, longitude, radiusKm },
          timestamp: new Date().toISOString(),
        })

        this.logger.log(`📤 Sent ${surges.length} initial regional surges`)
      }
    } catch (error) {
      this.logger.error(`❌ Error sending current regional surge data: ${error.message}`)
    }
  }

  private async sendCurrentBedspaceData(client: Socket, hospitalId: string) {
    try {
      let query
      if (this.isValidObjectId(hospitalId)) {
        query = {
          $or: [{ hospital: new Types.ObjectId(hospitalId) }, { hospital: hospitalId }],
        }
      } else {
        query = { hospital: hospitalId }
      }

      const bedspaces = await this.bedspaceModel.find(query).maxTimeMS(5000).exec()

      if (bedspaces.length > 0) {
        client.emit("initial_bedspace_data", {
          hospitalId,
          bedspaces,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      this.logger.error(`❌ Error sending current bedspace data: ${error.message}`)
    }
  }

  private async getSurgesInRegion(latitude: number, longitude: number, radiusKm: number): Promise<any[]> {
    try {
      const allSurges = await this.surgeModel
        .find({
          status: { $in: ["pending", "active", "in-progress"] },
        })
        .exec()

      const surgesInRegion = allSurges.filter((surge) => {
        if (!surge.latitude || !surge.longitude) return false
        const distance = this.calculateDistance(latitude, longitude, surge.latitude, surge.longitude)
        return distance <= radiusKm * 1000
      })

      return surgesInRegion.map((surge) => surge.toObject())
    } catch (error) {
      this.logger.error(`❌ Error getting surges in region: ${error.message}`)
      return []
    }
  }

  private async emitToRegionalSubscribers(hospitalId: string, eventName: string, payload: any) {
    try {
      const hospital = await this.hospitalModel.findById(hospitalId).exec()

      if (!hospital || !hospital.latitude || !hospital.longitude) {
        this.logger.warn(`⚠️ Hospital ${hospitalId} not found or missing coordinates`)
        return
      }

      const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys()).filter((room) =>
        room.startsWith("region:"),
      )

      let emittedCount = 0

      for (const room of regionRooms) {
        try {
          const [, latStr, lngStr, radiusStr] = room.split(":")
          const regionLat = Number.parseFloat(latStr)
          const regionLng = Number.parseFloat(lngStr)
          const radius = Number.parseFloat(radiusStr) * 1000

          const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude)

          if (distance <= radius) {
            this.server.to(room).emit(eventName, payload)
            emittedCount++
          }
        } catch (parseError) {
          this.logger.error(`❌ Error parsing regional room ${room}: ${parseError.message}`)
        }
      }

      this.logger.log(`✅ Emitted ${eventName} to ${emittedCount} regional rooms`)
    } catch (error) {
      this.logger.error(`❌ Error emitting to regional subscribers: ${error.message}`)
    }
  }

  private isValidObjectId(id: any): boolean {
    if (!id || typeof id !== "string") {
      return false
    }
    return Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)
  }
}

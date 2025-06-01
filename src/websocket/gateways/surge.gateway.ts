import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WsException,
} from "@nestjs/websockets"
import type { Server, Socket } from "socket.io"
import { Logger, Injectable } from "@nestjs/common"
import { type EventEmitter2, OnEvent } from "@nestjs/event-emitter"
import type { JwtService } from "@nestjs/jwt"
import { InjectModel } from "@nestjs/mongoose"
import type { Model } from "mongoose"
import { Hospital, type HospitalDocument } from "../../hospital/schemas/hospital.schema"
import { Surge, type SurgeDocument } from "../../surge/schema/surge.schema"

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
export class SurgeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private logger = new Logger("SurgeGateway")
  private connectedClients: Map<string, Set<string>> = new Map()
  private clientRooms: Map<string, Set<string>> = new Map()
  private regionalSubscriptions: Map<string, { lat: number; lng: number; radius: number }> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(Surge.name) private surgeModel: Model<SurgeDocument>,
  ) { }

  afterInit(server: Server) {
    this.logger.log("🚀 Surge WebSocket Gateway initialized")

    // Simple connection setup without authentication requirements
    server.use((socket: Socket, next) => {
      this.logger.log(`🔌 Socket middleware: ${socket.id}`)
      // Allow all connections
      next()
    })

    // Log when server is ready
    this.logger.log("✅ WebSocket server ready to accept connections")
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected to surge gateway: ${client.id}`)

    // Add client to tracking
    if (!this.clientRooms.has(client.id)) {
      this.clientRooms.set(client.id, new Set())
    }

    // Send initial connection status
    client.emit("surge_connection_status", {
      connected: true,
      clientId: client.id,
      timestamp: new Date().toISOString(),
    })

    // Set up heartbeat
    const interval = setInterval(() => {
      client.emit("surge_heartbeat", { timestamp: new Date().toISOString() })
    }, 30000)

    // Store interval for cleanup
    client.data.heartbeatInterval = interval

    // Log total connected clients
    this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected from surge gateway: ${client.id}`)

    // Clear heartbeat interval
    if (client.data.heartbeatInterval) {
      clearInterval(client.data.heartbeatInterval)
    }

    // Remove client from all hospital rooms
    if (this.clientRooms.has(client.id)) {
      const rooms = this.clientRooms.get(client.id)
      rooms.forEach((room) => {
        if (this.connectedClients.has(room)) {
          this.connectedClients.get(room).delete(client.id)
        }
      })
      this.clientRooms.delete(client.id)
    }

    // Log total connected clients
    this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`)
  }

  @SubscribeMessage("subscribe_hospital_surges")
  async handleSubscribeHospitalSurges(client: Socket, payload: { hospitalId: string }) {
    try {
      const { hospitalId } = payload
      this.logger.log(`🏥 Client ${client.id} subscribing to hospital surges ${hospitalId}`)

      // Join the hospital surge room
      const roomName = `hospital:${hospitalId}:surges`
      await client.join(roomName)

      // Track the client's subscription
      if (!this.connectedClients.has(hospitalId)) {
        this.connectedClients.set(hospitalId, new Set())
      }
      this.connectedClients.get(hospitalId).add(client.id)

      // Track rooms the client has joined
      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set())
      }
      this.clientRooms.get(client.id).add(hospitalId)

      // Send current surge data immediately
      await this.sendCurrentSurgeData(client, hospitalId)

      // Confirm subscription
      client.emit("hospital_subscription_confirmed", {
        hospitalId,
        success: true,
        timestamp: new Date().toISOString(),
      })

      this.logger.log(`✅ Client ${client.id} successfully subscribed to hospital ${hospitalId}`)

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
    client: Socket,
    payload: {
      latitude: number
      longitude: number
      radius: number
      radiusKm?: number
    },
  ) {
    try {
      const { latitude, longitude, radius, radiusKm } = payload
      const actualRadius = radiusKm || radius / 1000 // Convert to km if needed

      this.logger.log(
        `🌍 Client ${client.id} subscribing to regional surges at ${latitude}, ${longitude} within ${actualRadius}km`,
      )

      // Create regional room name
      const roomName = `region:${latitude}:${longitude}:${actualRadius}`
      await client.join(roomName)

      // Store regional subscription details
      this.regionalSubscriptions.set(roomName, {
        lat: latitude,
        lng: longitude,
        radius: actualRadius * 1000, // Store in meters
      })

      // Track the client's subscription
      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set())
      }
      this.clientRooms.get(client.id).add(roomName)

      // Send current regional surge data immediately
      await this.sendCurrentRegionalSurgeData(client, latitude, longitude, actualRadius)

      // Confirm subscription
      client.emit("regional_subscription_confirmed", {
        latitude,
        longitude,
        radiusKm: actualRadius,
        success: true,
        timestamp: new Date().toISOString(),
      })

      this.logger.log(`✅ Client ${client.id} successfully subscribed to regional surges`)

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

  @SubscribeMessage("unsubscribe_regional_surges")
  async handleUnsubscribeRegionalSurges(
    client: Socket,
    payload: {
      latitude: number
      longitude: number
      radius: number
      radiusKm?: number
    },
  ) {
    try {
      const { latitude, longitude, radius, radiusKm } = payload
      const actualRadius = radiusKm || radius / 1000

      this.logger.log(`🌍 Client ${client.id} unsubscribing from regional surges`)

      // Create regional room name
      const roomName = `region:${latitude}:${longitude}:${actualRadius}`
      await client.leave(roomName)

      // Remove from client rooms tracking
      if (this.clientRooms.has(client.id)) {
        this.clientRooms.get(client.id).delete(roomName)
      }

      return {
        success: true,
        message: `Unsubscribed from regional surges`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error unsubscribing from regional surges: ${error.message}`)
      throw new WsException(`Failed to unsubscribe from regional surges: ${error.message}`)
    }
  }

  @SubscribeMessage("unsubscribe_hospital_surges")
  async handleUnsubscribeHospitalSurges(client: Socket, payload: { hospitalId: string }) {
    try {
      const { hospitalId } = payload
      this.logger.log(`🏥 Client ${client.id} unsubscribing from hospital surges ${hospitalId}`)

      // Leave the hospital surge room
      const roomName = `hospital:${hospitalId}:surges`
      await client.leave(roomName)

      // Remove the client from tracking
      if (this.connectedClients.has(hospitalId)) {
        this.connectedClients.get(hospitalId).delete(client.id)
      }

      // Remove from client rooms tracking
      if (this.clientRooms.has(client.id)) {
        this.clientRooms.get(client.id).delete(hospitalId)
      }

      return {
        success: true,
        message: `Unsubscribed from hospital surges ${hospitalId}`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error unsubscribing from hospital surges: ${error.message}`)
      throw new WsException(`Failed to unsubscribe from surges: ${error.message}`)
    }
  }

  @SubscribeMessage("create_surge")
  async handleCreateSurge(
    client: Socket,
    payload: {
      hospitalId: string
      latitude: number
      longitude: number
      address?: string
      emergencyType?: string
      description?: string
      metadata?: Record<string, any>
    },
  ) {
    try {
      const { hospitalId, latitude, longitude, address, emergencyType, description, metadata } = payload

      this.logger.log(`🚨 Creating surge via WebSocket for hospital ${hospitalId}`)

      // Create new surge in database
      const newSurge = new this.surgeModel({
        hospital: hospitalId,
        latitude,
        longitude,
        address,
        emergencyType,
        description,
        metadata,
        status: "pending",
      })

      const savedSurge = await newSurge.save()

      // Emit event to all subscribers of this hospital
      const surgeData = savedSurge.toObject()
      const eventPayload = {
        hospitalId,
        surge: surgeData,
        timestamp: new Date().toISOString(),
        eventId: `surge_create_${Date.now()}`,
      }

      // Emit to hospital surge room
      this.server.to(`hospital:${hospitalId}:surges`).emit("surge_created", eventPayload)
      this.server.to(`hospital:${hospitalId}:surges`).emit("new_surge", eventPayload)

      // Also emit to regional subscribers
      await this.emitToRegionalSubscribers(hospitalId, "hospital_surge_created", eventPayload)
      await this.emitToRegionalSubscribers(hospitalId, "regional_surge_created", eventPayload)

      // Emit event for other services to consume
      this.eventEmitter.emit("surge.created", eventPayload)

      this.logger.log(`✅ Surge created and emitted: ${savedSurge._id}`)

      return {
        success: true,
        message: "Surge created successfully",
        surge: surgeData,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error creating surge: ${error.message}`)
      throw new WsException(`Failed to create surge: ${error.message}`)
    }
  }

  @SubscribeMessage("update_surge_status")
  async handleUpdateSurgeStatus(
    client: Socket,
    payload: {
      surgeId: string
      status: string
      metadata?: Record<string, any>
    },
  ) {
    try {
      const { surgeId, status, metadata } = payload

      this.logger.log(`🔄 Updating surge ${surgeId} status to ${status}`)

      // Update surge in database
      const surge = await this.surgeModel.findById(surgeId)

      if (!surge) {
        throw new WsException("Surge not found")
      }

      surge.status = status

      if (metadata) {
        surge.metadata = { ...surge.metadata, ...metadata }
      }

      const updatedSurge = await surge.save()

      // Emit event to all subscribers of this hospital
      const surgeData = updatedSurge.toObject()
      const hospitalId = surge.hospital.toString()

      const eventPayload = {
        hospitalId,
        surge: surgeData,
        timestamp: new Date().toISOString(),
        eventId: `surge_update_${Date.now()}`,
      }

      // Emit to hospital surge room
      this.server.to(`hospital:${hospitalId}:surges`).emit("surge_updated", eventPayload)
      this.server.to(`hospital:${hospitalId}:surges`).emit("surge.updated", eventPayload)

      // Also emit to regional subscribers
      await this.emitToRegionalSubscribers(hospitalId, "surge_updated", eventPayload)
      await this.emitToRegionalSubscribers(hospitalId, "hospital_surge_updated", eventPayload)

      // Emit event for other services to consume
      this.eventEmitter.emit("surge.updated", eventPayload)

      this.logger.log(`✅ Surge updated and emitted: ${updatedSurge._id}`)

      return {
        success: true,
        message: "Surge updated successfully",
        surge: surgeData,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`❌ Error updating surge: ${error.message}`)
      throw new WsException(`Failed to update surge: ${error.message}`)
    }
  }

  // Send current surge data to a client for a specific hospital
  private async sendCurrentSurgeData(client: Socket, hospitalId: string) {
    try {
      // Get active surges for this hospital
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

        client.emit("hospital_surges_initial", {
          hospitalId,
          surges: surgeData,
          timestamp: new Date().toISOString(),
        })

        this.logger.log(`📤 Sent ${surges.length} initial surges for hospital ${hospitalId} to client ${client.id}`)
      } else {
        this.logger.log(`📭 No active surges found for hospital ${hospitalId}`)
      }
    } catch (error) {
      this.logger.error(`❌ Error sending current surge data: ${error.message}`)
    }
  }

  // Send current regional surge data to a client
  private async sendCurrentRegionalSurgeData(client: Socket, latitude: number, longitude: number, radiusKm: number) {
    try {
      // Get surges within the region
      const surges = await this.getSurgesInRegion(latitude, longitude, radiusKm)

      if (surges.length > 0) {
        client.emit("initial_surge_data", {
          surges,
          region: { latitude, longitude, radiusKm },
          timestamp: new Date().toISOString(),
        })

        client.emit("regional_surges_initial", {
          surges,
          region: { latitude, longitude, radiusKm },
          timestamp: new Date().toISOString(),
        })

        this.logger.log(`📤 Sent ${surges.length} initial regional surges to client ${client.id}`)
      } else {
        this.logger.log(`📭 No active surges found in region ${latitude}, ${longitude} (${radiusKm}km)`)
      }
    } catch (error) {
      this.logger.error(`❌ Error sending current regional surge data: ${error.message}`)
    }
  }

  // Get surges in a geographic region
  private async getSurgesInRegion(latitude: number, longitude: number, radiusKm: number): Promise<any[]> {
    try {
      // Find all surges and filter by distance
      const allSurges = await this.surgeModel
        .find({
          status: { $in: ["pending", "active", "in-progress"] },
        })
        .exec()

      const surgesInRegion = allSurges.filter((surge) => {
        if (!surge.latitude || !surge.longitude) return false

        const distance = this.calculateDistance(latitude, longitude, surge.latitude, surge.longitude)

        return distance <= radiusKm * 1000 // Convert km to meters
      })

      return surgesInRegion.map((surge) => surge.toObject())
    } catch (error) {
      this.logger.error(`❌ Error getting surges in region: ${error.message}`)
      return []
    }
  }

  // CRITICAL: Event handlers for service-created surges
  @OnEvent("surge.created")
  async handleSurgeCreated(payload: { hospitalId: string; surge: any }) {
    this.logger.log(`🚨 SURGE CREATED EVENT RECEIVED for hospital ${payload.hospitalId}`)
    this.logger.log(`🔍 Surge details:`, JSON.stringify(payload.surge, null, 2))

    const eventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: `surge_create_${Date.now()}`,
    }

    // Get room info for debugging
    const roomName = `hospital:${payload.hospitalId}:surges`
    const room = this.server.sockets.adapter.rooms.get(roomName)
    const clientCount = room ? room.size : 0

    this.logger.log(`📊 Room ${roomName} has ${clientCount} clients`)

    // Emit to all clients subscribed to this hospital with multiple event names
    this.server.to(roomName).emit("surge_created", eventPayload)
    this.server.to(roomName).emit("new_surge", eventPayload)
    this.server.to(roomName).emit("surge.created", eventPayload)
    this.server.to(roomName).emit("emergency_surge", eventPayload)

    // Also emit to all connected clients (broadcast)
    this.server.emit("global_surge_created", eventPayload)

    // Also emit to regional subscribers
    await this.emitToRegionalSubscribers(payload.hospitalId, "surge_created", eventPayload)
    await this.emitToRegionalSubscribers(payload.hospitalId, "regional_surge_created", eventPayload)
    await this.emitToRegionalSubscribers(payload.hospitalId, "hospital_surge_created", eventPayload)

    this.logger.log(`✅ Surge created event emitted to ${clientCount} clients in room ${roomName}`)
  }

  @OnEvent("surge.updated")
  async handleSurgeUpdated(payload: { hospitalId: string; surge: any }) {
    this.logger.log(`🔄 SURGE UPDATED EVENT RECEIVED for hospital ${payload.hospitalId}`)

    const eventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: `surge_update_${Date.now()}`,
    }

    // Get room info for debugging
    const roomName = `hospital:${payload.hospitalId}:surges`
    const room = this.server.sockets.adapter.rooms.get(roomName)
    const clientCount = room ? room.size : 0

    this.logger.log(`📊 Room ${roomName} has ${clientCount} clients`)

    // Emit to all clients subscribed to this hospital with multiple event names
    this.server.to(roomName).emit("surge_updated", eventPayload)
    this.server.to(roomName).emit("surge.updated", eventPayload)
    this.server.to(roomName).emit("hospital_surge_updated", eventPayload)

    // Also emit to all connected clients (broadcast)
    this.server.emit("global_surge_updated", eventPayload)

    // Also emit to regional subscribers
    await this.emitToRegionalSubscribers(payload.hospitalId, "surge_updated", eventPayload)
    await this.emitToRegionalSubscribers(payload.hospitalId, "hospital_surge_updated", eventPayload)

    this.logger.log(`✅ Surge updated event emitted to ${clientCount} clients in room ${roomName}`)
  }

  // Enhanced helper method to emit to regional subscribers
  private async emitToRegionalSubscribers(hospitalId: string, eventName: string, payload: any) {
    try {
      // Get hospital location
      const hospital = await this.hospitalModel.findById(hospitalId).exec()

      if (!hospital || !hospital.latitude || !hospital.longitude) {
        this.logger.warn(`⚠️ Hospital ${hospitalId} not found or missing coordinates`)
        return
      }

      // Get all regional room names
      const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys()).filter((room) =>
        room.startsWith("region:"),
      )

      this.logger.log(
        `🌍 Checking ${regionRooms.length} regional rooms for hospital at ${hospital.latitude}, ${hospital.longitude}`,
      )

      let emittedCount = 0

      for (const room of regionRooms) {
        try {
          // Parse region coordinates and radius
          const [, latStr, lngStr, radiusStr] = room.split(":")
          const regionLat = Number.parseFloat(latStr)
          const regionLng = Number.parseFloat(lngStr)
          const radius = Number.parseFloat(radiusStr) * 1000 // Convert km to meters

          // Check if hospital is within this region
          const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude)

          if (distance <= radius) {
            const roomClients = this.server.sockets.adapter.rooms.get(room)
            const clientCount = roomClients ? roomClients.size : 0

            this.logger.log(
              `📡 Emitting ${eventName} to regional room ${room} (${clientCount} clients, distance: ${Math.round(distance)}m)`,
            )
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

  // Helper method to calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Debug method to get connection stats
  @SubscribeMessage("get_connection_stats")
  handleGetConnectionStats(client: Socket) {
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
      timestamp: new Date().toISOString(),
    }

    this.logger.log(`📊 Connection stats requested by ${client.id}:`, stats)

    client.emit("connection_stats", stats)

    return stats
  }
}


import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hospital, HospitalDocument } from '../../hospital/schemas/hospital.schema';
import { Bedspace, BedspaceDocument } from '../../bedspace/schemas/bedspace.schema';

// Enhanced WebSocket gateway with better performance and reliability
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000, // Send ping every 10 seconds
  pingTimeout: 5000, // Consider connection closed if no pong in 5 seconds
})
@Injectable()
export class BedspaceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('BedspaceGateway');
  private connectedClients: Map<string, Set<string>> = new Map();
  private clientRooms: Map<string, Set<string>> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    @InjectModel(Bedspace.name) private bedspaceModel: Model<BedspaceDocument>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Set up middleware for authentication
    server.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                      socket.handshake.headers.authorization?.split(' ')[1];
        
        // Allow anonymous connections for public data
        if (!token) {
          socket.data.anonymous = true;
          return next();
        }
        
        // Verify token
        const payload = this.jwtService.verify(token);
        socket.data.user = payload;
        socket.data.authenticated = true;
        next();
      } catch (error) {
        // Don't reject connection, just mark as anonymous
        socket.data.anonymous = true;
        next();
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Add client to tracking
    if (!this.clientRooms.has(client.id)) {
      this.clientRooms.set(client.id, new Set());
    }
    
    // Send initial connection status
    client.emit('connection_status', { 
      connected: true,
      authenticated: client.data.authenticated || false,
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
    
    // Set up heartbeat
    const interval = setInterval(() => {
      client.emit('heartbeat', { timestamp: new Date().toISOString() });
    }, 30000);
    
    // Store interval for cleanup
    client.data.heartbeatInterval = interval;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clear heartbeat interval
    if (client.data.heartbeatInterval) {
      clearInterval(client.data.heartbeatInterval);
    }
    
    // Remove client from all hospital rooms
    if (this.clientRooms.has(client.id)) {
      const rooms = this.clientRooms.get(client.id);
      rooms.forEach(room => {
        if (this.connectedClients.has(room)) {
          this.connectedClients.get(room).delete(client.id);
        }
      });
      this.clientRooms.delete(client.id);
    }
  }

  @SubscribeMessage('subscribe_hospital')
  handleSubscribeHospital(client: Socket, payload: { hospitalId: string }) {
    try {
      const { hospitalId } = payload;
      this.logger.log(`Client ${client.id} subscribing to hospital ${hospitalId}`);
      
      // Join the hospital room
      const roomName = `hospital:${hospitalId}`;
      client.join(roomName);
      
      // Track the client's subscription
      if (!this.connectedClients.has(hospitalId)) {
        this.connectedClients.set(hospitalId, new Set());
      }
      this.connectedClients.get(hospitalId).add(client.id);
      
      // Track rooms the client has joined
      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set());
      }
      this.clientRooms.get(client.id).add(hospitalId);
      
      // Send current bedspace data immediately
      this.sendCurrentBedspaceData(client, hospitalId);
      
      return { 
        success: true, 
        message: `Subscribed to hospital ${hospitalId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error subscribing to hospital: ${error.message}`);
      throw new WsException(`Failed to subscribe: ${error.message}`);
    }
  }

  @SubscribeMessage('unsubscribe_hospital')
  handleUnsubscribeHospital(client: Socket, payload: { hospitalId: string }) {
    try {
      const { hospitalId } = payload;
      this.logger.log(`Client ${client.id} unsubscribing from hospital ${hospitalId}`);
      
      // Leave the hospital room
      const roomName = `hospital:${hospitalId}`;
      client.leave(roomName);
      
      // Remove the client from tracking
      if (this.connectedClients.has(hospitalId)) {
        this.connectedClients.get(hospitalId).delete(client.id);
      }
      
      // Remove from client rooms tracking
      if (this.clientRooms.has(client.id)) {
        this.clientRooms.get(client.id).delete(hospitalId);
      }
      
      return { 
        success: true, 
        message: `Unsubscribed from hospital ${hospitalId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error unsubscribing from hospital: ${error.message}`);
      throw new WsException(`Failed to unsubscribe: ${error.message}`);
    }
  }

  @SubscribeMessage('subscribe_region')
  handleSubscribeRegion(client: Socket, payload: { 
    latitude: number, 
    longitude: number, 
    radius: number 
  }) {
    try {
      const { latitude, longitude, radius } = payload;
      const regionKey = `region:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${radius}`;
      
      this.logger.log(`Client ${client.id} subscribing to region ${regionKey}`);
      
      // Join the region room
      client.join(regionKey);
      
      // Track rooms the client has joined
      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set());
      }
      this.clientRooms.get(client.id).add(regionKey);
      
      return { 
        success: true, 
        message: `Subscribed to region`,
        regionKey,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error subscribing to region: ${error.message}`);
      throw new WsException(`Failed to subscribe to region: ${error.message}`);
    }
  }

  @SubscribeMessage('heartbeat_response')
  handleHeartbeatResponse(client: Socket) {
    // Update last activity timestamp
    client.data.lastActivity = new Date();
    return { timestamp: new Date().toISOString() };
  }

  // FIXED: Send current bedspace data to a client - now handles both ObjectId and string hospital IDs
  private async sendCurrentBedspaceData(client: Socket, hospitalId: string) {
    try {
      // Create a query that can handle both ObjectId and string hospital IDs
      let query;
      
      // Check if the hospitalId is a valid ObjectId
      if (Types.ObjectId.isValid(hospitalId) && hospitalId.match(/^[0-9a-fA-F]{24}$/)) {
        // If it's a valid ObjectId, search by both ObjectId and string
        query = {
          $or: [
            { hospital: new Types.ObjectId(hospitalId) },
            { hospital: hospitalId }
          ]
        };
      } else {
        // If it's not a valid ObjectId (like a Google Place ID), search by string only
        query = { hospital: hospitalId };
      }
      
      // Execute the query with the improved conditions
      const bedspaces = await this.bedspaceModel.find(query).exec();
      
      if (bedspaces.length > 0) {
        client.emit('initial_bedspace_data', {
          hospitalId,
          bedspaces,
          timestamp: new Date().toISOString()
        });
      } else {
        // If no bedspaces found, try to find the hospital first to check if it exists
        const hospital = await this.findHospitalByIdOrPlaceId(hospitalId);
        
        if (hospital) {
          // Hospital exists but no bedspaces
          client.emit('initial_bedspace_data', {
            hospitalId,
            bedspaces: [],
            message: 'No bedspaces found for this hospital',
            timestamp: new Date().toISOString()
          });
        } else {
          // Hospital doesn't exist
          client.emit('error', {
            code: 'HOSPITAL_NOT_FOUND',
            message: `Hospital with ID ${hospitalId} not found`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error sending current bedspace data: ${error.message}`);
      
      // Send error to client instead of failing silently
      client.emit('error', {
        code: 'BEDSPACE_DATA_ERROR',
        message: 'Unable to retrieve bedspace data. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Helper method to find a hospital by either ObjectId or Place ID
  private async findHospitalByIdOrPlaceId(id: string): Promise<HospitalDocument | null> {
    try {
      let query;
      
      // Check if the id is a valid ObjectId
      if (Types.ObjectId.isValid(id) && id.match(/^[0-9a-fA-F]{24}$/)) {
        query = {
          $or: [
            { _id: new Types.ObjectId(id) },
            { placeId: id } // Assuming you have a placeId field in your Hospital model
          ]
        };
      } else {
        query = { placeId: id };
      }
      
      return await this.hospitalModel.findOne(query).exec();
    } catch (error) {
      this.logger.error(`Error finding hospital: ${error.message}`);
      return null;
    }
  }

  // Event handlers with improved performance
  @OnEvent('bedspace.updated')
  handleBedspaceUpdated(payload: { hospitalId: string; bedspace: any }) {
    this.logger.log(`Bedspace updated for hospital ${payload.hospitalId}`);
    
    // Add timestamp for clients to track freshness
    const eventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: `bedspace_update_${Date.now()}`
    };
    
    // Emit to all clients subscribed to this hospital
    this.server.to(`hospital:${payload.hospitalId}`).emit('bedspace_updated', eventPayload);
    
    // Also emit to regional subscribers
    this.emitToRegionalSubscribers(payload.hospitalId, 'hospital_bedspace_updated', eventPayload);
  }

  @OnEvent('emergency.created')
  handleEmergencyCreated(payload: { hospitalId: string; emergency: any }) {
    this.logger.log(`Emergency created for hospital ${payload.hospitalId}`);
    
    const eventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: `emergency_create_${Date.now()}`
    };
    
    // Emit to all clients subscribed to this hospital
    this.server.to(`hospital:${payload.hospitalId}`).emit('emergency_created', eventPayload);
    
    // Also emit to regional subscribers
    this.emitToRegionalSubscribers(payload.hospitalId, 'hospital_emergency_created', eventPayload);
  }

  @OnEvent('hospital.status_changed')
  handleHospitalStatusChanged(payload: { hospitalId: string; status: string }) {
    this.logger.log(`Hospital ${payload.hospitalId} status changed to ${payload.status}`);
    
    const eventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: `status_change_${Date.now()}`
    };
    
    // Emit to all connected clients (public information)
    this.server.emit('hospital_status_changed', eventPayload);
  }

  // Helper method to emit to regional subscribers
  private async emitToRegionalSubscribers(hospitalId: string, eventName: string, payload: any) {
    try {
      // Get hospital location - use the new helper method to find by either ID type
      const hospital = await this.findHospitalByIdOrPlaceId(hospitalId);
      
      if (!hospital) return;
      
      // Find all region rooms that might include this hospital
      // This is a simplified approach - in production you'd use geospatial queries
      const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys())
        .filter(room => room.startsWith('region:'));
      
      for (const room of regionRooms) {
        // Parse region coordinates and radius
        const [, latStr, lngStr, radiusStr] = room.split(':');
        const regionLat = parseFloat(latStr);
        const regionLng = parseFloat(lngStr);
        const radius = parseFloat(radiusStr);
        
        // Check if hospital is within this region (simplified distance calculation)
        const distance = this.calculateDistance(
          regionLat, 
          regionLng, 
          hospital.latitude, 
          hospital.longitude
        );
        
        if (distance <= radius) {
          this.server.to(room).emit(eventName, payload);
        }
      }
    } catch (error) {
      this.logger.error(`Error emitting to regional subscribers: ${error.message}`);
    }
  }

  // Helper method to calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}
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
  import { Model } from 'mongoose';
  import { Hospital, HospitalDocument } from '../../hospital/schemas/hospital.schema';
  import { Surge, SurgeDocument } from '../../surge/schema/surge.schema';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  })
  @Injectable()
  export class SurgeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger = new Logger('SurgeGateway');
    private connectedClients: Map<string, Set<string>> = new Map();
    private clientRooms: Map<string, Set<string>> = new Map();
  
    constructor(
      private eventEmitter: EventEmitter2,
      private jwtService: JwtService,
      @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
      @InjectModel(Surge.name) private surgeModel: Model<SurgeDocument>,
    ) {}
  
    afterInit(server: Server) {
      this.logger.log('Surge WebSocket Gateway initialized');
      
      // Simple connection setup without authentication requirements
      server.use((socket: Socket, next) => {
        // Allow all connections
        next();
      });
    }
  
    handleConnection(client: Socket) {
      this.logger.log(`Client connected to surge gateway: ${client.id}`);
      
      // Add client to tracking
      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set());
      }
      
      // Send initial connection status
      client.emit('surge_connection_status', { 
        connected: true,
        clientId: client.id,
        timestamp: new Date().toISOString()
      });
      
      // Set up heartbeat
      const interval = setInterval(() => {
        client.emit('surge_heartbeat', { timestamp: new Date().toISOString() });
      }, 30000);
      
      // Store interval for cleanup
      client.data.heartbeatInterval = interval;
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected from surge gateway: ${client.id}`);
      
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
  
    @SubscribeMessage('subscribe_hospital_surges')
    handleSubscribeHospitalSurges(client: Socket, payload: { hospitalId: string }) {
      try {
        const { hospitalId } = payload;
        this.logger.log(`Client ${client.id} subscribing to hospital surges ${hospitalId}`);
        
        // Join the hospital surge room
        const roomName = `hospital:${hospitalId}:surges`;
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
        
        // Send current surge data immediately
        this.sendCurrentSurgeData(client, hospitalId);
        
        return { 
          success: true, 
          message: `Subscribed to hospital surges ${hospitalId}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(`Error subscribing to hospital surges: ${error.message}`);
        throw new WsException(`Failed to subscribe to surges: ${error.message}`);
      }
    }
  
    @SubscribeMessage('unsubscribe_hospital_surges')
    handleUnsubscribeHospitalSurges(client: Socket, payload: { hospitalId: string }) {
      try {
        const { hospitalId } = payload;
        this.logger.log(`Client ${client.id} unsubscribing from hospital surges ${hospitalId}`);
        
        // Leave the hospital surge room
        const roomName = `hospital:${hospitalId}:surges`;
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
          message: `Unsubscribed from hospital surges ${hospitalId}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(`Error unsubscribing from hospital surges: ${error.message}`);
        throw new WsException(`Failed to unsubscribe from surges: ${error.message}`);
      }
    }
  
    @SubscribeMessage('create_surge')
    async handleCreateSurge(client: Socket, payload: {
      hospitalId: string;
      latitude: number;
      longitude: number;
      address?: string;
      emergencyType?: string;
      description?: string;
      metadata?: Record<string, any>;
    }) {
      try {
        const { hospitalId, latitude, longitude, address, emergencyType, description, metadata } = payload;
        
        // Create new surge in database
        const newSurge = new this.surgeModel({
          hospital: hospitalId,
          latitude,
          longitude,
          address,
          emergencyType,
          description,
          metadata,
          status: 'pending',
        });
        
        await newSurge.save();
        
        // Emit event to all subscribers of this hospital
        const surgeData = newSurge.toObject();
        const eventPayload = {
          hospitalId,
          surge: surgeData,
          timestamp: new Date().toISOString(),
          eventId: `surge_create_${Date.now()}`
        };
        
        // Emit to hospital surge room
        this.server.to(`hospital:${hospitalId}:surges`).emit('surge_created', eventPayload);
        
        // Also emit to regional subscribers
        this.emitToRegionalSubscribers(hospitalId, 'hospital_surge_created', eventPayload);
        
        // Emit event for other services to consume
        this.eventEmitter.emit('surge.created', eventPayload);
        
        return { 
          success: true, 
          message: 'Surge created successfully',
          surge: surgeData,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(`Error creating surge: ${error.message}`);
        throw new WsException(`Failed to create surge: ${error.message}`);
      }
    }
  
    @SubscribeMessage('update_surge_status')
    async handleUpdateSurgeStatus(client: Socket, payload: {
      surgeId: string;
      status: string;
      metadata?: Record<string, any>;
    }) {
      try {
        const { surgeId, status, metadata } = payload;
        
        // Update surge in database
        const surge = await this.surgeModel.findById(surgeId);
        
        if (!surge) {
          throw new WsException('Surge not found');
        }
        
        surge.status = status;
        
        if (metadata) {
          surge.metadata = { ...surge.metadata, ...metadata };
        }
        
        await surge.save();
        
        // Emit event to all subscribers of this hospital
        const surgeData = surge.toObject();
        const hospitalId = surge.hospital.toString();
        
        const eventPayload = {
          hospitalId,
          surge: surgeData,
          timestamp: new Date().toISOString(),
          eventId: `surge_update_${Date.now()}`
        };
        
        // Emit to hospital surge room
        this.server.to(`hospital:${hospitalId}:surges`).emit('surge_updated', eventPayload);
        
        // Emit event for other services to consume
        this.eventEmitter.emit('surge.updated', eventPayload);
        
        return { 
          success: true, 
          message: 'Surge updated successfully',
          surge: surgeData,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(`Error updating surge: ${error.message}`);
        throw new WsException(`Failed to update surge: ${error.message}`);
      }
    }
  
    // Send current surge data to a client
    private async sendCurrentSurgeData(client: Socket, hospitalId: string) {
      try {
        // Get active surges for this hospital
        const surges = await this.surgeModel.find({ 
          hospital: hospitalId,
          status: { $in: ['pending', 'active', 'in-progress'] }
        }).exec();
        
        if (surges.length > 0) {
          client.emit('initial_surge_data', {
            hospitalId,
            surges,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        this.logger.error(`Error sending current surge data: ${error.message}`);
      }
    }
  
    // Event handlers
    @OnEvent('surge.created')
    handleSurgeCreated(payload: { hospitalId: string; surge: any }) {
      this.logger.log(`Surge created for hospital ${payload.hospitalId}`);
      
      const eventPayload = {
        ...payload,
        timestamp: new Date().toISOString(),
        eventId: `surge_create_${Date.now()}`
      };
      
      // Emit to all clients subscribed to this hospital
      this.server.to(`hospital:${payload.hospitalId}:surges`).emit('surge_created', eventPayload);
    }
  
    @OnEvent('surge.updated')
    handleSurgeUpdated(payload: { hospitalId: string; surge: any }) {
      this.logger.log(`Surge updated for hospital ${payload.hospitalId}`);
      
      const eventPayload = {
        ...payload,
        timestamp: new Date().toISOString(),
        eventId: `surge_update_${Date.now()}`
      };
      
      // Emit to all clients subscribed to this hospital
      this.server.to(`hospital:${payload.hospitalId}:surges`).emit('surge_updated', eventPayload);
    }
  
    // Helper method to emit to regional subscribers
    private async emitToRegionalSubscribers(hospitalId: string, eventName: string, payload: any) {
      try {
        // Get hospital location
        const hospital = await this.hospitalModel.findById(hospitalId).exec();
        
        if (!hospital) return;
        
        // Find all region rooms that might include this hospital
        const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys())
          .filter(room => room.startsWith('region:'));
        
        for (const room of regionRooms) {
          // Parse region coordinates and radius
          const [, latStr, lngStr, radiusStr] = room.split(':');
          const regionLat = parseFloat(latStr);
          const regionLng = parseFloat(lngStr);
          const radius = parseFloat(radiusStr);
          
          // Check if hospital is within this region
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
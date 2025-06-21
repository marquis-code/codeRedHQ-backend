import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { HospitalClicksService } from "../../hospital-click/hospital-clicks.service"

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
  },
})
export class HospitalClicksGateway {
  @WebSocketServer()
  server: Server

  constructor(private hospitalClicksService: HospitalClicksService) {}

  @SubscribeMessage("hospital-click")
  async handleHospitalClick(
    data: {
      hospitalId: string
      sessionId: string
      latitude?: number
      longitude?: number
      userAgent?: string
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { hospitalId, sessionId, latitude, longitude, userAgent } = data

      // Use the actual service method with proper data structure
      const clickData = {
        hospitalId,
        sessionId,
        latitude: latitude || 0, // Default coordinates if not provided
        longitude: longitude || 0,
        userAgent: userAgent || client.handshake.headers["user-agent"],
        ipAddress: client.handshake.address,
      }

      const result = await this.hospitalClicksService.handleClick(clickData)

      // Broadcast updated click count to all clients
      this.server.emit("click-count-updated", {
        hospitalId,
        clickCount: result.clickCount,
        surgeTriggered: result.surgeTriggered,
        isValidLocation: result.isValidLocation,
        message: result.message,
      })

      // Check if surge was triggered
      if (result.surgeTriggered) {
        // Emit the special event
        this.server.emit("hospital-click-threshold-reached", {
          hospitalId,
          clickCount: result.clickCount,
          message: `Hospital ${hospitalId} has reached the surge threshold!`,
          surgeData: result.data,
        })
      }

      return {
        success: true,
        clickCount: result.clickCount,
        surgeTriggered: result.surgeTriggered,
        isValidLocation: result.isValidLocation,
        message: result.message,
      }
    } catch (error) {
      console.error("Error handling hospital click:", error)
      return { success: false, error: error.message }
    }
  }

  @SubscribeMessage("get-hospital-clicks")
  async getHospitalClicks(@MessageBody() data: { hospitalId: string }, @ConnectedSocket() client: Socket) {
    try {
      const stats = await this.hospitalClicksService.getClickStatistics(data.hospitalId)

      client.emit("hospital-clicks-data", {
        hospitalId: data.hospitalId,
        clickCount: stats.currentClickCount || 0,
        totalSurgesTriggered: stats.totalSurgesTriggered || 0,
        totalValidClicks: stats.totalValidClicks || 0,
        totalInvalidClicks: stats.totalInvalidClicks || 0,
        status: stats.status || "active",
        lastClickTime: stats.lastClickTime,
        lastSurgeTime: stats.lastSurgeTime,
      })
    } catch (error) {
      console.error("Error getting hospital clicks:", error)
      client.emit("hospital-clicks-error", { error: error.message })
    }
  }

  @SubscribeMessage("reset-hospital-clicks")
  async resetHospitalClicks(@MessageBody() data: { hospitalId: string }, @ConnectedSocket() client: Socket) {
    try {
      await this.hospitalClicksService.resetClicks(data.hospitalId)

      this.server.emit("click-count-updated", {
        hospitalId: data.hospitalId,
        clickCount: 0,
        surgeTriggered: false,
        message: "Hospital clicks have been reset",
      })

      return { success: true }
    } catch (error) {
      console.error("Error resetting hospital clicks:", error)
      return { success: false, error: error.message }
    }
  }

  @SubscribeMessage("get-surge-history")
  async getSurgeHistory(
    @MessageBody() data: { hospitalId: string; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const surgeHistory = await this.hospitalClicksService.getSurgeHistory(data.hospitalId, data.limit || 10)

      client.emit("surge-history", {
        hospitalId: data.hospitalId,
        surgeHistory,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error getting surge history:", error)
      client.emit("surge-history-error", { error: error.message })
    }
  }
}

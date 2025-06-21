
import { Injectable, Logger } from "@nestjs/common"
import type { Model } from "mongoose"
import { InjectModel } from "@nestjs/mongoose"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { HospitalClick, HospitalClickDocument, SurgeEvent } from "./schemas/hospital-click.schema"
import { Hospital, HospitalDocument } from "../hospital/schemas/hospital.schema"

export interface ClickData {
  hospitalId: string
  sessionId: string
  latitude: number
  longitude: number
  userAgent?: string
  ipAddress?: string
}

export interface SurgeData {
  hospitalId: string
  surgeId: string
  clickCount: number
  hospitalInfo: {
    _id: string
    hospitalName: string
    address: string
    latitude: number
    longitude: number
    placeId?: string
    totalAvailableBeds: number
    overallBedStatus: string
  }
  contributingLocations: Array<{
    sessionId: string
    latitude: number
    longitude: number
    timestamp: Date
    distanceFromHospital: number
  }>
  averageClickLocation: {
    latitude: number
    longitude: number
  }
  metadata: {
    totalUniqueSessions: number
    timeToSurge: number
    maxDistanceFromHospital: number
    minDistanceFromHospital: number
    surgeNumber: number
    timeWindowStart: Date
    timeWindowEnd: Date
    hospitalCapacityInfo: {
      totalBeds: number
      availableBeds: number
      bedStatus: string
      specialties: string[]
    }
  }
}

@Injectable()
export class HospitalClicksService {
  private readonly logger = new Logger(HospitalClicksService.name)
  private readonly CLICK_THRESHOLD = 5
  private readonly LOCATION_RADIUS_KM = 30 // 30km radius from hospital
  private readonly SURGE_WINDOW_MINUTES = 30 // 30 minutes window for new surges
  private readonly CLICK_WINDOW_MINUTES = 10 // 10 minutes window for clicks to count toward surge

  // constructor(
  //   private hospitalClickModel: Model<HospitalClickDocument>,
  //   private hospitalModel: Model<HospitalDocument>,
  //   private eventEmitter: EventEmitter2,
  // ) {}
  constructor(
    @InjectModel(HospitalClick.name) private hospitalClickModel: Model<HospitalClickDocument>,
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    private eventEmitter: EventEmitter2,
  ) { }

  async handleClick(clickData: ClickData): Promise<{
    success: boolean
    clickCount: number
    surgeTriggered: boolean
    message: string
    isValidLocation: boolean
    distanceFromHospital?: number
    hospitalInfo?: any
    data?: any
  }> {
    try {
      const { hospitalId, sessionId, latitude, longitude, userAgent, ipAddress } = clickData

      this.logger.log(
        `Processing click for hospital ${hospitalId} from session ${sessionId} at ${latitude}, ${longitude}`,
      )

      // Get hospital information using the comprehensive schema
      const hospital = await this.getHospitalInfo(hospitalId)
      if (!hospital) {
        throw new Error(`Hospital ${hospitalId} not found or missing location data`)
      }

      // Calculate distance from hospital using the schema's latitude/longitude
      const distanceFromHospital = this.calculateDistance(latitude, longitude, hospital.latitude, hospital.longitude)

      this.logger.log(`Click distance from ${hospital.hospitalName}: ${Math.round(distanceFromHospital / 1000)}km`)

      // Check if click is within valid radius
      const isValidLocation = distanceFromHospital <= this.LOCATION_RADIUS_KM * 1000

      if (!isValidLocation) {
        this.logger.log(
          `Click rejected for ${hospital.hospitalName}: ${Math.round(distanceFromHospital / 1000)}km exceeds ${this.LOCATION_RADIUS_KM}km limit`,
        )

        // Track invalid clicks for analytics
        await this.trackInvalidClick(hospitalId, clickData, distanceFromHospital, hospital)

        return {
          success: true,
          clickCount: 0,
          surgeTriggered: false,
          message: `Click location is ${Math.round(distanceFromHospital / 1000)}km from ${hospital.hospitalName} (max: ${this.LOCATION_RADIUS_KM}km)`,
          isValidLocation: false,
          distanceFromHospital: Math.round(distanceFromHospital / 1000),
          hospitalInfo: {
            name: hospital.hospitalName,
            address: hospital.address,
            availableBeds: hospital.totalAvailableBeds,
            bedStatus: hospital.overallBedStatus,
          },
        }
      }

      // Check if we're in surge cooldown period
      const existingRecord = await this.hospitalClickModel.findOne({ hospitalId })
      if (existingRecord && this.isInSurgeCooldown(existingRecord)) {
        const cooldownRemaining = this.getSurgeCooldownRemaining(existingRecord)
        this.logger.log(
          `Hospital ${hospital.hospitalName} is in surge cooldown period (${Math.round(cooldownRemaining)} minutes remaining)`,
        )

        return {
          success: true,
          clickCount: existingRecord.currentClickCount,
          surgeTriggered: false,
          message: `${hospital.hospitalName} is in surge cooldown period. Next surge possible in ${Math.round(cooldownRemaining)} minutes`,
          isValidLocation: true,
          distanceFromHospital: Math.round(distanceFromHospital / 1000),
          hospitalInfo: {
            name: hospital.hospitalName,
            address: hospital.address,
            availableBeds: hospital.totalAvailableBeds,
            bedStatus: hospital.overallBedStatus,
          },
        }
      }

      // Clean up old clicks outside the time window
      await this.cleanupOldClicks(hospitalId)

      // Find or create hospital click record
      let hospitalClick = await this.hospitalClickModel.findOne({ hospitalId })

      if (!hospitalClick) {
        hospitalClick = new this.hospitalClickModel({
          hospitalId,
          hospitalLocation: {
            latitude: hospital.latitude,
            longitude: hospital.longitude,
          },
          currentClickCount: 0,
          currentClickSessions: [],
          currentClickDetails: [],
          surgeHistory: [],
          status: "active",
          totalSurgesTriggered: 0,
          totalValidClicks: 0,
          totalInvalidClicks: 0,
        })
      }

      // Check if this session has already clicked recently (prevent spam)
      const recentClickFromSession = hospitalClick.currentClickDetails.find(
        (detail) => detail.sessionId === sessionId && this.isWithinClickWindow(detail.timestamp),
      )

      if (recentClickFromSession) {
        this.logger.log(`Session ${sessionId} has already clicked recently for ${hospital.hospitalName}`)
        return {
          success: true,
          clickCount: hospitalClick.currentClickCount,
          surgeTriggered: false,
          message: `Session has already contributed to current surge window for ${hospital.hospitalName}`,
          isValidLocation: true,
          distanceFromHospital: Math.round(distanceFromHospital / 1000),
          hospitalInfo: {
            name: hospital.hospitalName,
            address: hospital.address,
            availableBeds: hospital.totalAvailableBeds,
            bedStatus: hospital.overallBedStatus,
          },
        }
      }

      // Add the new valid click
      hospitalClick.currentClickDetails.push({
        sessionId,
        latitude,
        longitude,
        timestamp: new Date(),
        distanceFromHospital,
        userAgent,
        ipAddress,
        isValid: true,
      })

      // Update unique sessions list
      if (!hospitalClick.currentClickSessions.includes(sessionId)) {
        hospitalClick.currentClickSessions.push(sessionId)
      }

      hospitalClick.currentClickCount += 1
      hospitalClick.totalValidClicks += 1
      hospitalClick.lastClickTime = new Date()

      // Save the updated record
      const savedRecord = await hospitalClick.save()

      this.logger.log(
        `Valid click recorded for ${hospital.hospitalName}. Now has ${savedRecord.currentClickCount} clicks`,
      )

      // Check if surge threshold is reached
      if (savedRecord.currentClickCount >= this.CLICK_THRESHOLD) {
        this.logger.log(`🚨 SURGE THRESHOLD REACHED for ${hospital.hospitalName}!`)

        const surgeData = await this.triggerSurge(savedRecord, hospital)

        return {
          success: true,
          clickCount: savedRecord.currentClickCount,
          surgeTriggered: true,
          message: `Surge triggered for ${hospital.hospitalName}`,
          isValidLocation: true,
          distanceFromHospital: Math.round(distanceFromHospital / 1000),
          hospitalInfo: {
            name: hospital.hospitalName,
            address: hospital.address,
            availableBeds: hospital.totalAvailableBeds,
            bedStatus: hospital.overallBedStatus,
          },
          data: surgeData,
        }
      }

      return {
        success: true,
        clickCount: savedRecord.currentClickCount,
        surgeTriggered: false,
        message: `Valid click recorded for ${hospital.hospitalName}. ${this.CLICK_THRESHOLD - savedRecord.currentClickCount} more clicks needed for surge`,
        isValidLocation: true,
        distanceFromHospital: Math.round(distanceFromHospital / 1000),
        hospitalInfo: {
          name: hospital.hospitalName,
          address: hospital.address,
          availableBeds: hospital.totalAvailableBeds,
          bedStatus: hospital.overallBedStatus,
        },
      }
    } catch (error) {
      this.logger.error(`Error handling click: ${error.message}`, error.stack)
      throw error
    }
  }

  private async getHospitalInfo(hospitalId: string): Promise<HospitalDocument | null> {
    try {
      // Use the comprehensive hospital schema to get full hospital information
      let hospital = null

      // Try to find by ObjectId first (for _id field)
      if (this.isValidObjectId(hospitalId)) {
        hospital = await this.hospitalModel
          .findById(hospitalId)
          .select(
            "_id hospitalName address latitude longitude placeId totalBedCount totalAvailableBeds overallBedStatus availableSpecialties emergencyServices contactInformation",
          )
          .lean()
          .exec()
      }

      // If not found by _id, try by placeId (for Google Places integration)
      if (!hospital) {
        hospital = await this.hospitalModel
          .findOne({ placeId: hospitalId })
          .select(
            "_id hospitalName address latitude longitude placeId totalBedCount totalAvailableBeds overallBedStatus availableSpecialties emergencyServices contactInformation",
          )
          .lean()
          .exec()
      }

      // If still not found, try by hospitalName (fallback)
      if (!hospital) {
        hospital = await this.hospitalModel
          .findOne({ hospitalName: { $regex: hospitalId, $options: "i" } })
          .select(
            "_id hospitalName address latitude longitude placeId totalBedCount totalAvailableBeds overallBedStatus availableSpecialties emergencyServices contactInformation",
          )
          .lean()
          .exec()
      }

      if (!hospital || !hospital.latitude || !hospital.longitude) {
        this.logger.error(`Hospital ${hospitalId} not found or missing coordinates`)
        return null
      }

      return hospital
    } catch (error) {
      this.logger.error(`Error getting hospital information: ${error.message}`)
      return null
    }
  }

  private async trackInvalidClick(
    hospitalId: string,
    clickData: ClickData,
    distance: number,
    hospital: HospitalDocument,
  ): Promise<void> {
    try {
      let hospitalClick = await this.hospitalClickModel.findOne({ hospitalId })

      if (!hospitalClick) {
        hospitalClick = new this.hospitalClickModel({
          hospitalId,
          hospitalLocation: {
            latitude: hospital.latitude,
            longitude: hospital.longitude,
          },
          currentClickCount: 0,
          currentClickSessions: [],
          currentClickDetails: [],
          surgeHistory: [],
          status: "active",
          totalSurgesTriggered: 0,
          totalValidClicks: 0,
          totalInvalidClicks: 0,
        })
      }

      hospitalClick.totalInvalidClicks += 1
      await hospitalClick.save()

      this.logger.log(
        `Invalid click tracked for ${hospital.hospitalName}. Total invalid: ${hospitalClick.totalInvalidClicks}`,
      )
    } catch (error) {
      this.logger.error(`Error tracking invalid click: ${error.message}`)
    }
  }

  private async triggerSurge(hospitalClick: HospitalClickDocument, hospital: HospitalDocument): Promise<SurgeData> {
    try {
      // Get valid clicks within the time window
      const validClicks = hospitalClick.currentClickDetails.filter(
        (detail) => detail.isValid && this.isWithinClickWindow(detail.timestamp),
      )

      // Calculate average location from all valid clicks
      const averageLocation = this.calculateAverageLocation(validClicks)

      // Calculate distances for metadata
      const distances = validClicks.map((click) => click.distanceFromHospital)
      const maxDistance = Math.max(...distances)
      const minDistance = Math.min(...distances)

      // Calculate time to surge (from first click to surge trigger)
      const firstClickTime = validClicks[0]?.timestamp || new Date()
      const timeToSurge = Date.now() - firstClickTime.getTime()

      // Generate unique surge ID
      const surgeId = `surge_${hospitalClick.hospitalId}_${Date.now()}_${hospitalClick.totalSurgesTriggered + 1}`

      // Create surge event record with hospital information
      const surgeEvent: SurgeEvent = {
        surgeId,
        triggeredAt: new Date(),
        clickCount: validClicks.length,
        contributingClicks: validClicks.map((click) => ({
          sessionId: click.sessionId,
          latitude: click.latitude,
          longitude: click.longitude,
          timestamp: click.timestamp,
          distanceFromHospital: click.distanceFromHospital,
          userAgent: click.userAgent,
          ipAddress: click.ipAddress,
        })),
        averageClickLocation: averageLocation,
        timeToSurge,
      }

      // Add to surge history
      hospitalClick.surgeHistory.push(surgeEvent)
      hospitalClick.totalSurgesTriggered += 1
      hospitalClick.lastSurgeTime = new Date()
      hospitalClick.status = "surge_triggered"

      // Reset current click tracking for next surge window
      hospitalClick.currentClickCount = 0
      hospitalClick.currentClickSessions = []
      hospitalClick.currentClickDetails = []

      await hospitalClick.save()

      // Create comprehensive surge data with hospital information
      const surgeData: SurgeData = {
        hospitalId: hospitalClick.hospitalId,
        surgeId,
        clickCount: validClicks.length,
        hospitalInfo: {
          _id: hospital._id.toString(),
          hospitalName: hospital.hospitalName,
          address: hospital.address,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          placeId: hospital.placeId,
          totalAvailableBeds: hospital.totalAvailableBeds || 0,
          overallBedStatus: hospital.overallBedStatus || "Unknown",
        },
        contributingLocations: validClicks.map((click) => ({
          sessionId: click.sessionId,
          latitude: click.latitude,
          longitude: click.longitude,
          timestamp: click.timestamp,
          distanceFromHospital: click.distanceFromHospital,
        })),
        averageClickLocation: averageLocation,
        metadata: {
          totalUniqueSessions: [...new Set(validClicks.map((c) => c.sessionId))].length,
          timeToSurge,
          maxDistanceFromHospital: maxDistance,
          minDistanceFromHospital: minDistance,
          surgeNumber: hospitalClick.totalSurgesTriggered,
          timeWindowStart: firstClickTime,
          timeWindowEnd: new Date(),
          hospitalCapacityInfo: {
            totalBeds: hospital.totalBedCount || 0,
            availableBeds: hospital.totalAvailableBeds || 0,
            bedStatus: hospital.overallBedStatus || "Unknown",
            specialties: hospital.availableSpecialties || [],
          },
        },
      }

      // Emit surge event
      this.eventEmitter.emit("hospital.surge.triggered", surgeData)

      this.logger.log(`✅ Surge ${surgeId} triggered for ${hospital.hospitalName}`, {
        clickCount: validClicks.length,
        uniqueSessions: surgeData.metadata.totalUniqueSessions,
        timeToSurge: `${Math.round(timeToSurge / 1000)}s`,
        surgeNumber: hospitalClick.totalSurgesTriggered,
        averageDistance: `${Math.round(distances.reduce((a, b) => a + b, 0) / distances.length / 1000)}km`,
        hospitalCapacity: `${hospital.totalAvailableBeds}/${hospital.totalBedCount} beds available`,
        bedStatus: hospital.overallBedStatus,
      })

      return surgeData
    } catch (error) {
      this.logger.error(`Error triggering surge: ${error.message}`, error.stack)
      throw error
    }
  }

  private calculateAverageLocation(clicks: Array<{ latitude: number; longitude: number }>): {
    latitude: number
    longitude: number
  } {
    if (clicks.length === 0) {
      return { latitude: 0, longitude: 0 }
    }

    const sum = clicks.reduce(
      (acc, click) => ({
        latitude: acc.latitude + click.latitude,
        longitude: acc.longitude + click.longitude,
      }),
      { latitude: 0, longitude: 0 },
    )

    return {
      latitude: sum.latitude / clicks.length,
      longitude: sum.longitude / clicks.length,
    }
  }

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

  private isWithinClickWindow(timestamp: Date): boolean {
    const now = new Date()
    const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60)
    return diffMinutes <= this.CLICK_WINDOW_MINUTES
  }

  private isInSurgeCooldown(hospitalClick: HospitalClickDocument): boolean {
    if (!hospitalClick.lastSurgeTime) return false

    const now = new Date()
    const diffMinutes = (now.getTime() - hospitalClick.lastSurgeTime.getTime()) / (1000 * 60)
    return diffMinutes < this.SURGE_WINDOW_MINUTES
  }

  private getSurgeCooldownRemaining(hospitalClick: HospitalClickDocument): number {
    if (!hospitalClick.lastSurgeTime) return 0

    const now = new Date()
    const diffMinutes = (now.getTime() - hospitalClick.lastSurgeTime.getTime()) / (1000 * 60)
    return Math.max(0, this.SURGE_WINDOW_MINUTES - diffMinutes)
  }

  private async cleanupOldClicks(hospitalId: string): Promise<void> {
    try {
      const hospitalClick = await this.hospitalClickModel.findOne({ hospitalId })
      if (hospitalClick) {
        // Filter out old clicks
        const validClicks = hospitalClick.currentClickDetails.filter((detail) =>
          this.isWithinClickWindow(detail.timestamp),
        )

        const uniqueSessions = [...new Set(validClicks.map((detail) => detail.sessionId))]

        hospitalClick.currentClickCount = validClicks.length
        hospitalClick.currentClickSessions = uniqueSessions
        hospitalClick.currentClickDetails = validClicks

        // Reset surge status if no valid clicks remain and not in cooldown
        if (validClicks.length === 0 && !this.isInSurgeCooldown(hospitalClick)) {
          hospitalClick.status = "active"
        }

        await hospitalClick.save()
      }
    } catch (error) {
      this.logger.error(`Error cleaning up old clicks: ${error.message}`)
    }
  }

  private isValidObjectId(id: any): boolean {
    if (!id || typeof id !== "string") {
      return false
    }
    return /^[0-9a-fA-F]{24}$/.test(id)
  }

  // Enhanced public methods with hospital information
  async getHospitalClicks(hospitalId: string): Promise<HospitalClick | null> {
    return await this.hospitalClickModel.findOne({ hospitalId })
  }

  async resetClicks(hospitalId: string): Promise<void> {
    await this.hospitalClickModel.updateOne(
      { hospitalId },
      {
        currentClickCount: 0,
        currentClickSessions: [],
        currentClickDetails: [],
        status: "active",
        $unset: { lastSurgeTime: 1 },
      },
    )
  }

  async getClickStatistics(hospitalId: string): Promise<any> {
    const hospitalClick = await this.hospitalClickModel.findOne({ hospitalId })
    const hospital = await this.getHospitalInfo(hospitalId)

    if (!hospitalClick) {
      return {
        hospitalId,
        hospitalInfo: hospital
          ? {
              name: hospital.hospitalName,
              address: hospital.address,
              availableBeds: hospital.totalAvailableBeds,
              totalBeds: hospital.totalBedCount,
              bedStatus: hospital.overallBedStatus,
              specialties: hospital.availableSpecialties,
            }
          : null,
        currentClickCount: 0,
        uniqueSessions: 0,
        status: "active",
        totalSurgesTriggered: 0,
        totalValidClicks: 0,
        totalInvalidClicks: 0,
        inSurgeCooldown: false,
        clicksNeeded: this.CLICK_THRESHOLD,
        locationRadius: this.LOCATION_RADIUS_KM,
        surgeWindow: this.SURGE_WINDOW_MINUTES,
      }
    }

    const validClicks = hospitalClick.currentClickDetails.filter(
      (detail) => detail.isValid && this.isWithinClickWindow(detail.timestamp),
    )

    return {
      hospitalId,
      hospitalInfo: hospital
        ? {
            name: hospital.hospitalName,
            address: hospital.address,
            availableBeds: hospital.totalAvailableBeds,
            totalBeds: hospital.totalBedCount,
            bedStatus: hospital.overallBedStatus,
            specialties: hospital.availableSpecialties,
            emergencyServices: hospital.emergencyServices,
            contactInformation: hospital.contactInformation,
          }
        : null,
      currentClickCount: validClicks.length,
      uniqueSessions: [...new Set(validClicks.map((d) => d.sessionId))].length,
      status: hospitalClick.status,
      lastClickTime: hospitalClick.lastClickTime,
      lastSurgeTime: hospitalClick.lastSurgeTime,
      totalSurgesTriggered: hospitalClick.totalSurgesTriggered,
      totalValidClicks: hospitalClick.totalValidClicks,
      totalInvalidClicks: hospitalClick.totalInvalidClicks,
      inSurgeCooldown: this.isInSurgeCooldown(hospitalClick),
      clicksNeeded: Math.max(0, this.CLICK_THRESHOLD - validClicks.length),
      locationRadius: this.LOCATION_RADIUS_KM,
      surgeWindow: this.SURGE_WINDOW_MINUTES,
      cooldownRemaining: this.getSurgeCooldownRemaining(hospitalClick),
      surgeHistory: hospitalClick.surgeHistory.slice(-5), // Last 5 surges
      hospitalLocation: hospitalClick.hospitalLocation,
    }
  }

  async getSurgeHistory(hospitalId: string, limit = 10): Promise<SurgeEvent[]> {
    const hospitalClick = await this.hospitalClickModel.findOne({ hospitalId })
    if (!hospitalClick) return []

    return hospitalClick.surgeHistory.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()).slice(0, limit)
  }

  // New method to get hospitals near a location (useful for regional surge analysis)
  async getHospitalsNearLocation(latitude: number, longitude: number, radiusKm = 50): Promise<HospitalDocument[]> {
    try {
      // Use the hospital schema's geospatial capabilities
      const hospitals = await this.hospitalModel
        .find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude], // GeoJSON uses [lng, lat] order
              },
              $maxDistance: radiusKm * 1000, // Convert km to meters
            },
          },
          isActive: true,
        })
        .select("_id hospitalName address latitude longitude totalAvailableBeds overallBedStatus availableSpecialties")
        .limit(20)
        .exec()

      return hospitals
    } catch (error) {
      this.logger.error(`Error finding hospitals near location: ${error.message}`)
      return []
    }
  }
}

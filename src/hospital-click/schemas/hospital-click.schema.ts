
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type HospitalClickDocument = HospitalClick & Document

// Define the SurgeEvent as a separate class for proper typing
@Schema({ _id: false })
export class SurgeEvent {
  @Prop({ required: true })
  surgeId: string

  @Prop({ required: true })
  triggeredAt: Date

  @Prop({ required: true })
  clickCount: number

  @Prop({
    type: [
      {
        sessionId: String,
        latitude: Number,
        longitude: Number,
        timestamp: Date,
        distanceFromHospital: Number,
        userAgent: String,
        ipAddress: String,
      },
    ],
    required: true,
  })
  contributingClicks: Array<{
    sessionId: string
    latitude: number
    longitude: number
    timestamp: Date
    distanceFromHospital: number
    userAgent?: string
    ipAddress?: string
  }>

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
    },
    required: true,
  })
  averageClickLocation: {
    latitude: number
    longitude: number
  }

  @Prop({ required: true })
  timeToSurge: number // milliseconds from first click to surge trigger
}

export const SurgeEventSchema = SchemaFactory.createForClass(SurgeEvent)

@Schema({ timestamps: true })
export class HospitalClick {
  @Prop({ required: true, index: true })
  hospitalId: string

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
    },
    required: true,
    index: "2dsphere", // Geospatial index for location queries
  })
  hospitalLocation: {
    latitude: number
    longitude: number
  }

  @Prop({ required: true, default: 0 })
  currentClickCount: number

  @Prop({ type: [String], default: [] })
  currentClickSessions: string[]

  @Prop({
    type: [
      {
        sessionId: String,
        latitude: Number,
        longitude: Number,
        timestamp: Date,
        distanceFromHospital: Number,
        userAgent: String,
        ipAddress: String,
        isValid: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  currentClickDetails: Array<{
    sessionId: string
    latitude: number
    longitude: number
    timestamp: Date
    distanceFromHospital: number
    userAgent?: string
    ipAddress?: string
    isValid: boolean
  }>

  @Prop({ type: [SurgeEventSchema], default: [] })
  surgeHistory: SurgeEvent[]

  @Prop({ type: Date, default: Date.now })
  lastClickTime: Date

  @Prop({ type: Date })
  lastSurgeTime?: Date

  @Prop({ default: "active" })
  status: string // active, surge_triggered, cooldown

  @Prop({ default: 0 })
  totalSurgesTriggered: number

  @Prop({ default: 0 })
  totalValidClicks: number

  @Prop({ default: 0 })
  totalInvalidClicks: number // clicks outside 30km radius
}

export const HospitalClickSchema = SchemaFactory.createForClass(HospitalClick)

// Add compound indexes for better performance
HospitalClickSchema.index({ hospitalId: 1, lastClickTime: 1 })
HospitalClickSchema.index({ hospitalId: 1, status: 1 })
HospitalClickSchema.index({ hospitalLocation: "2dsphere" })

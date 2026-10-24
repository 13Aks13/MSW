# Data Model: Async Pack Import

## ImportJob

- id: string (uuid)
- bundleType: resource | behavior
- duplicatePolicy: skip | replace | rename
- filePath: string
- status: queued | active | completed | failed | cancelled
- progress: number (0-100)
- currentStep: string
- logs: string[]
- report: ImportReport | null
- error: string | null
- createdAt: Date
- updatedAt: Date
- completedAt: Date | null

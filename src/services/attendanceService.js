import { delay, readStore, storeKeys } from './localStore.js'

// Sirf Dashboard ka "Today's Attendance" abhi isse chalta hai (daily attendance API ready hone tak).
// Overrides / correction ab store/api/attendanceOverridesApi.js se chalte hain.
export const getAttendance = () => delay(readStore(storeKeys.attendance))
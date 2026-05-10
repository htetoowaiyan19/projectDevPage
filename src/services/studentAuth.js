import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

const STUDENT_COLLECTION = 'members'
const ROLL_NUMBER_PREFIX = 'IV IT - '

export function formatRollNumber(value) {
  return `${ROLL_NUMBER_PREFIX}${value}`
}

export async function fetchStudentByRollNumber(value) {
  const normalizedValue = String(value).trim()

  if (!normalizedValue) {
    return null
  }

  const rollNumber = formatRollNumber(normalizedValue)
  const studentsRef = collection(db, STUDENT_COLLECTION)
  const studentQuery = query(
    studentsRef,
    where('RollNumber', '==', rollNumber),
    limit(1),
  )

  const snapshot = await getDocs(studentQuery)

  if (snapshot.empty) {
    return null
  }

  const [studentDoc] = snapshot.docs
  const data = studentDoc.data()

  return {
    id: studentDoc.id,
    name: data.Name ?? '',
    password: data.Password ?? '',
    adminPassword: data.AdminPassword ?? '',
    isAdmin: Boolean(data.IsAdmin),
    hasProject: Boolean(data.HasProject),
    submittedProjectId: data.SubmittedProjectId ?? '',
    hasVoted: Boolean(data.HasVoted),
    votePoint: Number(data.VotePoint ?? 1),
    isLeader: Boolean(data.IsLeader),
    role: data.Role ?? '',
    rollNumber: data.RollNumber ?? rollNumber,
  }
}

export { ROLL_NUMBER_PREFIX, STUDENT_COLLECTION }
